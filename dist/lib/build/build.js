"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeStartModule = exports.buildNexusApp = void 0;
const tslib_1 = require("tslib");
const utils_1 = require("@nexus/logger/dist/utils");
const common_tags_1 = require("common-tags");
const FS = tslib_1.__importStar(require("fs-jetpack"));
const Path = tslib_1.__importStar(require("path"));
const Layout = tslib_1.__importStar(require("../../lib/layout"));
const tsc_1 = require("../../lib/tsc");
const start_module_1 = require("../../runtime/start/start-module");
const nexus_logger_1 = require("../nexus-logger");
const Plugin = tslib_1.__importStar(require("../plugin"));
const process_1 = require("../process");
const Reflection = tslib_1.__importStar(require("../reflection"));
const utils_2 = require("../utils");
const bundle_1 = require("./bundle");
const deploy_target_1 = require("./deploy-target");
const log = nexus_logger_1.rootLogger.child('build');
async function buildNexusApp(settings) {
    var _a, _b, _c, _d, _e;
    process.env.NEXUS_BUILD = 'true';
    const startTime = Date.now();
    const deploymentTarget = deploy_target_1.normalizeTarget(settings.target);
    const buildOutput = (_b = (_a = settings.output) !== null && _a !== void 0 ? _a : deploy_target_1.computeBuildOutputFromTarget(deploymentTarget)) !== null && _b !== void 0 ? _b : undefined;
    const layout = utils_2.rightOrFatal(await Layout.create({
        buildOutputDir: buildOutput,
        asBundle: settings.asBundle,
        entrypointPath: settings.entrypoint,
        projectRoot: settings.cwd,
    }));
    /**
     * Delete the TS incremental file to make sure we're building from a clean slate
     */
    tsc_1.deleteTSIncrementalFile(layout);
    if (deploymentTarget) {
        const validatedTarget = deploy_target_1.validateTarget(deploymentTarget, layout);
        if (!validatedTarget.valid) {
            process.exit(1);
        }
    }
    log.info('get used plugins');
    const pluginReflection = await Reflection.reflect(layout, { usedPlugins: true, onMainThread: true });
    if (!pluginReflection.success) {
        process_1.fatal('failed to get used plugins', { error: pluginReflection.error });
    }
    const { plugins } = pluginReflection;
    const worktimePlugins = Plugin.importAndLoadWorktimePlugins(plugins, layout);
    for (const p of worktimePlugins) {
        await ((_d = (_c = p.hooks.build).onStart) === null || _d === void 0 ? void 0 : _d.call(_c));
    }
    log.info('starting reflection');
    const reflectionResult = await Reflection.reflect(layout, { artifacts: true });
    if (!reflectionResult.success) {
        process_1.fatal('reflection failed', { error: reflectionResult.error });
    }
    log.info('building typescript program');
    const tsProject = utils_1.rightOrThrow(tsc_1.createTSProject(layout, { withCache: true }));
    log.info('compiling a production build');
    // Recreate our program instance so that it picks up the typegen. We use
    // incremental builder type of program so that the cache from the previous
    // run of TypeScript should make re-building up this one cheap.
    tsc_1.emitTSProgram(tsProject, layout, { removePreviousBuild: false });
    const gotManifests = Plugin.getPluginManifests(plugins);
    if (gotManifests.errors)
        Plugin.showManifestErrorsAndExit(gotManifests.errors);
    const runtimePluginManifests = gotManifests.data.filter((pm) => pm.runtime);
    if (!layout.tsConfig.content.options.noEmit) {
        await writeStartModule({
            layout: layout,
            startModule: start_module_1.prepareStartModule(tsProject, start_module_1.createStartModuleContent({
                internalStage: 'build',
                layout: layout,
                runtimePluginManifests,
            })),
        });
        if (layout.build.bundleOutputDir) {
            log.info('bundling app');
            await bundle_1.bundle({
                base: layout.projectRoot,
                bundleOutputDir: layout.build.bundleOutputDir,
                entrypoint: layout.build.startModuleOutPath,
                tsOutputDir: layout.build.tsOutputDir,
                tsRootDir: layout.tsConfig.content.options.rootDir,
                plugins: pluginReflection.plugins,
            });
            await FS.removeAsync(layout.build.tsOutputDir);
        }
    }
    const buildOutputLog = layout.tsConfig.content.options.noEmit === true
        ? 'no emit'
        : Path.relative(layout.projectRoot, (_e = layout.build.bundleOutputDir) !== null && _e !== void 0 ? _e : layout.build.tsOutputDir);
    log.info('success', {
        buildOutput: buildOutputLog,
        time: Date.now() - startTime,
    });
    if (deploymentTarget) {
        deploy_target_1.logTargetPostBuildMessage(deploymentTarget);
    }
    delete process.env.NEXUS_BUILD;
}
exports.buildNexusApp = buildNexusApp;
/**
 * Output to disk in the build the start module that will be used to boot the
 * nexus app.
 */
async function writeStartModule({ startModule, layout, }) {
    // TODO we can be more flexible and allow the user to write an index.ts
    // module. For example we can alias it, or, we can rename it e.g.
    // `index_original.js`. For now we just error out and ask the user to not name
    // their module index.ts.
    if (FS.exists(layout.build.startModuleInPath)) {
        process_1.fatal(common_tags_1.stripIndent `
      Found ${layout.build.startModuleInPath}
      Nexus reserves the source root module name ${start_module_1.START_MODULE_NAME}.js for its own use.
      Please change your app layout to not have this module.
      This is a temporary limitation that we intend to remove in the future. 
      For more details please see this GitHub issue: https://github.com/graphql-nexus/nexus/issues/139
    `);
    }
    log.trace('Writing start module to disk');
    await FS.writeAsync(layout.build.startModuleOutPath, startModule);
}
exports.writeStartModule = writeStartModule;
//# sourceMappingURL=build.js.map