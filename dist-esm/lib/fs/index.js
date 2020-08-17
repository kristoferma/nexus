import * as Glob from 'fast-glob';
import * as NodeFS from 'fs';
import * as FS from 'fs-jetpack';
import * as OS from 'os';
import * as Path from 'path';
import { log } from '../nexus-logger';
/**
 * Write a file after forcefully removing it, so that VSC will observe the
 * change. It is the case that a plain write, when the file exists, in node,
 * does an update-in-place tactic, probably for optimization, but this isn't
 * enough for proper file change watch detection or something, not sure.
 */
export function removeWrite(filePath, fileContent) {
    FS.remove(filePath);
    FS.write(filePath, fileContent);
}
export async function removeWriteAsync(filePath, fileContent) {
    await FS.removeAsync(filePath);
    await FS.writeAsync(filePath, fileContent);
}
/**
 * Search for a file in cwd or in parent directory recursively up to the root
 * directory.
 */
export async function findFileRecurisvelyUpward(fileName, opts) {
    let found = null;
    let currentDir = opts.projectRoot;
    while (true) {
        const checkFilePath = Path.join(currentDir, fileName);
        if (await FS.existsAsync(checkFilePath)) {
            found = checkFilePath;
            break;
        }
        if (currentDir === '/') {
            break;
        }
        currentDir = Path.dirname(currentDir);
    }
    return found;
}
/**
 * Search for a file in cwd or in parent directory recursively up to the root
 * directory.
 */
export function findFileRecurisvelyUpwardSync(fileName, opts) {
    let found = null;
    let currentDir = opts.cwd;
    const localFS = FS.cwd(currentDir);
    while (true) {
        const filePath = Path.join(currentDir, fileName);
        if (localFS.exists(filePath)) {
            found = { dir: currentDir, path: filePath };
            break;
        }
        if (isRootPath(currentDir)) {
            break;
        }
        currentDir = Path.join(currentDir, '..');
    }
    return found;
}
/**
 * Write file contents but first delete the file off disk if present. This is a
 * useful function when the effect of file delete is needed to trigger some file
 * watch/refresh mechanism, such as is the case with VSCode TS declaration files
 * inside `@types/` packages.
 *
 * For more details that motivated this utility refer to the originating issue
 * https://github.com/graphql-nexus/nexus-plugin-prisma/issues/453.
 */
export function hardWriteFileSync(filePath, data) {
    FS.remove(Path.dirname(filePath));
    FS.write(filePath, data);
}
export async function hardWriteFile(filePath, data) {
    await FS.removeAsync(Path.dirname(filePath));
    await FS.writeAsync(filePath, data);
}
/**
 * Return the path to a temporary directory on the machine. This works around a
 * limitation in Node wherein a symlink is returned on macOS for `os.tmpdir`.
 */
export function getTmpDir(prefix = '', baseTmpDir) {
    const tmpDirPath = NodeFS.realpathSync(baseTmpDir !== null && baseTmpDir !== void 0 ? baseTmpDir : OS.tmpdir());
    const id = Math.random().toString().slice(2);
    const dirName = [prefix, id].filter((x) => x).join('-');
    // https://github.com/nodejs/node/issues/11422
    const tmpDir = Path.join(tmpDirPath, dirName);
    return tmpDir;
}
export const writeCachedFile = async (filePath, fileContent) => {
    const alreadyExistingFallbackFileContents = FS.read(filePath);
    if (alreadyExistingFallbackFileContents === undefined) {
        log.trace('writing file', { filePath });
        await FS.writeAsync(filePath, fileContent);
    }
    else if (alreadyExistingFallbackFileContents !== fileContent) {
        log.trace('there is a file already present on disk but its content does not match, replacing old with new %s', {
            filePath,
        });
        log.trace(alreadyExistingFallbackFileContents);
        log.trace(fileContent);
        await FS.writeAsync(filePath, fileContent);
    }
    else {
        log.trace('there is a file already present on disk and its content matches, therefore doing nothing');
    }
};
// build/index.js => index.ts
export function getTranspiledPath(projectDir, filePath, outDir) {
    const pathFromRootToFile = Path.relative(projectDir, filePath);
    const jsFileName = Path.basename(pathFromRootToFile, '.ts') + '.js';
    const pathToJsFile = Path.join(Path.dirname(pathFromRootToFile), jsFileName);
    return Path.join(outDir, pathToJsFile);
}
// build/index.js => /Users/me/project/src/index.ts
export function sourceFilePathFromTranspiledPath({ transpiledPath, outDir, rootDir, packageJsonPath, }) {
    const normalizedTranspiledPath = transpiledPath.startsWith('/')
        ? transpiledPath
        : Path.join(packageJsonPath, transpiledPath);
    const pathFromOutDirToFile = Path.relative(outDir, normalizedTranspiledPath);
    const tsFileName = Path.basename(pathFromOutDirToFile, '.js') + '.ts';
    const maybeAppFolders = Path.dirname(pathFromOutDirToFile);
    return Path.join(rootDir, maybeAppFolders, tsFileName);
}
/**
 * Find the given file within the directory tree under the given root path (cwd).
 *
 * Dot-folders, dot-files, node_modules are all always ignored
 */
export function findFile(pattern, config) {
    var _a, _b;
    const cwd = config.cwd;
    const ignore = ['node_modules/**', ...((_a = config.ignore) !== null && _a !== void 0 ? _a : [])];
    const foundFiles = Glob.sync(pattern, { cwd, ignore, absolute: true, dot: false });
    // TODO: What if several files were found?
    return (_b = foundFiles[0]) !== null && _b !== void 0 ? _b : null;
}
export async function findFiles(fileNames, config) {
    var _a, _b, _c;
    const cwd = (_a = config === null || config === void 0 ? void 0 : config.cwd) !== null && _a !== void 0 ? _a : process.cwd();
    const paths = Array.isArray(fileNames) ? fileNames : [fileNames];
    const localFS = FS.cwd(cwd);
    const files = await localFS.findAsync({
        matching: [...paths, ...baseIgnores, ...((_c = (_b = config === null || config === void 0 ? void 0 : config.ignore) === null || _b === void 0 ? void 0 : _b.map((i) => `!${i}`)) !== null && _c !== void 0 ? _c : [])],
    });
    return files.map((f) => (Path.isAbsolute(f) ? f : localFS.path(f)));
}
export const baseIgnores = ['!node_modules/**/*', '!.*/**/*'];
export function trimNodeModulesIfInPath(path) {
    if (path.includes('node_modules')) {
        return path.substring(path.indexOf('node_modules') + 'node_modules'.length + 1);
    }
    return path;
}
/**
 * Strip the extension of a file path.
 *
 * This can be handy for example when going from a file to a module path
 * suitable for import like a user would do, not supplying the ext.
 */
export function stripExt(filePath) {
    return filePath.replace(/\.[^.]*$/, '');
}
/**
 * Check if the CWD is empty of any files or folders.
 * TODO we should make nice exceptions for known meaningless files, like .DS_Store
 */
export async function isEmptyDir(dirPath) {
    const contents = await FS.listAsync(dirPath);
    return contents === undefined || contents.length === 0;
}
// https://github.com/iojs/io.js/blob/5883a59b21a97e8b7339f435c977155a2c29ba8d/lib/path.js#L43
const windowsPathRegex = /^(?:[a-zA-Z]:|[\\/]{2}[^\\/]+[\\/]+[^\\/]+)?[\\/]$/;
/**
 * Ask whether the given path is a root path or not.
 *
 * @remarks
 *
 * Take from https://github.com/sindresorhus/is-root-path/blob/master/index.js
 */
export function isRootPath(path) {
    path = path.trim();
    if (path === '') {
        return false;
    }
    return process.platform === 'win32' ? windowsPathRegex.test(path) : path === '/';
}
//# sourceMappingURL=index.js.map