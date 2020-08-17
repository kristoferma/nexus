import { ScanResult } from './layout';
/**
 * The temporary ts build folder used when bundling is enabled
 *
 * Note: It **should not** be nested in a sub-folder. This might "corrupt" the relative paths of the bundle build.
 */
export declare const TMP_TS_BUILD_FOLDER_PATH_RELATIVE_TO_PROJECT_ROOT = ".tmp_build";
export declare const DEFAULT_BUILD_DIR_PATH_RELATIVE_TO_PROJECT_ROOT = ".nexus/build";
export declare type BuildLayout = {
    startModuleOutPath: string;
    startModuleInPath: string;
    tsOutputDir: string;
    bundleOutputDir: string | null;
    /**
     * The final path to the start module. When bundling disbaled, same as `startModuleOutPath`.
     */
    startModule: string;
    /**
     * The final output dir. If bundler is enabled then this is `bundleOutputDir`.
     * Otherwise it is `tsOutputDir`.
     *
     * When bundle case, this accounts for the bundle environment, which makes it
     * **DIFFERENT** than the source root. For example:
     *
     * ```
     * <out_root>/node_modules/
     * <out_root>/api/app.ts
     * <out_root>/api/index.ts
     * ```
     */
    root: string;
    /**
     * If bundler is enabled then the final output dir where the **source** is
     * located. Otherwise same as `tsOutputDir`.
     *
     * When bundle case, this is different than `root` because it tells you where
     * the source starts, not the build environment.
     *
     * For example, here `source_root` is `<out_root>/api` because the user has
     * set their root dir to `api`:
     *
     * ```
     * <out_root>/node_modules/
     * <out_root>/api/app.ts
     * <out_root>/api/index.ts
     * ```
     *
     * But here, `source_root` is `<out_root>` because the user has set their root
     * dir to `.`:
     *
     * ```
     * <out_source_root>/node_modules/
     * <out_source_root>/app.ts
     * <out_source_root>/index.ts
     * ```
     */
    sourceRoot: string;
};
export declare function getBuildLayout(buildOutput: string | undefined, scanResult: ScanResult, asBundle?: boolean): BuildLayout;
//# sourceMappingURL=build.d.ts.map