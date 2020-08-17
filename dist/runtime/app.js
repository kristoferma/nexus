"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.create = exports.createAppState = void 0;
const tslib_1 = require("tslib");
const Logger = tslib_1.__importStar(require("@nexus/logger"));
const nexus_logger_1 = require("../lib/nexus-logger");
const Plugin = tslib_1.__importStar(require("../lib/plugin"));
const Reflection = tslib_1.__importStar(require("../lib/reflection/stage"));
const scalars_1 = require("../lib/scalars");
const Lifecycle = tslib_1.__importStar(require("./lifecycle"));
const Schema = tslib_1.__importStar(require("./schema"));
const Server = tslib_1.__importStar(require("./server"));
const Settings = tslib_1.__importStar(require("./settings"));
const utils_1 = require("./utils");
const log = Logger.log.child('app');
/**
 * Create new app state. Be careful to pass this state to components to complete its
 * data. The data returned only contains core state, despite what the return
 * type says.
 */
function createAppState() {
    const appState = {
        assembled: null,
        running: false,
        plugins: [],
        components: {},
    };
    return appState;
}
exports.createAppState = createAppState;
/**
 * Create an app instance
 */
function create() {
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
            nexus_logger_1.rootLogger.debug('resetting state');
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
            utils_1.assertAppNotAssembled(state, 'app.use', 'The plugin you attempted to use will be ignored');
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
        app.schema.importType(scalars_1.builtinScalars.DateTime, 'date');
        app.schema.importType(scalars_1.builtinScalars.Json, 'json');
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
exports.create = create;
//# sourceMappingURL=app.js.map