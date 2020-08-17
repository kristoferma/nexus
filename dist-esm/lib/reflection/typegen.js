import { generateContextExtractionArtifacts } from '../add-to-context-extractor';
import { rootLogger } from '../nexus-logger';
import * as BackingTypes from '../nexus-schema-backing-types';
import { generateArtifacts } from '../nexus-schema-stateful/typegen';
const log = rootLogger.child('addToContextExtractor');
export async function writeArtifacts(params) {
    // Generate the backing types typegen file
    const backingTypes = await BackingTypes.generateBackingTypesArtifacts(params.schemaSettings.rootTypingsGlobPattern, {
        extractCwd: params.layout.sourceRoot,
    });
    // Generate the nexus typegen file and the GraphQL SDL file
    const nexusSchemaTypegenPromise = generateArtifacts(Object.assign(Object.assign({}, params), { graphqlSchema: BackingTypes.remapSchemaWithRootTypings(params.graphqlSchema, backingTypes) }));
    // Generate the context typegen file
    const contextExtractorTypegenPromise = generateContextExtractionArtifacts(params.layout);
    const [_, contextExtractorTypegen] = await Promise.all([
        nexusSchemaTypegenPromise,
        contextExtractorTypegenPromise,
    ]);
    return contextExtractorTypegen;
}
//# sourceMappingURL=typegen.js.map