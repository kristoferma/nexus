"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPluginManifests = exports.showManifestErrorsAndExit = exports.getPluginManifest = void 0;
const tslib_1 = require("tslib");
const Either_1 = require("fp-ts/lib/Either");
const slash_1 = tslib_1.__importDefault(require("slash"));
const process_1 = require("../process");
const utils_1 = require("../utils");
const getManifestException = utils_1.exceptionType('get_manifest_error', ({ reason }) => reason);
// export type GetManifestError = ContextualError<{
//   plugin: Plugin
//   name?: string
// }>
/**
 * Process manifest input into a manifest.
 *
 * @remarks
 *
 * The manifest input is what the plugin author provides. This supplies
 * defaults and fulfills properties to produce normalized manifest data.
 */
function getPluginManifest(plugin) {
    var _a;
    // todo refactor with package-json module
    const errPackageJson = Either_1.tryCatch(() => require(plugin.packageJsonPath), Either_1.toError);
    if (Either_1.isLeft(errPackageJson)) {
        return Either_1.left(getManifestException({
            reason: `Failed to read the the package.json file.\n\n${errPackageJson.left.message}`,
            plugin,
        }));
    }
    const packageJson = errPackageJson.right;
    if (!packageJson.name) {
        return Either_1.left(getManifestException({
            reason: `\`name\` property is missing in the package.json`,
            plugin,
            name: packageJson.name,
        }));
    }
    if (!packageJson.main) {
        return Either_1.left(getManifestException({
            plugin,
            reason: `\`main\` property is missing in the package.json`,
            name: packageJson.name,
        }));
    }
    const validatedPackageJson = packageJson;
    let worktime = null;
    let runtime = null;
    let testtime = null;
    if (plugin.worktime) {
        plugin.worktime.module = slash_1.default(plugin.worktime.module);
        worktime = plugin.worktime;
    }
    if (plugin.runtime) {
        plugin.runtime.module = slash_1.default(plugin.runtime.module);
        runtime = plugin.runtime;
    }
    if (plugin.testtime) {
        plugin.testtime.module = slash_1.default(plugin.testtime.module);
        testtime = plugin.testtime;
    }
    const packageJsonPath = slash_1.default(plugin.packageJsonPath);
    return Either_1.right({
        name: validatedPackageJson.name,
        settings: (_a = plugin.settings) !== null && _a !== void 0 ? _a : null,
        packageJsonPath: packageJsonPath,
        packageJson: validatedPackageJson,
        worktime,
        testtime,
        runtime,
    });
}
exports.getPluginManifest = getPluginManifest;
/**
 * Display erorrs then exit the program.
 */
function showManifestErrorsAndExit(errors) {
    const message = `There were errors loading 1 or more of your plugins.\n\n` +
        errors
            .map((e) => {
            const name = `${e.context.name ? `"${e.context.name}"` : '<unknown>'}`;
            const path = e.context.plugin.packageJsonPath;
            return `from plugin ${name} at path ${path}\n\n${e.message}`;
        })
            .join('\n\n');
    process_1.fatal(message);
}
exports.showManifestErrorsAndExit = showManifestErrorsAndExit;
/**
 * Process the given manifest inputs into manifests
 */
function getPluginManifests(plugins) {
    // todo this function is a temp helper until we better adopt fp-ts and use its
    // other features. the process of partitioning, processing, and branching over Either has lots of
    // support in fp-ts lib.
    const errManifests = plugins.map(getPluginManifest);
    const data = errManifests.filter(Either_1.isRight).map((m) => m.right);
    const errors = errManifests.filter(Either_1.isLeft).map((m) => m.left);
    return { data, errors: errors.length ? errors : null };
}
exports.getPluginManifests = getPluginManifests;
//# sourceMappingURL=manifest.js.map