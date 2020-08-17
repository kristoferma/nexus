"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTestContext = void 0;
const tslib_1 = require("tslib");
const Either_1 = require("fp-ts/lib/Either");
const get_port_1 = tslib_1.__importDefault(require("get-port"));
const Lo = tslib_1.__importStar(require("lodash"));
const graphql_client_1 = require("../lib/graphql-client");
const Layout = tslib_1.__importStar(require("../lib/layout"));
const nexus_logger_1 = require("../lib/nexus-logger");
const PluginRuntime = tslib_1.__importStar(require("../lib/plugin"));
const PluginWorktime = tslib_1.__importStar(require("../lib/plugin/worktime"));
const utils_1 = require("../lib/utils");
const runtime_1 = tslib_1.__importDefault(require("../runtime"));
const start_1 = require("../runtime/start");
const pluginLogger = nexus_logger_1.rootLogger.child('plugin');
/**
 * Setup a test context providing utilities to query against your GraphQL API
 *
 * @example
 *
 * With jest
 * ```ts
 * import { createTestContext, TestContext } from 'nexus/testing'
 *
 * let ctx: TestContext
 *
 * beforeAll(async () => {
 *   ctx = await createTestContext()
 *   await ctx.app.start()
 * })
 *
 * afterAll(async () => {
 *   await ctx.app.stop()
 * })
 * ```
 */
async function createTestContext(opts) {
    // Guarantee that development mode features are on
    process.env.NEXUS_STAGE = 'dev';
    // todo figure out some caching system here, e.g. imagine jest --watch mode
    const layout = utils_1.rightOrFatal(await Layout.create({ entrypointPath: opts === null || opts === void 0 ? void 0 : opts.entrypointPath, projectRoot: opts === null || opts === void 0 ? void 0 : opts.projectRoot }));
    const pluginManifests = await PluginWorktime.getUsedPlugins(layout);
    const randomPort = await get_port_1.default({ port: get_port_1.default.makeRange(4000, 6000) });
    const privateApp = runtime_1.default;
    const forcedServerSettings = {
        port: randomPort,
        playground: false,
        startMessage() { },
    };
    // todo remove these settings hacks once we have https://github.com/graphql-nexus/nexus/issues/758
    const originalSettingsChange = privateApp.settings.change;
    privateApp.settings.change({
        server: forcedServerSettings,
    });
    /**
     * If app ever calls app.settings.change, force some server settings anyway
     */
    privateApp.settings.change = (newSettings) => {
        if (newSettings.server !== undefined) {
            newSettings.server = Object.assign(Object.assign({}, newSettings.server), forcedServerSettings);
        }
        originalSettingsChange(newSettings);
    };
    const appRunner = await start_1.createDevAppRunner(layout, privateApp);
    const apiUrl = `http://localhost:${appRunner.port}/graphql`;
    const client = new graphql_client_1.GraphQLClient(apiUrl);
    const api = {
        client,
        app: {
            start: appRunner.start,
            stop: appRunner.stop,
        },
    };
    const testContextContributions = PluginRuntime.importAndLoadTesttimePlugins(pluginManifests);
    for (const testContextContribution of testContextContributions) {
        if (Either_1.isLeft(testContextContribution)) {
            pluginLogger.error(testContextContribution.left.message, { error: testContextContribution.left });
            continue;
        }
        Lo.merge(api, testContextContribution.right);
    }
    return api;
}
exports.createTestContext = createTestContext;
//# sourceMappingURL=testing.js.map