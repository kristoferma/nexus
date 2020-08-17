export declare type ExecScenario = {
    /**
     * Tells you if this process was executed within a Node proejct.
     */
    nodeProject: boolean;
    /**
     * Tells you if this process was executed within an app project.
     */
    toolProject: boolean;
    /**
     * Tells you if the local nexus bin is installed or not.
     */
    toolCurrentlyPresentInNodeModules: boolean;
    /**
     * Tells you if the current process was run from the local bin version or not.
     */
    runningLocalTool: boolean;
    /**
     * Information about the project if present
     */
    project: null | {
        dir: string;
        nodeModulesDir: string;
        toolPath: string | null;
    };
    /**
     * Information about this process
     */
    process: {
        /**
         * The script being executed by this process. Symlinks are followed, if any.
         */
        toolPath: string;
    };
};
interface Input {
    /**
     * The name of the package for the tool. This is used to detect if the proejct
     * (if any found) is working with this tool or not. If it is not then checks
     * for if a local version of the package is being used are skipped.
     */
    depName: string;
    /**
     * The current working directory. From here a project is looked for.
     *
     * @default process.cwd()
     */
    cwd?: string;
    /**
     * The path to the script that was run by this process. Usually is `__filename`
     */
    scriptPath: string;
}
/**
 * Detect the layout of the bin used for this process, and if there is a local
 * version available.
 */
export declare function detectExecLayout(input: Input): ExecScenario;
export {};
//# sourceMappingURL=detect-exec-layout.d.ts.map