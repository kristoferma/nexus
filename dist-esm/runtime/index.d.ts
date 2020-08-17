import * as App from './app';
/**
 * [API Reference](https://nxs.li/docs/api/app) ⌁ [Issues](https://nxs.li/issues) ⌁ [Discussions](https://nxs.li/discussions) ⌁ [Tweets](https://nxs.li/tweets)
 */
declare const app: App.App;
export default app;
/**
 * Destructure the app for named-export access. This is sugar, and to help
 * auto-import workflows. Not everything on `app` is name-exported. Just those
 * things that are part of every-day work.
 *
 * WARNING Do not use destructuring syntax here, it will not be jsdocable.
 *
 * WARNING Make sure that jsdoc edits here are ported to runtime/app
 */
/**
 * [API Reference](https://nxs.li/docs/api/logger) ⌁ [Guide](https://nxs.li/docs/guides/logger) ⌁ [Issues](https://nxs.li/issues/components/logger)
 */
export declare const log: import("@nexus/logger").Logger;
/**
 * [API Reference](https://nxs.li/docs/api/server) ⌁ [Guide](https://nxs.li/docs/guides/server) ⌁ [Issues](https://nxs.li/issues/components/server)
 */
export declare const server: import("./server").Server;
/**
 * [API Reference](https://nxs.li/docs/api/schema) ⌁ [Guide](https://nxs.li/docs/guides/schema) ⌁ [Issues](https://nxs.li/issues/components/schema)
 */
export declare const schema: import("./schema").Schema;
/**
 * [API Reference](https://nxs.li/docs/api/settings) ⌁ [Issues](https://nxs.li/issues/components/settings)
 */
export declare const settings: import("./settings").Settings;
/**
 * [API Reference](https://nxs.li/docs/api/on) ⌁ [Issues](https://nxs.li/issues/components/lifecycle)
 *
 * Use the lifecycle component to tap into application events.
 */
export declare const on: import("./lifecycle").Lifecycle;
/**
 * [API Reference](https://nxs.li/docs/api/use-plugins) ⌁ [Issues](https://nxs.li/issues/components/plugins)
 */
export declare const use: (plugin: import("../lib/plugin").Plugin<any>) => void;
//# sourceMappingURL=index.d.ts.map