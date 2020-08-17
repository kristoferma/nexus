import { fork } from 'child_process';
import * as Path from 'path';
import { createDevAppRunner } from '../../runtime/start';
import { rootLogger } from '../nexus-logger';
import { deserializeError } from '../utils';
import { getReflectionStageEnv, setReflectionStage, unsetReflectionStage } from './stage';
const log = rootLogger.child('reflection');
export async function reflect(layout, opts) {
    log.trace('reflection started');
    if (opts.artifacts) {
        return runTypegenReflectionAsSubProcess(layout);
    }
    if (opts.usedPlugins === true && opts.onMainThread === false) {
        throw new Error('Not implemented. Reflection on plugins needs to be done on the main process for now.');
    }
    return runPluginsReflectionOnMainThread(layout);
}
/**
 * Hack: Plugins should ideally be discovered in a sub-process.
 * This is temporary until https://github.com/graphql-nexus/nexus/issues/818 is fixed
 */
export async function runPluginsReflectionOnMainThread(layout) {
    const app = require('../../').default;
    const appRunner = createDevAppRunner(layout, app, {
        catchUnhandledErrors: false,
    });
    setReflectionStage('plugin');
    try {
        await appRunner.start();
        unsetReflectionStage();
        return { success: true, plugins: app.private.state.plugins };
    }
    catch (error) {
        return { success: false, error };
    }
}
export function runTypegenReflectionAsSubProcess(layout) {
    return new Promise((resolve) => {
        var _a;
        const cp = fork(Path.join(__dirname, 'fork-script.js'), [], {
            cwd: layout.projectRoot,
            stdio: process.env.DEBUG ? 'inherit' : 'pipe',
            env: Object.assign(Object.assign(Object.assign({}, process.env), { NEXUS_REFLECTION_LAYOUT: JSON.stringify(layout.data) }), getReflectionStageEnv('typegen')),
        });
        cp.on('message', (message) => {
            if (message.type === 'success-typegen') {
                resolve({ success: true });
            }
            if (message.type === 'ts-error') {
                resolve({ success: false, type: 'ts-error', error: deserializeError(message.data.serializedError) });
            }
            if (message.type === 'runtime-error') {
                resolve({
                    success: false,
                    type: 'runtime-error',
                    error: deserializeError(message.data.serializedError),
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
//# sourceMappingURL=reflect.js.map