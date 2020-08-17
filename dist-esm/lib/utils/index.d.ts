/// <reference types="node" />
import * as HTTP from 'http';
import * as Net from 'net';
import { JsonObject, PackageJson, Primitive } from 'type-fest';
export * from './either';
export declare type MaybePromise<T = void> = T | Promise<T>;
export declare type CallbackRegistrer<F> = (f: F) => void;
export declare type SideEffector = () => MaybePromise;
export declare type Param1<F> = F extends (p1: infer P1, ...args: any[]) => any ? P1 : never;
export declare type Param2<F> = F extends (p1: any, p2: infer P2, ...args: any[]) => any ? P2 : never;
export declare type Param3<F> = F extends (p1: any, p2: any, p3: infer P3, ...args: any[]) => any ? P3 : never;
/**
 * Represents a POJO. Prevents from allowing arrays and functions
 */
export declare type PlainObject = {
    [x: string]: Primitive | object;
};
/**
 * DeepPartial - modified version from `utility-types`
 * @desc Partial that works for deeply nested structure
 * @example
 *   Expect: {
 *     first?: {
 *       second?: {
 *         name?: string;
 *       };
 *     };
 *   }
 *   type NestedProps = {
 *     first: {
 *       second: {
 *         name: string;
 *       };
 *     };
 *   };
 *   type PartialNestedProps = DeepPartial<NestedProps>;
 */
export declare type DeepPartial<T, AllowAdditionalProps extends boolean = false> = T extends Function ? T : T extends Array<infer U> ? DeepPartialArray<U> : T extends object ? AllowAdditionalProps extends true ? DeepPartialObject<T, true> & PlainObject : DeepPartialObject<T, false> : T | undefined;
export interface DeepPartialArray<T> extends Array<DeepPartial<T>> {
}
export declare type DeepPartialObject<T extends object, AllowAdditionalProps extends boolean = false> = {
    [P in keyof T]?: AllowAdditionalProps extends true ? DeepPartial<T[P], true> & PlainObject : DeepPartial<T[P], false>;
};
/**
 * DeepRequired - borrowed from `utility-types`
 * @desc Required that works for deeply nested structure
 * @example
 *   Expect: {
 *     first: {
 *       second: {
 *         name: string;
 *       };
 *     };
 *   }
 *   type NestedProps = {
 *     first?: {
 *       second?: {
 *         name?: string;
 *       };
 *     };
 *   };
 *   type RequiredNestedProps = DeepRequired<NestedProps>;
 */
export declare type DeepRequired<T> = T extends (...args: any[]) => any ? T : T extends any[] ? DeepRequiredArray<T[number]> : T extends object ? DeepRequiredObject<T> : T;
export interface DeepRequiredArray<T> extends Array<DeepRequired<NonUndefined<T>>> {
}
export declare type DeepRequiredObject<T> = {
    [P in keyof T]-?: DeepRequired<NonUndefined<T[P]>>;
};
export declare type NonUndefined<A> = A extends undefined ? never : A;
/**
 * Guarantee the length of a given string, padding before or after with the
 * given character. If the given string is longer than  the span target, then it
 * will be cropped.
 */
export declare function span(padSide: 'padBefore' | 'padAfter', padChar: string, target: number, content: string): string;
/**
 * Guarantee the length of a given string, padding with space as needed. Content
 * is aligned left and if exceeds span target length to begin with gets cropped.
 */
export declare const clampSpace: (target: number, content: string) => string;
/**
 * Create a string of space of the given length.
 */
export declare function spanSpace(num: number): string;
/**
 * Create a string of the given length and character
 */
export declare function spanChar(num: number, char: string): string;
/**
 * Guarantee the length of a given string, padding with space as needed. Content
 * is aligned right and if exceeds span target length to begin with gets cropped.
 */
export declare const spanSpaceRight: (target: number, content: string) => string;
/**
 * Use this to make assertion at end of if-else chain that all members of a
 * union have been accounted for.
 */
export declare function casesHandled(x: never): never;
/**
 * Create a function that will only ever return the given value when called.
 */
export declare function constant<T>(x: T): () => T;
/**
 * Create a range of integers.
 */
export declare function range(times: number): number[];
export declare type OmitFirstArg<Func> = Func extends (firstArg: any, ...args: infer Args) => infer Ret ? (...args: Args) => Ret : never;
/**
 * Generate a randomized Nexus project name.
 */
export declare function generateProjectName(): string;
/**
 * Get the name of the CWD or if at disk root and thus making it impossible to
 * extract a meaningful name, generate one.
 */
export declare function CWDProjectNameOrGenerate(opts?: {
    cwd: string;
}): string;
/**
 * Creates a new git repository with an initial commit of all contents at the
 * time this function is run.
 */
export declare function createGitRepository(): Promise<void>;
export declare function requireModule(config: {
    depName: string;
    optional: boolean;
}): null | unknown;
/**
 * Check whether Worker Threads are available. In Node 10, workers aren't available by default.
 */
export declare function areWorkerThreadsAvailable(): boolean;
/**
 * Iterate through all values in a plain object and convert all paths into posix ones, and replace basePath if given and found with baesPathMask if given otherwise "<dynamic>".
 *
 * Special handling is given for errors, turning them into plain objects, stack and message properties dropped, enumerable props processed.
 */
export declare function normalizePathsInData<X>(x: X, basePath?: string, basePathMask?: string): X;
export declare function repalceInObject<C extends object>(dynamicPattern: string | RegExp, replacement: string, content: C): C;
export declare function replaceEvery(str: string, dynamicPattern: string, replacement: string): string;
/**
 * Creates an array of elements split into two groups.
 * The first of which contains elements predicate returns truthy for, the second of which contains elements predicate returns falsey for.
 * The predicate is invoked with one argument: (value).
 */
export declare function partition<T>(array: Array<T>, predicate: (value: T) => boolean): [Array<T>, Array<T>];
/**
 * Render IPv6 `::` as localhost. By default Node servers will use :: if IPv6
 * host is available otherwise IPv4 0.0.0.0. In local development it seems that
 * rendering as localhost makes the most sense as to what the user expects.
 * According to Node docs most operating systems that are supporting IPv6
 * somehow bind `::` to `0.0.0.0` anyways.
 */
export declare function prettifyHost(host: string): string;
declare type UnPromisify<T> = T extends Promise<infer U> ? U : T;
/**
 * Makes sure, that there is only one execution at a time
 * and the last invocation doesn't get lost (tail behavior of debounce)
 * Mostly designed for watch mode
 */
export declare function simpleDebounce<T extends (...args: any[]) => Promise<any>>(fn: T): (...args: Parameters<T>) => {
    type: 'result';
    data: UnPromisify<ReturnType<T>>;
} | {
    type: 'executing';
};
export declare type Index<T> = {
    [key: string]: T;
};
/**
 * An ESM-aware reading of the main entrypoint to a package.
 */
export declare function getPackageJsonMain(packageJson: PackageJson & {
    main: string;
}): string;
export declare type Exception = BaseException<'generic', any>;
export interface BaseException<T extends string, C extends SomeRecord> extends Error {
    type: T;
    context: C;
}
export declare function exceptionType<Type extends string, Context extends SomeRecord>(type: Type, messageOrTemplate: string | ((ctx: Context) => string)): (ctx: Context) => BaseException<Type, Context>;
/**
 * Create an error with contextual data about it.
 *
 * @remarks
 *
 * This is handy with fp-ts Either<...> because, unlike try-catch, errors are
 * strongly typed with the Either contstruct, making it so the error contextual
 * data flows with inference through your program.
 */
export declare function exception<Context extends SomeRecord = {}>(message: string, context?: Context): BaseException<'generic', Context>;
export declare type SerializedError = {
    name: string;
    message: string;
    stack?: string;
} & JsonObject;
export declare function serializeError(e: Error): SerializedError;
export declare function deserializeError(se: SerializedError): Error;
export declare function noop(): void;
/**
 * This makes the optimally pretty import path following Node's algorithm.
 *
 * @example
 *
 * ```
 * foo -> foo
 * ```
 * ```
 * foo/bar -> foo/bar
 * ```
 * ```
 * foo/bar.js -> foo/bar
 * ```
 * ```
 * foo/bar/index.js -> foo/bar
 * ```
 */
export declare function prettyImportPath(id: string): string;
declare type SomeRecord = Record<string, unknown>;
export declare function httpListen(server: HTTP.Server, options: Net.ListenOptions): Promise<void>;
export declare function httpClose(server: HTTP.Server): Promise<void>;
/**
 * Run require resolve from the given path
 */
export declare function requireResolveFrom(moduleId: string, fromPath: string): string;
export declare function indent(str: string, len: number, char?: string): string;
//# sourceMappingURL=index.d.ts.map