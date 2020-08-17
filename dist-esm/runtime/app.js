import * as Logger from '@nexus/logger';
import { rootLogger } from '../lib/nexus-logger';
import * as Plugin from '../lib/plugin';
import * as Reflection from '../lib/reflection/stage';
import { builtinScalars } from '../lib/scalars';
import * as Lifecycle from './lifecycle';
import * as Schema from './schema';
import * as Server from './server';
import * as Settings from './settings';
import { assertAppNotAssembled } from './utils';
const log = Logger.log.child('app');
/**
 * Create new app state. Be careful to pass this state to components to complete its
 * data. The data returned only contains core state, despite what the return
 * type says.
 */
export function createAppState() {
    const appState = {
        assembled: null,
        running: false,
        plugins: [],
        components: {},
    };
    return appState;
}
/**
 * Create an app instance
 */
export function create() {
    const state = createAppState();
    const serverComponent = Server.create(state);
    const schemaComponent = Schema.create(state);
    const settingsComponent = Settings.create(state, {
        serverSettings: serverComponent.private.settings,
        schemaSettings: schemaComponent.private.settings,
        log: Logger.log,
    });
    const lifecycleComponent = Lifecycle.create(state);
    const app = {
        log: log,
        settings: settingsComponent.public,
        schema: schemaComponent.public,
        server: serverComponent.public,
        on: lifecycleComponent.public,
        reset() {
            rootLogger.debug('resetting state');
            schemaComponent.private.reset();
            serverComponent.private.reset();
            settingsComponent.private.reset();
            lifecycleComponent.private.reset();
            state.assembled = null;
            state.plugins = [];
            state.running = false;
            dogfood();
        },
        async start() {
            if (Reflection.isReflection())
                return;
            if (state.running)
                return;
            if (!state.assembled) {
                throw new Error('Must call app.assemble before calling app.start');
            }
            lifecycleComponent.private.trigger.start({
                schema: state.assembled.schema,
            });
            await serverComponent.private.start();
            state.running = true;
        },
        async stop() {
            if (Reflection.isReflection())
                return;
            if (!state.running)
                return;
            await serverComponent.private.stop();
            state.running = false;
        },
        use(plugin) {
            assertAppNotAssembled(state, 'app.use', 'The plugin you attempted to use will be ignored');
            state.plugins.push(plugin);
        },
        assemble() {
            if (state.assembled)
                return;
            schemaComponent.private.beforeAssembly();
            /**
             * Plugin reflection is run in the same process (eval). This means if the
             * process is the app, which it is during testing for example, then we
             * need to take extreme care to not mark assembly as complete, during
             * plugin reflection. If we did, then, when we would try to start the app,
             * it would think it is already assembled. !
             */
            if (Reflection.isReflectionStage('plugin'))
                return;
            state.assembled = {};
            const loadedPlugins = Plugin.importAndLoadRuntimePlugins(state.plugins, state.components.schema.scalars);
            state.assembled.loadedPlugins = loadedPlugins;
            const { schema, missingTypes } = schemaComponent.private.assemble(loadedPlugins);
            state.assembled.schema = schema;
            state.assembled.missingTypes = missingTypes;
            if (Reflection.isReflectionStage('typegen'))
                return;
            const { createContext } = serverComponent.private.assemble(loadedPlugins, schema);
            state.assembled.createContext = createContext;
            const { settings } = settingsComponent.private.assemble();
            state.assembled.settings = settings;
            schemaComponent.private.checks();
        },
    };
    /**
     * Dogfood the public API to change things.
     */
    function dogfood() {
        /**
         * Setup default log filter
         */
        app.settings.change({
            logger: {
                filter: 'app:*, nexus:*@info+, *@warn+',
                pretty: { timeDiff: false },
            },
        });
        /**
         * Setup default scalar types
         */
        app.schema.importType(builtinScalars.DateTime, 'date');
        app.schema.importType(builtinScalars.Json, 'json');
        /**
         * Add `req` and `res` to the context by default
         */
        app.schema.addToContext((params) => params);
    }
    // HACK dogfood function called eagerly here once and
    // then within reset method. We should have a better
    // reset system.
    dogfood();
    return Object.assign(Object.assign({}, app), { private: {
            state: state,
        } });
}
//# sourceMappingURL=app.js.map