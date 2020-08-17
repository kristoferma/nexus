import { Either } from 'fp-ts/lib/Either';
import * as Layout from '../layout';
import { Exception } from '../utils';
import { ExtractedContextTypes } from './extractor';
export declare const NEXUS_DEFAULT_RUNTIME_CONTEXT_TYPEGEN_PATH: string;
export declare const DEFAULT_CONTEXT_TYPES: ExtractedContextTypes;
/**
 * Run the pure extractor and then write results to a typegen module.
 */
export declare function generateContextExtractionArtifacts(layout: Layout.Layout): Promise<Either<Exception, ExtractedContextTypes>>;
/**
 * Output the context types to a typegen file.
 */
export declare function writeContextTypeGenFile(contextTypes: ExtractedContextTypes): Promise<void>;
//# sourceMappingURL=typegen.d.ts.map