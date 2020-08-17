"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runTypegenReflectionAsSubProcess = exports.runPluginsReflectionOnMainThread = exports.reflect = void 0;
const tslib_1 = require("tslib");
const child_process_1 = require("child_process");
const Path = tslib_1.__importStar(require("path"));
const start_1 = require("../../runtime/start");
const nexus_logger_1 = require("../nexus-logger");
const utils_1 = require("../utils");
const stage_1 = require("./stage");
const log = nexus_logger_1.rootLogger.child('reflection');
async function reflect(layout, opts) {
    log.trace('reflection started');
    if (opts.artifacts) {
        return runTypegenReflectionAsSubProcess(layout);
    }
    if (opts.usedPlugins === true && opts.onMainThread === false) {
        throw new Error('Not implemented. Reflection on plugins needs to be done on the main process for now.');
    }
    return runPluginsReflectionOnMainThread(layout);
}
exports.reflect = reflect;
/**
 * Hack: Plugins should ideally be discovered in a sub-process.
 * This is temporary until https://github.com/graphql-nexus/nexus/issues/818 is fixed
 */
async function runPluginsReflectionOnMainThread(layout) {
    const app = require('../../').default;
    const appRunner = start_1.createDevAppRunner(layout, app, {
        catchUnhandledErrors: false,
    });
    stage_1.setReflectionStage('plugin');
    try {
        await appRunner.start();
        stage_1.unsetReflectionStage();
        return { success: true, plugins: app.private.state.plugins };
    }
    catch (error) {
        return { success: false, error };
    }
}
exports.runPluginsReflectionOnMainThread = runPluginsReflectionOnMainThread;
function runTypegenReflectionAsSubProcess(layout) {
    return new Promise((resolve) => {
        var _a;
        const cp = child_process_1.fork(Path.join(__dirname, 'fork-script.js'), [], {
            cwd: layout.projectRoot,
            stdio: process.env.DEBUG ? 'inherit' : 'pipe',
            env: Object.assign(Object.assign(Object.assign({}, process.env), { NEXUS_REFLECTION_LAYOUT: JSON.stringify(layout.data) }), stage_1.getReflectionStageEnv('typegen')),
        });
        cp.on('message', (message) => {
            if (message.type === 'success-typegen') {
                resolve({ success: true });
            }
            if (message.type === 'ts-error') {
                resolve({ success: false, type: 'ts-error', error: utils_1.deserializeError(message.data.serializedError) });
            }
            if (message.type === 'runtime-error') {
                resolve({
                    success: false,
                    type: 'runtime-error',
                    error: utils_1.deserializeError(message.data.serializedError),
                });
            }
        });
        cp.on('error', (err) => {
            log.trace('error', { err });
            resolve({ success: false, error: err });
        });
        (_a = cp.stderr) === null || _a === void 0 ? void 0 : _a.on('data', (err) => {
            log.trace('error', { err });
            resolve({ success: false, error: new Error(err) });
        });
        cp.on('exit', (code) => {
            if (code !== 0) {
                log.trace('failed with exit code !== 0', { code });
                resolve({
                    success: false,
                    error: new Error(`
        Runner failed with exit code "${code}".
      `),
                });
            }
        });
    });
}
exports.runTypegenReflectionAsSubProcess = runTypegenReflectionAsSubProcess;
//# sourceMappingURL=reflect.js.map