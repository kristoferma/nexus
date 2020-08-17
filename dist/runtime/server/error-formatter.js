"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.printSourceLocation = exports.errorFormatter = void 0;
const tslib_1 = require("tslib");
const chalk_1 = tslib_1.__importDefault(require("chalk"));
const strip_ansi_1 = tslib_1.__importDefault(require("strip-ansi"));
const errors_1 = require("../../lib/errors");
const highlight_1 = require("../../lib/errors/stacktrace/highlight");
const utils_1 = require("../../lib/utils");
const logger_1 = require("./logger");
const resolverLogger = logger_1.log.child('graphql');
function errorFormatter(graphQLError) {
    var _a, _b;
    const colorlessMessage = strip_ansi_1.default(graphQLError.message);
    if (process.env.NEXUS_STAGE === 'dev') {
        resolverLogger.error(graphQLError.message);
        if (graphQLError.source && graphQLError.locations) {
            console.log('\n' + utils_1.indent(printSourceLocation(graphQLError.source, graphQLError.locations[0]), 2) + '\n');
            if ((_b = (_a = graphQLError.extensions) === null || _a === void 0 ? void 0 : _a.exception) === null || _b === void 0 ? void 0 : _b.stacktrace) {
                console.log(chalk_1.default.dim(errors_1.cleanStack(graphQLError.extensions.exception.stacktrace.join('\n'), { withoutMessage: true })) + '\n');
            }
        }
    }
    else {
        graphQLError.message = colorlessMessage;
        resolverLogger.error('An exception occurred in one of your resolver', {
            error: Object.assign({}, graphQLError),
        });
    }
    graphQLError.message = colorlessMessage;
    return graphQLError;
}
exports.errorFormatter = errorFormatter;
/**
 * Render a helpful description of the location in the GraphQL Source document.
 * Modified version from graphql-js
 */
function printSourceLocation(source, sourceLocation) {
    const firstLineColumnOffset = source.locationOffset.column - 1;
    const body = whitespace(firstLineColumnOffset) + highlight_1.highlightGraphQL(source.body);
    const lineIndex = sourceLocation.line - 1;
    const lineOffset = source.locationOffset.line - 1;
    const lineNum = sourceLocation.line + lineOffset;
    const columnOffset = sourceLocation.line === 1 ? firstLineColumnOffset : 0;
    const columnNum = sourceLocation.column + columnOffset;
    const lines = body.split(/\r\n|[\n\r]/g);
    const locationLine = lines[lineIndex];
    //TODO: bring back trimmed formatting later. We cannot break lines at random positions or it breaks the syntax highlighting
    // Special case for minified documents
    // if (locationLine.length > 120) {
    //   const subLineIndex = Math.floor(columnNum / 80)
    //   const subLineColumnNum = columnNum % 80
    //   const subLines = []
    //   for (let i = 0; i < locationLine.length; i += 80) {
    //     subLines.push(locationLine.slice(i, i + 80))
    //   }
    //   return printPrefixedLines([
    //     [`${lineNum}`, subLines[0]],
    //     ...subLines.slice(1, subLineIndex + 1).map((subLine) => ['', subLine]),
    //     [' ', whitespace(subLineColumnNum - 1) + chalk.redBright('^')],
    //     ['', subLines[subLineIndex + 1]],
    //   ])
    // }
    return printPrefixedLines([
        // Lines specified like this: ["prefix", "string"],
        [`${lineNum - 1}`, lines[lineIndex - 1]],
        [`${lineNum}`, locationLine],
        ['', whitespace(columnNum - 1) + chalk_1.default.redBright('^')],
        [`${lineNum + 1}`, lines[lineIndex + 1]],
    ]);
}
exports.printSourceLocation = printSourceLocation;
function printPrefixedLines(lines) {
    const existingLines = lines.filter(([_, line]) => line !== undefined);
    const padLen = Math.max(...existingLines.map(([prefix]) => prefix.length));
    return existingLines
        .map(([prefix, line]) => chalk_1.default.dim(leftPad(padLen, prefix)) + (line ? chalk_1.default.dim(' | ') + line : chalk_1.default.dim(' |')))
        .join('\n');
}
function whitespace(len) {
    return Array(len + 1).join(' ');
}
function leftPad(len, str) {
    return whitespace(len - str.length) + str;
}
//# sourceMappingURL=error-formatter.js.map