import { rightOrThrow } from '@nexus/logger/dist/utils';
import Chalk from 'chalk';
import { stripIndent } from 'common-tags';
import { isLeft, left, right } from 'fp-ts/lib/Either';
import * as FS from 'fs-jetpack';
import * as OS from 'os';
import * as Path from 'path';
import * as tsm from 'ts-morph';
import { findFile, isEmptyDir } from '../../lib/fs';
import { rootLogger } from '../nexus-logger';
import * as PJ from '../package-json';
import * as PackageManager from '../package-manager';
import { exception, exceptionType } from '../utils';
import { getBuildLayout } from './build';
import { saveDataForChildProcess } from './cache';
import { readOrScaffoldTsconfig } from './tsconfig';
const log = rootLogger.child('layout');
// todo allow user to configure these for their project
const CONVENTIONAL_ENTRYPOINT_MODULE_NAME = 'app';
const CONVENTIONAL_ENTRYPOINT_FILE_NAME = `${CONVENTIONAL_ENTRYPOINT_MODULE_NAME}.ts`;
/**
 * Perform a layout scan and return results with attached helper functions.
 */
export async function create(options) {
    var _a;
    const cwd = (_a = options === null || options === void 0 ? void 0 : options.cwd) !== null && _a !== void 0 ? _a : process.cwd();
    /**
     * Find the project root directory. This can be different than the source root
     * directory. For example the classic project structure where there is a root
     * `src` folder. `src` folder would be considered the "source root".
     *
     * Project root is considered to be the first package.json found from cwd upward
     * to disk root. If not package.json is found then cwd is taken to be the
     * project root.
     *
     */
    let projectRoot = options === null || options === void 0 ? void 0 : options.projectRoot;
    let packageJson = null;
    if (!projectRoot) {
        const maybeErrPackageJson = PJ.findRecurisvelyUpwardSync({ cwd });
        if (!maybeErrPackageJson) {
            projectRoot = cwd;
        }
        else if (isLeft(maybeErrPackageJson.content)) {
            return maybeErrPackageJson.content;
        }
        else {
            projectRoot = maybeErrPackageJson.dir;
            packageJson = Object.assign(Object.assign({}, maybeErrPackageJson), { content: maybeErrPackageJson.content.right });
        }
    }
    const errNormalizedEntrypoint = normalizeEntrypoint(options === null || options === void 0 ? void 0 : options.entrypointPath, projectRoot);
    if (isLeft(errNormalizedEntrypoint))
        return errNormalizedEntrypoint;
    const normalizedEntrypoint = errNormalizedEntrypoint.right;
    const packageManagerType = await PackageManager.detectProjectPackageManager({ projectRoot });
    const maybeAppModule = normalizedEntrypoint !== null && normalizedEntrypoint !== void 0 ? normalizedEntrypoint : findAppModule({ projectRoot });
    const errTsConfig = await readOrScaffoldTsconfig({ projectRoot });
    if (isLeft(errTsConfig))
        return errTsConfig;
    const tsConfig = errTsConfig.right;
    const nexusModules = findNexusModules(tsConfig, maybeAppModule);
    const project = packageJson
        ? {
            name: packageJson.content.name,
            isAnonymous: false,
        }
        : {
            name: 'anonymous',
            isAnonymous: true,
        };
    const scanResult = {
        app: maybeAppModule === null
            ? { exists: false, path: maybeAppModule }
            : { exists: true, path: maybeAppModule },
        projectRoot,
        sourceRoot: Path.normalize(tsConfig.content.options.rootDir),
        nexusModules,
        project,
        tsConfig,
        packageManagerType,
    };
    if (scanResult.app.exists === false && scanResult.nexusModules.length === 0) {
        return left(noAppOrNexusModules({}));
    }
    const buildInfo = getBuildLayout(options === null || options === void 0 ? void 0 : options.buildOutputDir, scanResult, options === null || options === void 0 ? void 0 : options.asBundle);
    log.trace('layout build info', { data: buildInfo });
    const layout = createFromData(Object.assign(Object.assign({}, scanResult), { packageJson, build: buildInfo }));
    /**
     * Save the created layout in the env
     */
    process.env = Object.assign(Object.assign({}, process.env), saveDataForChildProcess(layout));
    return right(layout);
}
/**
 * Create a layout instance with given layout data. Useful for taking in serialized scan
 * data from another process that would be wasteful to re-calculate.
 */
export function createFromData(layoutData) {
    let layout = Object.assign(Object.assign({}, layoutData), { data: layoutData, projectRelative: Path.relative.bind(null, layoutData.projectRoot), sourceRelative: Path.relative.bind(null, layoutData.sourceRoot), sourcePath(...subPaths) {
            return Path.join(layoutData.sourceRoot, ...subPaths);
        },
        projectPath(...subPaths) {
            const joinedPath = Path.join(...subPaths);
            return Path.join(layoutData.projectRoot, joinedPath);
        },
        projectPathOrAbsolute(...subPaths) {
            const joinedPath = Path.join(...subPaths);
            if (Path.isAbsolute(joinedPath))
                return joinedPath;
            return Path.join(layoutData.projectRoot, joinedPath);
        }, packageManager: PackageManager.createPackageManager(layoutData.packageManagerType, {
            projectRoot: layoutData.projectRoot,
        }), update(options) {
            if (options.nexusModules) {
                layout.nexusModules = options.nexusModules;
                layout.data.nexusModules = options.nexusModules;
            }
        } });
    return layout;
}
const checks = {
    no_app_or_nexus_modules: {
        code: 'no_app_or_schema_modules',
        // prettier-ignore
        explanations: {
            problem: `We could not find any modules that imports 'nexus' or ${CONVENTIONAL_ENTRYPOINT_FILE_NAME} entrypoint`,
            solution: stripIndent `
        Please do one of the following:

          1. Create a file, import { schema } from 'nexus' and write your GraphQL type definitions in it.
          2. Create an ${Chalk.yellow(CONVENTIONAL_ENTRYPOINT_FILE_NAME)} file.
    `,
        }
    },
};
const noAppOrNexusModules = exceptionType('no_app_or_schema_modules', checks.no_app_or_nexus_modules.explanations.problem +
    OS.EOL +
    checks.no_app_or_nexus_modules.explanations.solution);
/**
 * Find the (optional) app module in the user's project.
 */
export function findAppModule(opts) {
    log.trace('looking for app module');
    const path = findFile(`./**/${CONVENTIONAL_ENTRYPOINT_FILE_NAME}`, { cwd: opts.projectRoot });
    log.trace('done looking for app module', { path });
    return path;
}
/**
 * Detect whether or not CWD is inside a nexus project. nexus project is
 * defined as there being a package.json in or above CWD with nexus as a
 * direct dependency.
 */
export async function scanProjectType(opts) {
    var _a;
    const packageJson = PJ.findRecurisvelyUpwardSync(opts);
    if (packageJson === null) {
        if (await isEmptyDir(opts.cwd)) {
            return { type: 'new' };
        }
        return { type: 'unknown' };
    }
    if (isLeft(packageJson.content)) {
        return {
            type: 'malformed_package_json',
            error: packageJson.content.left,
        };
    }
    const pjc = rightOrThrow(packageJson.content); // will never throw, check above
    if ((_a = pjc.dependencies) === null || _a === void 0 ? void 0 : _a['nexus']) {
        return {
            type: 'NEXUS_project',
            packageJson: packageJson,
            packageJsonLocation: packageJson,
        };
    }
    return {
        type: 'node_project',
        packageJson: packageJson,
        packageJsonLocation: packageJson,
    };
}
/**
 * Validate the given entrypoint and normalize it into an absolute path.
 */
function normalizeEntrypoint(entrypoint, projectRoot) {
    if (!entrypoint) {
        return right(undefined);
    }
    const absoluteEntrypoint = Path.isAbsolute(entrypoint) ? entrypoint : Path.join(projectRoot, entrypoint);
    if (!absoluteEntrypoint.endsWith('.ts')) {
        const error = exception('Entrypoint must be a .ts file', { path: absoluteEntrypoint });
        return left(error);
    }
    if (!FS.exists(absoluteEntrypoint)) {
        const error = exception('Entrypoint does not exist', { path: absoluteEntrypoint });
        return left(error);
    }
    return right(absoluteEntrypoint);
}
/**
 * Find the modules in the project that import nexus
 */
export function findNexusModules(tsConfig, maybeAppModule) {
    try {
        log.trace('finding nexus modules');
        const project = new tsm.Project({
            addFilesFromTsConfig: false,
        });
        tsConfig.content.fileNames.forEach((f) => project.addSourceFileAtPath(f));
        const modules = project
            .getSourceFiles()
            .filter((s) => {
            // Do not add app module to nexus modules
            // todo normalize because ts in windows is like "C:/.../.../" instead of "C:\...\..." ... why???
            if (Path.normalize(s.getFilePath().toString()) === maybeAppModule) {
                return false;
            }
            return s.getImportDeclaration('nexus') !== undefined;
        })
            .map((s) => {
            // todo normalize because ts in windows is like "C:/.../.../" instead of "C:\...\..." ... why???
            return Path.normalize(s.getFilePath().toString());
        });
        log.trace('done finding nexus modules', { modules });
        return modules;
    }
    catch (error) {
        // todo return left
        log.error('We could not find your nexus modules', { error });
        return [];
    }
}
//# sourceMappingURL=layout.js.map