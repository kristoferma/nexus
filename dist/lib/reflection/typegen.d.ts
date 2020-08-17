import * as NexusSchema from '@nexus/schema';
import * as Schema from '../../runtime/schema';
import * as Layout from '../layout';
import * as Plugin from '../plugin';
interface TypegenParams {
    layout: Layout.Layout;
    graphqlSchema: NexusSchema.core.NexusGraphQLSchema;
    schemaSettings: Schema.SettingsData;
    plugins: Plugin.RuntimeContributions[];
}
export declare function writeArtifacts(params: TypegenParams): Promise<import("fp-ts/lib/Either").Either<import("../utils").Exception, import("../add-to-context-extractor/extractor").ExtractedContextTypes>>;
export {};
//# sourceMappingURL=typegen.d.ts.map