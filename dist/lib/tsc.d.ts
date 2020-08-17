import { Either } from 'fp-ts/lib/Either';
import * as TSM from 'ts-morph';
import * as tsm from 'ts-morph';
import * as ts from 'typescript';
import { Layout } from './layout';
import { Exception } from './utils';
interface ProgramOptions {
    withCache?: boolean;
}
/**
 * Create a TypeScript program.
 */
export declare function createTSProject(layout: Layout, options?: ProgramOptions): Either<Exception, tsm.Project>;
export declare function deleteTSIncrementalFile(layout: Layout): void;
export declare function getTSIncrementalFilePath(layout: Layout): string;
interface CompileOptions {
    skipTSErrors?: boolean;
    removePreviousBuild?: boolean;
}
/**
 * compile a program. Throws an error if the program does not type check.
 */
export declare function emitTSProgram(project: tsm.Project, // ts.EmitAndSemanticDiagnosticsBuilderProgram,
layout: Layout, options?: CompileOptions): void;
/**
 * Transpile a TS module to JS.
 */
export declare function transpileModule(input: string, compilerOptions: ts.CompilerOptions): string;
/**
 * Allow node to require TypeScript modules, transpiling them on the fly.
 *
 * @remarks
 *
 * This is strictly about transpilation, no type checking is done.
 */
export declare function registerTypeScriptTranspile(compilerOptions?: ts.CompilerOptions): void;
/**
 * Given a type, if it is a Promise, return the inner type. Otherwise just returns the given type as is (passthrough).
 *
 * Does not recursively unwrap Promise types. Only the first Promise, if one, is unwrapped.
 */
export declare function unwrapMaybePromise(type: TSM.Type): TSM.Type<TSM.ts.Type>;
/**
 * Check if the members of a union type are mergable. Only unions of interfaces and/or objects are considered mergable.
 */
export declare function isMergableUnion(type: TSM.Type): boolean;
/**
 * Merge a mergable union type into a single object. Returned as a string representation of TypeScript code. The given type should be validated by `isMergableUnion` first. The algorithm has the following rules:
 *
 * - A field with the same type accross all members results in simply that field
 * - A field with different types between members results in a union merge
 * - A field not shared by all members makes the field become optional
 * - A field shared by all members but is optional in one or more members makes the field become optional
 * - Field overloads are not supported, only the first declaration is considered
 *
 * @remarks This is useful in cases where you want to accept some user data and extract a single object type from it. What cases would single object types be explicitly desired over union types? One use-case is GraphQL context data. Its highly unlikely a user wants the context parameter of their resolver to be a union of types. Especially if the data contributions toward that type are not wholly owned by the user (e.g. plugins). Yet, users can and so will sometimes contribute data that leads to union types, for example because of conditional logic.
 *
 * TL;DR In general it is a bad idea to merge union members, but in some particular API design cases, the intent being modelled may warrant an exception.
 */
export declare function mergeUnionTypes(type: TSM.Type): string;
/**
 * Given a SourceFile get the absolute ID by which it would be imported.
 */
export declare function getAbsoluteImportPath(sourceFile: TSM.SourceFile): {
    isNode: boolean;
    modulePath: string;
};
/**
 * Find the modules in the project that import the given dep and return info about how that dep is imported along with sourceFile ref itself.
 */
export declare function findModulesThatImportModule(project: TSM.Project, id: string): ModulesWithImportSearchResult[];
/**
 * - "imports" list is non-empty array.
 * - At least one of import props "default" or "named" will be non-null, possibly both
 */
export declare type ModulesWithImportSearchResult = {
    sourceFile: TSM.SourceFile;
    imports: {
        default: null | TSM.Identifier;
        named: null | {
            alias: null | string;
            name: string;
        }[];
    }[];
};
export {};
//# sourceMappingURL=tsc.d.ts.map