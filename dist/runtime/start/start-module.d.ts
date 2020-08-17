import * as TSM from 'ts-morph';
import ts from 'typescript';
import * as Layout from '../../lib/layout';
import * as Plugin from '../../lib/plugin';
export declare const START_MODULE_NAME = "index";
export declare const START_MODULE_HEADER = "GENERATED NEXUS START MODULE";
export declare type StartModuleConfig = {
    internalStage: 'build' | 'dev';
    layout: Layout.Layout;
    /**
     * The plugins the app is using. The start module imports them so that tree shakers
     * can be run over the final build, pulling in the sources of the respective plugins.
     */
    runtimePluginManifests: Plugin.Manifest[];
} & StartModuleOptions;
export declare type StartModuleOptions = {
    /**
     * Configure start module to require all files with absolute paths
     *
     * @default false
     */
    absoluteModuleImports?: boolean;
    /**
     * Configure start module to register Typescript as a NodeJS extensions
     *
     * @default false
     */
    registerTypeScript?: boolean | ts.CompilerOptions;
    /**
     * Configure start module to catch unhandled errors
     *
     * @default true
     */
    catchUnhandledErrors?: boolean;
};
export declare function createStartModuleContent(config: StartModuleConfig): string;
export declare function prepareStartModule(tsProject: TSM.Project, startModule: string): string;
/**
 * Build up static import code for all schema modules in the project. The static
 * imports are relative so that they can be calculated based on source layout
 * but used in build layout.
 *
 * Note that it is assumed the module these imports will run in will be located
 * in the source/build root.
 */
export declare function printStaticImports(layout: Layout.Layout, opts?: {
    absolutePaths?: boolean;
}): string;
//# sourceMappingURL=start-module.d.ts.map