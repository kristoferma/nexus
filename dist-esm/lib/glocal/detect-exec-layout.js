import * as fs from 'fs';
import * as Path from 'path';
import { findFileRecurisvelyUpwardSync } from '../fs';
import { requireResolveFrom } from '../utils';
/**
 * Detect the layout of the bin used for this process, and if there is a local
 * version available.
 */
export function detectExecLayout(input) {
    var _a, _b, _c, _d, _e;
    const cwd = (_a = input.cwd) !== null && _a !== void 0 ? _a : process.cwd();
    let inputToolPath = input.scriptPath;
    // Node CLI supports omitting the ".js" ext like this: $ node a/b/c/foo
    // Handle that case otherwise the realpathSync below will fail.
    if (Path.extname(inputToolPath) !== '.js') {
        if (fs.existsSync(inputToolPath + '.js')) {
            inputToolPath += '.js';
        }
    }
    const processToolPath = fs.realpathSync(inputToolPath);
    let projectDir = null;
    try {
        projectDir = (_b = findFileRecurisvelyUpwardSync('package.json', { cwd })) === null || _b === void 0 ? void 0 : _b.dir;
    }
    catch (e) { }
    if (!projectDir) {
        return {
            nodeProject: false,
            toolProject: false,
            toolCurrentlyPresentInNodeModules: false,
            runningLocalTool: false,
            process: { toolPath: processToolPath },
            project: null,
        };
    }
    const projectNodeModulesDir = Path.join(projectDir, 'node_modules');
    const projectHoistedDotBinDir = Path.join(projectNodeModulesDir, '.bin');
    const projectHoistedDotBinToolPath = Path.join(projectHoistedDotBinDir, input.depName);
    const project = {
        dir: projectDir,
        nodeModulesDir: projectNodeModulesDir,
        toolPath: null,
    };
    let isToolProject = null;
    try {
        isToolProject =
            typeof ((_d = (_c = require(Path.posix.join(projectDir, 'package.json'))) === null || _c === void 0 ? void 0 : _c.dependencies) === null || _d === void 0 ? void 0 : _d[input.depName]) === 'string';
    }
    catch (e) {
        console.log(e);
    }
    if (!isToolProject) {
        return {
            nodeProject: true,
            toolProject: false,
            toolCurrentlyPresentInNodeModules: false,
            runningLocalTool: false,
            process: { toolPath: processToolPath },
            project,
        };
    }
    let projectToolPath = null;
    try {
        /**
         * Find the project tool path by reverse engineering
         * 1. find the tool package
         * 2. find its local bin path
         * 3. check that it AND the hoisted version at project dot-bin level exist
         * 4. If yes yes yes then we've found our path!
         *
         * This logic is needed for Windows support because in Windows there are no
         * symlinks we can follow for free.
         */
        const toolPackageJsonPath = requireResolveFrom(`${input.depName}/package.json`, projectDir);
        const toolPackageDir = Path.dirname(toolPackageJsonPath);
        const toolPackageRelativeBinPath = (_e = require(toolPackageJsonPath)) === null || _e === void 0 ? void 0 : _e.bin[input.depName];
        if (toolPackageRelativeBinPath) {
            const absoluteToolBinPath = Path.join(toolPackageDir, toolPackageRelativeBinPath);
            if (fs.existsSync(absoluteToolBinPath) && fs.existsSync(projectHoistedDotBinToolPath)) {
                projectToolPath = Path.resolve(absoluteToolBinPath);
            }
        }
    }
    catch (e) { }
    if (!projectToolPath) {
        return {
            nodeProject: true,
            toolProject: true,
            toolCurrentlyPresentInNodeModules: false,
            runningLocalTool: false,
            process: { toolPath: processToolPath },
            project,
        };
    }
    Object.assign(project, {
        toolPath: projectToolPath,
    });
    if (processToolPath !== project.toolPath) {
        return {
            nodeProject: true,
            toolProject: true,
            toolCurrentlyPresentInNodeModules: true,
            runningLocalTool: false,
            process: { toolPath: processToolPath },
            project,
        };
    }
    return {
        nodeProject: true,
        toolProject: true,
        toolCurrentlyPresentInNodeModules: true,
        runningLocalTool: true,
        process: { toolPath: processToolPath },
        project,
    };
}
//# sourceMappingURL=detect-exec-layout.js.map