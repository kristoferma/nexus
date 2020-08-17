import { isLeft, isRight, left, right, toError, tryCatch } from 'fp-ts/lib/Either';
import slash from 'slash';
import { fatal } from '../process';
import { exceptionType } from '../utils';
const getManifestException = exceptionType('get_manifest_error', ({ reason }) => reason);
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
export function getPluginManifest(plugin) {
    var _a;
    // todo refactor with package-json module
    const errPackageJson = tryCatch(() => require(plugin.packageJsonPath), toError);
    if (isLeft(errPackageJson)) {
        return left(getManifestException({
            reason: `Failed to read the the package.json file.\n\n${errPackageJson.left.message}`,
            plugin,
        }));
    }
    const packageJson = errPackageJson.right;
    if (!packageJson.name) {
        return left(getManifestException({
            reason: `\`name\` property is missing in the package.json`,
            plugin,
            name: packageJson.name,
        }));
    }
    if (!packageJson.main) {
        return left(getManifestException({
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
        plugin.worktime.module = slash(plugin.worktime.module);
        worktime = plugin.worktime;
    }
    if (plugin.runtime) {
        plugin.runtime.module = slash(plugin.runtime.module);
        runtime = plugin.runtime;
    }
    if (plugin.testtime) {
        plugin.testtime.module = slash(plugin.testtime.module);
        testtime = plugin.testtime;
    }
    const packageJsonPath = slash(plugin.packageJsonPath);
    return right({
        name: validatedPackageJson.name,
        settings: (_a = plugin.settings) !== null && _a !== void 0 ? _a : null,
        packageJsonPath: packageJsonPath,
        packageJson: validatedPackageJson,
        worktime,
        testtime,
        runtime,
    });
}
/**
 * Display erorrs then exit the program.
 */
export function showManifestErrorsAndExit(errors) {
    const message = `There were errors loading 1 or more of your plugins.\n\n` +
        errors
            .map((e) => {
            const name = `${e.context.name ? `"${e.context.name}"` : '<unknown>'}`;
            const path = e.context.plugin.packageJsonPath;
            return `from plugin ${name} at path ${path}\n\n${e.message}`;
        })
            .join('\n\n');
    fatal(message);
}
/**
 * Process the given manifest inputs into manifests
 */
export function getPluginManifests(plugins) {
    // todo this function is a temp helper until we better adopt fp-ts and use its
    // other features. the process of partitioning, processing, and branching over Either has lots of
    // support in fp-ts lib.
    const errManifests = plugins.map(getPluginManifest);
    const data = errManifests.filter(isRight).map((m) => m.right);
    const errors = errManifests.filter(isLeft).map((m) => m.left);
    return { data, errors: errors.length ? errors : null };
}
//# sourceMappingURL=manifest.js.map