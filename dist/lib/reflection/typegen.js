"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeArtifacts = void 0;
const tslib_1 = require("tslib");
const add_to_context_extractor_1 = require("../add-to-context-extractor");
const nexus_logger_1 = require("../nexus-logger");
const BackingTypes = tslib_1.__importStar(require("../nexus-schema-backing-types"));
const typegen_1 = require("../nexus-schema-stateful/typegen");
const log = nexus_logger_1.rootLogger.child('addToContextExtractor');
async function writeArtifacts(params) {
    // Generate the backing types typegen file
    const backingTypes = await BackingTypes.generateBackingTypesArtifacts(params.schemaSettings.rootTypingsGlobPattern, {
        extractCwd: params.layout.sourceRoot,
    });
    // Generate the nexus typegen file and the GraphQL SDL file
    const nexusSchemaTypegenPromise = typegen_1.generateArtifacts(Object.assign(Object.assign({}, params), { graphqlSchema: BackingTypes.remapSchemaWithRootTypings(params.graphqlSchema, backingTypes) }));
    // Generate the context typegen file
    const contextExtractorTypegenPromise = add_to_context_extractor_1.generateContextExtractionArtifacts(params.layout);
    const [_, contextExtractorTypegen] = await Promise.all([
        nexusSchemaTypegenPromise,
        contextExtractorTypegenPromise,
    ]);
    return contextExtractorTypegen;
}
exports.writeArtifacts = writeArtifacts;
//# sourceMappingURL=typegen.js.map