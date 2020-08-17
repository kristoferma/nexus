"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProjectRoot = exports.printStack = void 0;
const tslib_1 = require("tslib");
const chalk_1 = tslib_1.__importDefault(require("chalk"));
const fs = tslib_1.__importStar(require("fs-jetpack"));
const os = tslib_1.__importStar(require("os"));
const path = tslib_1.__importStar(require("path"));
const stackTraceParser = tslib_1.__importStar(require("stacktrace-parser"));
const highlight_1 = require("./highlight");
const schemaRegex = /(\S+(objectType|inputObjectType|interfaceType|unionType|enumType|queryType|mutationType|subscriptionType|extendType|scalarType|importType|)\()/;
exports.printStack = ({ callsite }) => {
    let fileLineNumber = null;
    let filePreview = null;
    let filePath = null;
    let filePathRelToHomeDir = null;
    let methodName = null;
    // @ts-ignore
    if (callsite && typeof window === 'undefined') {
        const stack = stackTraceParser.parse(callsite);
        // TODO: more resilient logic to find the right trace
        const trace = stack.find((t) => t.file &&
            !t.file.includes('node_modules/nexus') &&
            !t.file.includes('node_modules/@nexus/schema') &&
            !t.file.includes('node_modules/graphql'));
        if (process.env.NEXUS_STAGE === 'dev' &&
            trace &&
            trace.file &&
            trace.lineNumber &&
            trace.column &&
            !trace.file.startsWith('internal/')) {
            const lineNumber = trace.lineNumber;
            const projectRoot = getProjectRoot();
            const tracePathRelToProjectRoot = projectRoot ? path.relative(projectRoot, trace.file) : trace.file;
            const tracePathRelToHomeDir = trace.file.replace(os.homedir(), '~');
            fileLineNumber = callsite
                ? `${chalk_1.default.underline(`${tracePathRelToProjectRoot}:${lineNumber}:${trace.column}`)}`
                : '';
            if (fs.exists(trace.file)) {
                const fileContent = fs.read(trace.file);
                const splitFile = fileContent.split('\n');
                const start = Math.max(0, lineNumber - 3);
                const end = Math.min(lineNumber + 3, splitFile.length - 1);
                const lines = splitFile.slice(start, end);
                const theLine = lines[2];
                const match = theLine.match(schemaRegex);
                if (match) {
                    methodName = `${match[1]})`;
                }
                const highlightedLines = highlight_1.highlightTS(lines.join('\n')).split('\n');
                filePreview = highlightedLines
                    .map((l, i) => chalk_1.default.grey(renderN(i + start + 1, lineNumber + start + 1) + ' ') + chalk_1.default.reset() + l)
                    .map((l, i, _arr) => i === 2
                    ? `${chalk_1.default.red.bold('→')} ${l} ${chalk_1.default.dim(`${tracePathRelToHomeDir}:${lineNumber}:${trace.column}`)}`
                    : chalk_1.default.dim('  ' + l))
                    .join('\n');
                filePath = trace.file;
                filePathRelToHomeDir = tracePathRelToHomeDir;
            }
        }
    }
    return {
        preview: filePreview ? `${filePreview}${chalk_1.default.reset()}` : null,
        methodName,
        file: {
            path: filePath,
            pathLineNumber: fileLineNumber,
            pathRelToHomeDir: filePathRelToHomeDir,
        },
    };
};
function renderN(n, max) {
    const wantedLetters = String(max).length;
    const hasLetters = String(n).length;
    if (hasLetters >= wantedLetters) {
        return String(n);
    }
    return String(' '.repeat(wantedLetters - hasLetters) + n);
}
/**
 * Stack overflow reference: https://stackoverflow.com/a/43960876
 */
function getProjectRoot() {
    var _a, _b;
    return (_b = (_a = process === null || process === void 0 ? void 0 : process.mainModule) === null || _a === void 0 ? void 0 : _a.paths[0].split('node_modules')[0].slice(0, -1)) !== null && _b !== void 0 ? _b : null;
}
exports.getProjectRoot = getProjectRoot;
//# sourceMappingURL=print-stack.js.map