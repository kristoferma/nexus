import * as fs from 'fs-jetpack';
import { rootLogger } from '../nexus-logger';
const log = rootLogger.child('backingTypes');
export const defaultTSTypeMatcher = new RegExp(`export\\s+(?:interface|type|class|enum)\\s+(\\w+)`, 'g');
export function extract(filePaths) {
    const backingTypes = {};
    for (const filePath of filePaths) {
        if (!filePath) {
            continue;
        }
        const fileContent = fs.read(filePath);
        const typeNames = getMatches(fileContent, defaultTSTypeMatcher, 1);
        typeNames.forEach((typeName) => {
            backingTypes[typeName] = filePath;
        });
    }
    log.trace('extracted backing types from file', { backingTypes });
    return backingTypes;
}
function getMatches(stringToTest, regex, index) {
    const matches = [];
    let match;
    while ((match = regex.exec(stringToTest))) {
        matches.push(match[index]);
    }
    return matches;
}
//# sourceMappingURL=extract.js.map