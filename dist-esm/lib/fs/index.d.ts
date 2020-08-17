/**
 * Write a file after forcefully removing it, so that VSC will observe the
 * change. It is the case that a plain write, when the file exists, in node,
 * does an update-in-place tactic, probably for optimization, but this isn't
 * enough for proper file change watch detection or something, not sure.
 */
export declare function removeWrite(filePath: string, fileContent: string): void;
export declare function removeWriteAsync(filePath: string, fileContent: string): Promise<void>;
/**
 * Search for a file in cwd or in parent directory recursively up to the root
 * directory.
 */
export declare function findFileRecurisvelyUpward(fileName: string, opts: {
    projectRoot: string;
}): Promise<null | string>;
/**
 * Search for a file in cwd or in parent directory recursively up to the root
 * directory.
 */
export declare function findFileRecurisvelyUpwardSync(fileName: string, opts: {
    cwd: string;
}): {
    path: string;
    dir: string;
} | null;
/**
 * Write file contents but first delete the file off disk if present. This is a
 * useful function when the effect of file delete is needed to trigger some file
 * watch/refresh mechanism, such as is the case with VSCode TS declaration files
 * inside `@types/` packages.
 *
 * For more details that motivated this utility refer to the originating issue
 * https://github.com/graphql-nexus/nexus-plugin-prisma/issues/453.
 */
export declare function hardWriteFileSync(filePath: string, data: string): void;
export declare function hardWriteFile(filePath: string, data: string): Promise<void>;
/**
 * Return the path to a temporary directory on the machine. This works around a
 * limitation in Node wherein a symlink is returned on macOS for `os.tmpdir`.
 */
export declare function getTmpDir(prefix?: string, baseTmpDir?: string): string;
export declare const writeCachedFile: (filePath: string, fileContent: string) => Promise<void>;
export declare function getTranspiledPath(projectDir: string, filePath: string, outDir: string): string;
export declare function sourceFilePathFromTranspiledPath({ transpiledPath, outDir, rootDir, packageJsonPath, }: {
    transpiledPath: string;
    outDir: string;
    rootDir: string;
    packageJsonPath: string;
}): string;
/**
 * Find the given file within the directory tree under the given root path (cwd).
 *
 * Dot-folders, dot-files, node_modules are all always ignored
 */
export declare function findFile(pattern: string, config: {
    ignore?: string[];
    cwd: string;
}): null | string;
export declare function findFiles(fileNames: string | string[], config?: {
    ignore?: string[];
    cwd?: string;
}): Promise<string[]>;
export declare const baseIgnores: string[];
export declare function trimNodeModulesIfInPath(path: string): string;
/**
 * Strip the extension of a file path.
 *
 * This can be handy for example when going from a file to a module path
 * suitable for import like a user would do, not supplying the ext.
 */
export declare function stripExt(filePath: string): string;
/**
 * Check if the CWD is empty of any files or folders.
 * TODO we should make nice exceptions for known meaningless files, like .DS_Store
 */
export declare function isEmptyDir(dirPath: string): Promise<boolean>;
/**
 * Ask whether the given path is a root path or not.
 *
 * @remarks
 *
 * Take from https://github.com/sindresorhus/is-root-path/blob/master/index.js
 */
export declare function isRootPath(path: string): boolean;
//# sourceMappingURL=index.d.ts.map