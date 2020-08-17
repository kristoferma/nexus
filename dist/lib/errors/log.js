"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logPrettyError = void 0;
const tslib_1 = require("tslib");
const chalk_1 = tslib_1.__importDefault(require("chalk"));
const utils_1 = require("../utils");
const clean_1 = require("./stacktrace/clean");
const highlight_1 = require("./stacktrace/highlight");
const print_stack_1 = require("./stacktrace/print-stack");
function logPrettyError(log, err, level = 'error') {
    var _a;
    if (process.env.NEXUS_STAGE === 'dev') {
        const { preview, methodName, file } = print_stack_1.printStack({
            callsite: err.stack,
        });
        const methodNameMessage = methodName ? `on \`${highlight_1.highlightTS(methodName)}\` ` : '';
        const atMessage = file.pathLineNumber ? `at ${file.pathLineNumber}` : '';
        log[level](`${err.message} ${methodNameMessage}${atMessage}`);
        if (err.stack) {
            const cleanedStack = clean_1.cleanStack(err.stack, { withoutMessage: true }).split('\n').slice(1);
            const renderedStack = [utils_1.indent('Stack:', 2), ...cleanedStack]
                .map((s) => {
                // Highlight the line of the stack trace were the error happened in the user project
                if (file.pathRelToHomeDir && s.includes(file.pathRelToHomeDir)) {
                    return chalk_1.default.bold(chalk_1.default.redBright(s));
                }
                return s;
            })
                .join('\n');
            const filePreviewContent = preview ? `${utils_1.indent(preview, 2)}\n\n` : '';
            console.log('\n' + filePreviewContent + chalk_1.default.dim(renderedStack) + '\n');
        }
    }
    else {
        log[level](err.message, {
            error: Object.assign(Object.assign({}, err), { stack: clean_1.cleanStack((_a = err.stack) !== null && _a !== void 0 ? _a : '') }),
        });
    }
    if (level === 'fatal') {
        process.exit(1);
    }
}
exports.logPrettyError = logPrettyError;
//# sourceMappingURL=log.js.map