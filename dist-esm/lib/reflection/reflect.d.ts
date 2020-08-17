import * as Layout from '../layout';
import { Plugin } from '../plugin';
import { SerializedError } from '../utils';
export declare type Message = {
    type: 'success-plugin';
    data: {
        plugins: Plugin[];
    };
} | {
    type: 'success-typegen';
} | {
    type: 'runtime-error' | 'ts-error';
    data: {
        serializedError: SerializedError;
    };
};
declare type ReflectionResultPlugins = {
    success: false;
    error: Error;
} | {
    success: true;
    plugins: Plugin[];
};
declare type ReflectionResultArtifactGeneration = {
    success: false;
    error: Error;
    type: 'runtime-error' | 'ts-error';
} | {
    success: true;
};
/**
 * Run the reflection step of Nexus. Get the used plugins and generate the artifacts optionally.
 */
export declare function reflect(layout: Layout.Layout, opts: {
    usedPlugins: true;
    onMainThread: true;
}): Promise<ReflectionResultPlugins>;
export declare function reflect(layout: Layout.Layout, opts: {
    artifacts: true;
}): Promise<ReflectionResultArtifactGeneration>;
/**
 * Hack: Plugins should ideally be discovered in a sub-process.
 * This is temporary until https://github.com/graphql-nexus/nexus/issues/818 is fixed
 */
export declare function runPluginsReflectionOnMainThread(layout: Layout.Layout): Promise<ReflectionResultPlugins>;
export declare function runTypegenReflectionAsSubProcess(layout: Layout.Layout): Promise<{
    success: false;
    error: Error;
} | {
    success: true;
    plugins: Plugin<any>[];
} | {
    success: false;
    error: Error;
    type: "runtime-error" | "ts-error";
} | {
    success: true;
}>;
export {};
//# sourceMappingURL=reflect.d.ts.map