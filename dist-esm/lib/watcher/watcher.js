import anymatch from 'anymatch';
import { rootLogger } from '../nexus-logger';
import { clearConsole } from '../process';
import * as Chok from './chokidar';
import * as Link from './link';
const log = rootLogger.child('dev').child('watcher');
/**
 * Entrypoint into the watcher system.
 */
export async function createWatcher(options) {
    var _a, _b, _c, _d, _e, _f;
    // Setup the client (runner / server (watcher) system
    const link = new Link.Link({
        entrypointScript: options.entrypointScript,
        // Watch all modules imported by the user's app for changes.
        onRunnerImportedModule(data) {
            watcher.addSilently(data.filePath);
        },
        async onServerListening() {
            var _a, _b, _c;
            for (const p of options.plugins) {
                await ((_b = (_a = p.dev).onAfterWatcherRestart) === null || _b === void 0 ? void 0 : _b.call(_a));
            }
            (_c = options.events) === null || _c === void 0 ? void 0 : _c.call(options, { type: 'server_listening' });
        },
        onRunnerStdioMessage({ stdio, data }) {
            var _a;
            (_a = options.events) === null || _a === void 0 ? void 0 : _a.call(options, { type: 'runner_stdio', stdio, data });
        },
        inspectBrk: options.inspectBrk,
    });
    process.onBeforeExit(() => {
        log.trace('tearndown before exit');
        return link.stop();
    });
    // Create a file watcher
    // TODO watch for changes to tsconfig and take correct action
    // TODO watch for changes to package json and take correct action (imagine
    // there could be nexus config in there)
    // TODO restart should take place following npm install/remove yarn
    // add/remove/install etc.
    // TODO need a way to test file matching given patterns. Hard to get right,
    // right now, and feedback loop sucks. For instance allow to find prisma
    // schema anywhere except in migrations ignore it, that is hard right now.
    const pluginWatchContributions = options.plugins.reduce((patterns, p) => { var _a; return patterns.concat((_a = p.dev.addToWatcherSettings.watchFilePatterns) !== null && _a !== void 0 ? _a : []); }, []);
    const pluginIgnoreContributions = options.plugins.reduce((patterns, p) => { var _a, _b, _c; return patterns.concat((_c = (_b = (_a = p.dev.addToWatcherSettings.listeners) === null || _a === void 0 ? void 0 : _a.app) === null || _b === void 0 ? void 0 : _b.ignoreFilePatterns) !== null && _c !== void 0 ? _c : []); }, []);
    const isIgnoredByCoreListener = createPathMatcher({
        toMatch: pluginIgnoreContributions,
    });
    const watcher = Chok.watch([options.sourceRoot, ...pluginWatchContributions], {
        ignored: ['./node_modules', /(^|[\/\\])\../],
        ignoreInitial: true,
        cwd: options.cwd,
    });
    /**
     * Core watcher listener
     */
    // TODO: plugin listeners can pjobably be merged into the core listener
    watcher.on('all', (changeType, changedFile) => {
        const event = { type: changeType, file: changedFile };
        if (isIgnoredByCoreListener(changedFile)) {
            return log.trace('global listener - DID NOT match file', {
                event,
            });
        }
        else {
            log.trace('global listener - matched file', { event });
            restart(event, options.plugins);
        }
    });
    /**
     * Plugins watcher listeners
     */
    const devModePluginLens = {
        restart: (file) => {
            return restart({ type: 'plugin', file: file }, options.plugins);
        },
        pause: () => {
            return watcher.pause();
        },
        resume: () => {
            return watcher.resume();
        },
    };
    for (const plugin of options.plugins) {
        if (plugin.dev.onFileWatcherEvent) {
            const isMatchedByPluginListener = createPathMatcher({
                toMatch: (_b = (_a = plugin.dev.addToWatcherSettings.listeners) === null || _a === void 0 ? void 0 : _a.plugin) === null || _b === void 0 ? void 0 : _b.allowFilePatterns,
                toIgnore: (_d = (_c = plugin.dev.addToWatcherSettings.listeners) === null || _c === void 0 ? void 0 : _c.plugin) === null || _d === void 0 ? void 0 : _d.ignoreFilePatterns,
            });
            watcher.on('all', (event, file, stats) => {
                if (isMatchedByPluginListener(file)) {
                    log.trace('plugin listener - matched file', { file });
                    plugin.dev.onFileWatcherEvent(event, file, stats, devModePluginLens);
                }
                else {
                    log.trace('plugin listener - DID NOT match file', { file });
                }
            });
        }
    }
    watcher.on('error', (error) => {
        log.error('file watcher encountered an error', { error });
    });
    watcher.on('ready', () => {
        log.trace('ready');
    });
    let restarting = false;
    restarting = true;
    clearConsole();
    for (const plugin of options.plugins) {
        const runnerChanges = await ((_f = (_e = plugin.dev).onBeforeWatcherStartOrRestart) === null || _f === void 0 ? void 0 : _f.call(_e, {
            type: 'init',
            file: null,
        }));
        if (runnerChanges) {
            link.updateOptions(runnerChanges);
        }
    }
    await link.startOrRestart();
    restarting = false;
    // todo replace crappy `restarting` flag with an async debounce that
    // includes awaiting completion of the returned promise. Basically this
    // library + feature request
    // https://github.com/sindresorhus/p-debounce/issues/3.
    async function restart(change, plugins) {
        var _a, _b, _c;
        if (restarting) {
            log.trace('restart already in progress');
            return;
        }
        restarting = true;
        clearConsole();
        log.info('restarting', change);
        log.trace('hook', { name: 'beforeWatcherStartOrRestart' });
        for (const plugin of plugins) {
            const runnerChanges = await ((_b = (_a = plugin.dev).onBeforeWatcherStartOrRestart) === null || _b === void 0 ? void 0 : _b.call(_a, change));
            if (runnerChanges) {
                link.updateOptions(runnerChanges);
            }
        }
        log.trace('hook', { name: 'beforeWatcherRestart' });
        plugins.forEach((p) => {
            var _a, _b;
            (_b = (_a = p.dev).onBeforeWatcherRestart) === null || _b === void 0 ? void 0 : _b.call(_a);
        });
        (_c = options.events) === null || _c === void 0 ? void 0 : _c.call(options, { type: 'restart', file: change.file, reason: change.type });
        await link.startOrRestart();
        restarting = false;
        watcher.resume();
    }
    let resolveWatcherPromise = null;
    const watcherPromise = new Promise((resolve) => {
        resolveWatcherPromise = resolve;
    });
    return {
        stop: async () => {
            await watcher.close();
            await link.stop();
            resolveWatcherPromise === null || resolveWatcherPromise === void 0 ? void 0 : resolveWatcherPromise();
        },
        start: () => {
            return watcherPromise;
        },
    };
}
/**
 * todo
 */
function createPathMatcher(params) {
    var _a, _b, _c;
    const toAllow = (_a = params === null || params === void 0 ? void 0 : params.toMatch) !== null && _a !== void 0 ? _a : [];
    const toIgnore = (_c = (_b = params === null || params === void 0 ? void 0 : params.toIgnore) === null || _b === void 0 ? void 0 : _b.map((pattern) => '!' + pattern)) !== null && _c !== void 0 ? _c : [];
    const matchers = [...toAllow, ...toIgnore];
    return anymatch(matchers);
}
//# sourceMappingURL=watcher.js.map