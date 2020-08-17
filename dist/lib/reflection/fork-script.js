"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const Either_1 = require("fp-ts/lib/Either");
const start_1 = require("../../runtime/start");
const Layout = tslib_1.__importStar(require("../layout"));
const Plugin = tslib_1.__importStar(require("../plugin"));
const utils_1 = require("../utils");
const stage_1 = require("./stage");
const typegen_1 = require("./typegen");
async function run() {
    if (!process.env.NEXUS_REFLECTION_LAYOUT) {
        throw new Error('process.env.NEXUS_REFLECTION_LAYOUT is required');
    }
    const app = require('../../').default;
    const layout = Layout.createFromData(JSON.parse(process.env.NEXUS_REFLECTION_LAYOUT));
    const appRunner = start_1.createDevAppRunner(layout, app, {
        catchUnhandledErrors: false,
    });
    try {
        await appRunner.start();
    }
    catch (err) {
        sendErrorToParent(err, 'runtime-error');
    }
    if (stage_1.isReflectionStage('typegen')) {
        try {
            const plugins = Plugin.importAndLoadRuntimePlugins(app.private.state.plugins, app.private.state.components.schema.scalars);
            const artifactsRes = await typegen_1.writeArtifacts({
                graphqlSchema: app.private.state.assembled.schema,
                layout,
                schemaSettings: app.settings.current.schema,
                plugins,
            });
            if (Either_1.isLeft(artifactsRes)) {
                sendErrorToParent(artifactsRes.left, 'ts-error');
            }
            else {
                sendDataToParent({
                    type: 'success-typegen',
                });
            }
            return;
        }
        catch (err) {
            sendErrorToParent(err, 'runtime-error');
        }
    }
    function sendDataToParent(message) {
        if (!process.send) {
            throw new Error('process.send is undefined, could not send the plugins back to the main process');
        }
        process.send(message);
    }
    function sendErrorToParent(err, type) {
        sendDataToParent({ type, data: { serializedError: utils_1.serializeError(err) } });
    }
}
run();
//# sourceMappingURL=fork-script.js.map