"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeContextTypeGenFile = exports.generateContextExtractionArtifacts = exports.DEFAULT_CONTEXT_TYPES = exports.NEXUS_DEFAULT_RUNTIME_CONTEXT_TYPEGEN_PATH = void 0;
const tslib_1 = require("tslib");
const common_tags_1 = require("common-tags");
const Either_1 = require("fp-ts/lib/Either");
const fs = tslib_1.__importStar(require("fs-jetpack"));
const slash_1 = tslib_1.__importDefault(require("slash"));
const fs_1 = require("../fs");
const nexus_logger_1 = require("../nexus-logger");
const tsc_1 = require("../tsc");
const utils_1 = require("../utils");
const extractor_1 = require("./extractor");
const log = nexus_logger_1.rootLogger.child('addToContextExtractor');
exports.NEXUS_DEFAULT_RUNTIME_CONTEXT_TYPEGEN_PATH = fs.path('node_modules', '@types', 'typegen-nexus-context', 'index.d.ts');
exports.DEFAULT_CONTEXT_TYPES = {
    typeImports: [
        {
            name: 'ContextAdderLens',
            modulePath: utils_1.prettyImportPath(require.resolve('../../runtime/schema/schema')),
            isExported: true,
            isNode: false,
        },
    ],
    types: [{ kind: 'ref', name: 'ContextAdderLens' }],
};
/**
 * Run the pure extractor and then write results to a typegen module.
 */
async function generateContextExtractionArtifacts(layout) {
    log.trace('starting context type extraction');
    const errProject = tsc_1.createTSProject(layout, { withCache: true });
    if (Either_1.isLeft(errProject))
        return errProject;
    const tsProject = errProject.right;
    const contextTypes = extractor_1.extractContextTypes(tsProject, exports.DEFAULT_CONTEXT_TYPES);
    if (Either_1.isLeft(contextTypes)) {
        return contextTypes;
    }
    await writeContextTypeGenFile(contextTypes.right);
    log.trace('finished context type extraction', { contextTypes });
    return contextTypes;
}
exports.generateContextExtractionArtifacts = generateContextExtractionArtifacts;
/**
 * Output the context types to a typegen file.
 */
async function writeContextTypeGenFile(contextTypes) {
    let addToContextInterfaces = contextTypes.types
        .map(renderContextInterfaceForExtractedReturnType)
        .join('\n\n');
    if (addToContextInterfaces.trim() === '') {
        addToContextInterfaces = `interface Context {} // none\n\n`;
    }
    const content = common_tags_1.codeBlock `
    import app from 'nexus'

    // Imports for types referenced by context types.

    ${contextTypes.typeImports
        .map((ti) => renderImport({ names: [ti.name], from: ti.modulePath }))
        .join('\n')}

    // Tap into Nexus' global context interface. Make all local context interfaces merge into it.

    declare global {
      export interface NexusContext extends Context {}
    }

    // The context types extracted from the app.

    ${addToContextInterfaces}
  `;
    await fs_1.hardWriteFile(exports.NEXUS_DEFAULT_RUNTIME_CONTEXT_TYPEGEN_PATH, content);
}
exports.writeContextTypeGenFile = writeContextTypeGenFile;
function renderImport(input) {
    return `import { ${input.names.join(', ')} } from '${slash_1.default(input.from)}'`;
}
function renderContextInterfaceForExtractedReturnType(contribType) {
    switch (contribType.kind) {
        case 'literal':
            return `interface Context ${contribType.value}`;
        case 'ref':
            return `interface Context extends ${contribType.name} {}`;
    }
}
//# sourceMappingURL=typegen.js.map