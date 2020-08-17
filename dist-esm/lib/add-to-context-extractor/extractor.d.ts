import { Either } from 'fp-ts/lib/Either';
import * as tsm from 'ts-morph';
import { Exception } from '../utils';
interface TypeImportInfo {
    name: string;
    modulePath: string;
    isExported: boolean;
    isNode: boolean;
}
export declare type ContribTypeRef = {
    kind: 'ref';
    name: string;
};
export declare type ContribTypeLiteral = {
    kind: 'literal';
    value: string;
};
export declare type ContribType = ContribTypeRef | ContribTypeLiteral;
export interface ExtractedContextTypes {
    typeImports: TypeImportInfo[];
    types: ContribType[];
}
/**
 * Extract types from all `addToContext` calls.
 */
export declare function extractContextTypes(program: tsm.Project, defaultTypes?: ExtractedContextTypes): Either<Exception, ExtractedContextTypes>;
export {};
//# sourceMappingURL=extractor.d.ts.map