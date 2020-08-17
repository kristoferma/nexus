import { suggestionList } from '../levenstein';
import { rootLogger } from '../nexus-logger';
const log = rootLogger.child('backingTypes');
/**
 * Remaps the rootTypings stored in the schema to actual filePath & typeName
 * so that @nexus/schema can properly import them in its typegen file
 * eg: 'CustomType1' -> { path: __filename, name: 'CustomType1' }
 */
export function remapSchemaWithRootTypings(schema, backingTypes) {
    Object.entries(schema.extensions.nexus.config.rootTypings).forEach(([typeName, rootType]) => {
        if (typeof rootType === 'string') {
            const filePath = backingTypes[rootType];
            if (!filePath) {
                const suggestions = suggestionList(rootType, Object.keys(backingTypes));
                log.warn(`We could not find the backing type '${rootType}' used in '${typeName}'`);
                if (suggestions.length > 0) {
                    log.warn(`Did you mean ${suggestions.map((s) => `"${s}"`).join(', ')} ?`);
                }
                return;
            }
            schema.extensions.nexus.config.rootTypings[typeName] = {
                name: rootType,
                path: filePath,
            };
        }
    });
    return schema;
}
//# sourceMappingURL=remap-root-typings.js.map