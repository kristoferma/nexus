"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Dev = void 0;
const tslib_1 = require("tslib");
const common_tags_1 = require("common-tags");
const ts_morph_1 = require("ts-morph");
const cli_1 = require("../../lib/cli");
const Layout = tslib_1.__importStar(require("../../lib/layout"));
const nexus_logger_1 = require("../../lib/nexus-logger");
const own_package_1 = require("../../lib/own-package");
const Plugin = tslib_1.__importStar(require("../../lib/plugin"));
const process_1 = require("../../lib/process");
const Reflection = tslib_1.__importStar(require("../../lib/reflection"));
const tsc_1 = require("../../lib/tsc");
const utils_1 = require("../../lib/utils");
const watcher_1 = require("../../lib/watcher");
const start_1 = require("../../runtime/start");
const log = nexus_logger_1.rootLogger.child('dev');
const DEV_ARGS = {
    '--inspect-brk': String,
    '--entrypoint': String,
    '-e': '--entrypoint',
    '--reflection': Boolean,
    '-r': '--reflection',
    '--help': Boolean,
    '-h': '--help',
};
const debouncedReflection = utils_1.simpleDebounce((layout) => {
    return Reflection.reflect(layout, { artifacts: true });
});
class Dev {
    async parse(argv) {
        var _a, _b;
        const args = cli_1.arg(argv, DEV_ARGS);
        if (cli_1.isError(args)) {
            process_1.fatal(args.message);
        }
        if (args['--help']) {
            return this.help();
        }
        const entrypointPath = args['--entrypoint'];
        const reflectionMode = args['--reflection'] === true;
        let layout = utils_1.rightOrFatal(await Layout.create({ entrypointPath }));
        const pluginReflectionResult = await Reflection.reflect(layout, { usedPlugins: true, onMainThread: true });
        // TODO: Do not fatal if reflection failed.
        // Instead, run the watcher and help the user recover
        if (!pluginReflectionResult.success) {
            process_1.fatal('reflection failed', { error: pluginReflectionResult.error });
        }
        const worktimePlugins = Plugin.importAndLoadWorktimePlugins(pluginReflectionResult.plugins, layout);
        for (const p of worktimePlugins) {
            await ((_b = (_a = p.hooks.dev).onStart) === null || _b === void 0 ? void 0 : _b.call(_a));
        }
        const runDebouncedReflection = async (layout) => {
            const reflectionResult = await debouncedReflection(layout);
            if (reflectionResult.type === 'executing') {
                return;
            }
            // if --reflection, log successes and all kind of errors
            if (args['--reflection']) {
                if (reflectionResult.data.success) {
                    log.info('reflection done');
                    log.info('waiting for file changes to run reflection...');
                }
                else {
                    log.error('reflection failed', { error: reflectionResult.data.error });
                }
            }
            else {
                // if --reflection is not passed, log only errors of type "ts-error"
                // These are the whitelisted diagnostic codes from the createTSProgram function
                // We don't want to log runtime errors as the main thread will already log them
                if (!reflectionResult.data.success && reflectionResult.data.type === 'ts-error') {
                    log.error('reflection failed', { error: reflectionResult.data.error });
                }
            }
        };
        log.info('start', { version: own_package_1.ownPackage.version });
        const devPlugin = {
            build: {},
            create: {},
            generate: {},
            dev: {
                addToWatcherSettings: {},
                async onBeforeWatcherStartOrRestart(change) {
                    if (change.type === 'change') {
                        const nexusModules = Layout.findNexusModules(layout.tsConfig, layout.app.exists ? layout.app.path : null);
                        layout.update({ nexusModules });
                    }
                    if (change.type === 'init' ||
                        change.type === 'add' ||
                        change.type === 'addDir' ||
                        change.type === 'unlink' ||
                        change.type === 'unlinkDir') {
                        log.trace('analyzing project layout');
                        layout = utils_1.rightOrFatal(await Layout.create({ entrypointPath }));
                    }
                    if (args['--reflection']) {
                        log.info('running reflection');
                    }
                    runDebouncedReflection(layout);
                    return {
                        entrypointScript: getTranspiledStartModule(layout, reflectionMode),
                    };
                },
            },
        };
        const watcher = await watcher_1.createWatcher({
            entrypointScript: getTranspiledStartModule(layout, reflectionMode),
            sourceRoot: layout.sourceRoot,
            cwd: process.cwd(),
            plugins: [devPlugin].concat(worktimePlugins.map((p) => p.hooks)),
            inspectBrk: args['--inspect-brk'],
        });
        await watcher.start();
    }
    help() {
        return common_tags_1.stripIndent `
        Usage: nexus dev [flags]
  
        Develop your application in watch mode
  
        Flags:
          -e, --entrypoint    Custom entrypoint to your app (default: app.ts)
          -r, --reflection    Run dev mode for reflection only (eg: typegen, sdl file etc..)
          -h,       --help    Show this help message
      `;
    }
}
exports.Dev = Dev;
function getTranspiledStartModule(layout, reflectionMode) {
    /**
     * We use an empty script when in reflection mode so that the user's app doesn't run.
     * The watcher will keep running though and so will reflection in the devPlugin.onBeforeWatcherStartOrRestart hook above
     */
    if (reflectionMode === true) {
        return '';
    }
    const startModule = start_1.createStartModuleContent({
        registerTypeScript: Object.assign(Object.assign({}, layout.tsConfig.content.options), { module: ts_morph_1.ts.ModuleKind.CommonJS, target: ts_morph_1.ts.ScriptTarget.ES2015 }),
        internalStage: 'dev',
        runtimePluginManifests: [],
        layout,
        absoluteModuleImports: true,
    });
    return tsc_1.transpileModule(startModule, Object.assign(Object.assign({}, layout.tsConfig.content.options), { module: ts_morph_1.ts.ModuleKind.CommonJS, target: ts_morph_1.ts.ScriptTarget.ES2015 }));
}
//# sourceMappingURL=dev.js.map