"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.use = exports.on = exports.settings = exports.schema = exports.server = exports.log = void 0;
const tslib_1 = require("tslib");
const App = tslib_1.__importStar(require("./app"));
/**
 * [API Reference](https://nxs.li/docs/api/app) ⌁ [Issues](https://nxs.li/issues) ⌁ [Discussions](https://nxs.li/discussions) ⌁ [Tweets](https://nxs.li/tweets)
 */
const app = App.create();
exports.default = app;
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
exports.log = app.log;
/**
 * [API Reference](https://nxs.li/docs/api/server) ⌁ [Guide](https://nxs.li/docs/guides/server) ⌁ [Issues](https://nxs.li/issues/components/server)
 */
exports.server = app.server;
/**
 * [API Reference](https://nxs.li/docs/api/schema) ⌁ [Guide](https://nxs.li/docs/guides/schema) ⌁ [Issues](https://nxs.li/issues/components/schema)
 */
exports.schema = app.schema;
/**
 * [API Reference](https://nxs.li/docs/api/settings) ⌁ [Issues](https://nxs.li/issues/components/settings)
 */
exports.settings = app.settings;
/**
 * [API Reference](https://nxs.li/docs/api/on) ⌁ [Issues](https://nxs.li/issues/components/lifecycle)
 *
 * Use the lifecycle component to tap into application events.
 */
exports.on = app.on;
/**
 * [API Reference](https://nxs.li/docs/api/use-plugins) ⌁ [Issues](https://nxs.li/issues/components/plugins)
 */
exports.use = app.use;
//# sourceMappingURL=index.js.map