"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractContextTypes = void 0;
const tslib_1 = require("tslib");
const Either_1 = require("fp-ts/lib/Either");
const tsm = tslib_1.__importStar(require("ts-morph"));
const typescript_1 = tslib_1.__importDefault(require("typescript"));
const nexus_logger_1 = require("../nexus-logger");
const tsc_1 = require("../tsc");
const utils_1 = require("../utils");
const errors_1 = require("./errors");
const log = nexus_logger_1.rootLogger.child('addToContextExtractor');
function contribTypeRef(name) {
    return { kind: 'ref', name };
}
function contribTypeLiteral(value) {
    return { kind: 'literal', value };
}
/**
 * Extract types from all `addToContext` calls.
 */
function extractContextTypes(program, defaultTypes = { typeImports: [], types: [] }) {
    const typeImportsIndex = {};
    const contextTypeContributions = defaultTypes;
    const appSourceFiles = tsc_1.findModulesThatImportModule(program, 'nexus');
    log.trace('got app source files', {
        count: appSourceFiles.length,
    });
    for (const item of appSourceFiles) {
        try {
            item.sourceFile.forEachChild((n) => visit(item, n));
        }
        catch (err) {
            return Either_1.left(err);
        }
    }
    log.trace('finished compiler extension processing', {
        contextTypeContributions,
    });
    // flush deduped type imports
    contextTypeContributions.typeImports.push(...Object.values(typeImportsIndex));
    return Either_1.right(contextTypeContributions);
    /**
     * Given a node, traverse the tree of nodes under it.
     */
    function visit(item, n) {
        var _a, _b;
        if (!tsm.Node.isCallExpression(n)) {
            n.forEachChild((n) => visit(item, n));
            return;
        }
        const exp = n.getExpression();
        if (!tsm.Node.isPropertyAccessExpression(exp)) {
            n.forEachChild((n) => visit(item, n));
            return;
        }
        const expText = exp.getExpression().getText();
        const propName = exp.getName();
        const importedIdentifiers = [];
        for (const imp of item.imports) {
            /**
             * case of e.g. import app from 'nexus'
             * Thus search for exp of "app.schema"
             */
            if (imp.default) {
                importedIdentifiers.push(imp.default.getText() + '.schema');
            }
            /**
             * case of e.g. import { schema } from 'nexus'
             * thus search for exp of "schema"
             *
             * case of e.g. import { schema as foo } from 'nexus'
             * thus search for exp of "foo"
             */
            const namedSchemaImport = (_a = imp.named) === null || _a === void 0 ? void 0 : _a.find((n) => n.name === 'schema');
            if (namedSchemaImport) {
                importedIdentifiers.push((_b = namedSchemaImport.alias) !== null && _b !== void 0 ? _b : namedSchemaImport.name);
            }
        }
        if (!(importedIdentifiers.includes(expText) && propName === 'addToContext')) {
            n.forEachChild((n) => visit(item, n));
            return;
        }
        log.trace('found call', { text: n.getText() });
        // Get the argument passed to addToContext so we can extract its type
        if (n.getArguments().length === 0) {
            log.trace('no args passed to call, the user should see a static type error, stopping extraction');
            return;
        }
        if (n.getArguments().length > 1) {
            log.trace('multiple args passed to call, the user should see a static type error, stopping extraction');
            return;
        }
        const contextAdder = n.getArguments()[0];
        const contextAdderType = contextAdder.getType(); // checker.getTypeAtLocation(contextAdder)
        const contextAdderSigs = contextAdderType.getCallSignatures();
        log.trace('found call arg', { text: contextAdder.getText() });
        // Get the signature of the argument so we can extract its return type
        if (contextAdderSigs.length === 0) {
            log.trace('arg had no signatures, this means the user passed a non-callable, the user should see a static type error, stopping context type extraction');
            return;
        }
        if (contextAdderSigs.length > 1) {
            log.warn('An overloaded function passed to addToContext. The first signature will be taken. This choice is arbitrary and may result in bad context extraction.', { text: contextAdder.getText() });
        }
        const contextAdderSig = contextAdderSigs[0];
        const contextAdderRetType = tsc_1.unwrapMaybePromise(contextAdderSig.getReturnType());
        let contextAdderRetTypeString = contextAdderRetType.getText(undefined, tsm.ts.TypeFormatFlags.NoTruncation);
        if (tsc_1.isMergableUnion(contextAdderRetType)) {
            contextAdderRetTypeString = tsc_1.mergeUnionTypes(contextAdderRetType);
        }
        else if (contextAdderRetType.isUnion()) {
            throw errors_1.forbiddenUnionTypeError({
                unionType: contextAdderRetType.getText(undefined, tsm.ts.TypeFormatFlags.NoTruncation),
            });
        }
        if (contextAdderRetType.isInterface() || contextAdderRetType.getAliasSymbol()) {
            const info = extractTypeImportInfoFromType(contextAdderRetType);
            if (info) {
                typeImportsIndex[info.name] = info;
            }
            contextTypeContributions.types.push(contribTypeRef(contextAdderRetTypeString));
            return;
        }
        contextTypeContributions.types.push(contribTypeLiteral(contextAdderRetTypeString));
        /**
         * Search for type references. They must be imported later.
         */
        const contextAdderRetProps = contextAdderRetType.getProperties();
        for (const prop of contextAdderRetProps) {
            log.trace('processing prop', { name: prop.getName() });
            const tsmn = prop.getDeclarations()[0]; // todo log warning if > 1
            const t = tsmn.getType();
            if (t.getAliasSymbol()) {
                log.trace('found alias', {
                    type: t.getText(undefined, typescript_1.default.TypeFormatFlags.NoTruncation),
                });
                captureTypeImport(typeImportsIndex, t);
            }
            else if (t.isIntersection()) {
                log.trace('found intersection', {
                    types: t.getIntersectionTypes().map((t) => t.getText(undefined, typescript_1.default.TypeFormatFlags.NoTruncation)),
                });
                captureTypeImport(typeImportsIndex, t.getIntersectionTypes());
            }
            else if (t.isUnion()) {
                log.trace('found union', {
                    types: t.getUnionTypes().map((t) => t.getText(undefined, typescript_1.default.TypeFormatFlags.NoTruncation)),
                });
                captureTypeImport(typeImportsIndex, t.getUnionTypes());
            }
            else {
                captureTypeImport(typeImportsIndex, t);
            }
        }
    }
}
exports.extractContextTypes = extractContextTypes;
function captureTypeImport(registry, t) {
    const types = Array.isArray(t) ? t : [t];
    const infos = types.map((t) => extractTypeImportInfoFromType(t)).filter((info) => info !== null);
    infos.forEach((info) => {
        registry[info.name] = info;
    });
    /**
     * Capture any type arguments of the type
     */
    types.forEach((t) => {
        log.trace('checking type for type arguments', { text: t.getText() });
        //todo only call alias type arguments method if type is an alias?
        const typeArguments = [...t.getAliasTypeArguments(), ...t.getTypeArguments()];
        typeArguments.forEach((typeArg) => {
            log.trace('extracting import info for generic', { text: typeArg.getText() });
            const info = extractTypeImportInfoFromType(typeArg);
            if (info) {
                registry[info.name] = info;
            }
        });
    });
}
/**
 * Get information about how to import the given type.
 */
function extractTypeImportInfoFromType(t) {
    var _a;
    let sym = t.getAliasSymbol();
    let name = sym === null || sym === void 0 ? void 0 : sym.getName();
    log.trace('found prop type alias symbol?', { found: !!sym });
    if (t.isArray()) {
        return extractTypeImportInfoFromType(t.getArrayElementTypeOrThrow());
    }
    if (!sym) {
        sym = t.getSymbol();
        log.trace('found prop type symbol?', { found: !!sym });
        if (!sym)
            return null;
        name = sym.getName();
        // not alias but is inline, then skip
        if (name === '__object')
            return null;
        if (name === '__type')
            return null;
    }
    log.trace('found name?', { name });
    if (!name)
        return null;
    const d = (_a = sym.getDeclarations()) === null || _a === void 0 ? void 0 : _a[0];
    if (!d)
        throw utils_1.exception('A type with a symbol but the symbol has no declaration', {});
    const sourceFile = d.getSourceFile();
    const { modulePath, isNode } = tsc_1.getAbsoluteImportPath(sourceFile);
    return {
        name: name,
        modulePath: modulePath,
        isExported: sourceFile.getExportedDeclarations().has(name),
        isNode: isNode,
    };
}
//# sourceMappingURL=extractor.js.map