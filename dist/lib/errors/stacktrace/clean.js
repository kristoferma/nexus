"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanStack = void 0;
const tslib_1 = require("tslib");
const clean_stack_1 = tslib_1.__importDefault(require("clean-stack"));
const utils_1 = require("../../utils");
function cleanStack(stack, opts = { withoutMessage: false }) {
    if (opts.withoutMessage === false) {
        return clean_stack_1.default(stack, { pretty: true });
    }
    const cleanedStack = clean_stack_1.default(stack, { pretty: true }).split('\n').slice(1);
    return [utils_1.indent('Stack:', 2), ...cleanedStack].join('\n');
}
exports.cleanStack = cleanStack;
//# sourceMappingURL=clean.js.map