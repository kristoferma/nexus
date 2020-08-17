import * as Logger from '@nexus/logger';
import * as NexusSchema from '@nexus/schema';
import * as Plugin from '../lib/plugin';
import { RuntimeContributions } from '../lib/plugin';
import { Index } from '../lib/utils';
import * as Lifecycle from './lifecycle';
import * as Schema from './schema';
import * as Server from './server';
import * as Settings from './settings';
export interface App {
    /**
     * [API Reference](https://nxs.li/docs/api/logger) ⌁ [Guide](https://nxs.li/docs/guides/logger) ⌁ [Issues](https://nxs.li/issues/components/logger)
     */
    log: Logger.Logger;
    /**
     * [API Reference](https://nxs.li/docs/api/server) ⌁ [Guide](https://nxs.li/docs/guides/server) ⌁ [Issues](https://nxs.li/issues/components/server)
     */
    server: Server.Server;
    /**
     * [API Reference](https://nxs.li/docs/api/schema) ⌁ [Guide](https://nxs.li/docs/guides/schema) ⌁ [Issues](https://nxs.li/issues/components/schema)
     */
    schema: Schema.Schema;
    /**
     * [API Reference](https://nxs.li/docs/api/settings) ⌁ [Issues](https://nxs.li/issues/components/settings)
     */
    settings: Settings.Settings;
    /**
     * [API Reference](https://nxs.li/docs/api/on) ⌁ [Issues](https://nxs.li/issues/components/lifecycle)
     *
     * Use the lifecycle component to tap into application events.
     */
    on: Lifecycle.Lifecycle;
    /**
     * [API Reference](https://nxs.li/docs/api/use-plugins) ⌁ [Issues](https://nxs.li/issues/components/plugins)
     */
    use(plugin: Plugin.Plugin): void;
    /**
     * Run this to gather the final state of all Nexus api interactions. This method
     * is experimental. It provides experimental support for NextJS integration.
     *
     * In a regular Nexus app, you should not need to use this method.
     *
     * @experimental
     */
    assemble(): any;
    /**
     * This method makes it possible to reset the state of the singleton. This can
     * be useful when working in a development environment where multiple runs of
     * the app (or run-like, e.g. Node module cache being reset) can take place
     * without having state reset. Such an example of that is the Next.js dev
     * mode.
     *
     * @experimental
     */
    reset(): any;
    /**
     * todo
     */
    start(): any;
    /**
     * todo
     */
    stop(): any;
}
export declare type AppState = {
    plugins: Plugin.Plugin[];
    /**
     * Once the app is started incremental component APIs can no longer be used. This
     * flag let's those APIs detect that they are being used after app start. Then
     * they can do something useful like tell the user about their mistake.
     */
    assembled: null | {
        settings: Settings.SettingsData;
        schema: NexusSchema.core.NexusGraphQLSchema;
        missingTypes: Index<NexusSchema.core.MissingType>;
        loadedPlugins: RuntimeContributions<any>[];
        createContext: Schema.ContextAdder;
    };
    running: boolean;
    components: {
        schema: Schema.LazyState;
        lifecycle: Lifecycle.LazyState;
    };
};
export declare type PrivateApp = App & {
    private: {
        state: AppState;
    };
};
/**
 * Create new app state. Be careful to pass this state to components to complete its
 * data. The data returned only contains core state, despite what the return
 * type says.
 */
export declare function createAppState(): AppState;
/**
 * Create an app instance
 */
export declare function create(): App;
//# sourceMappingURL=app.d.ts.map