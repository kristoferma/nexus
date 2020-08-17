import cleanStackDep from 'clean-stack';
import { indent } from '../../utils';
export function cleanStack(stack, opts = { withoutMessage: false }) {
    if (opts.withoutMessage === false) {
        return cleanStackDep(stack, { pretty: true });
    }
    const cleanedStack = cleanStackDep(stack, { pretty: true }).split('\n').slice(1);
    return [indent('Stack:', 2), ...cleanedStack].join('\n');
}
//# sourceMappingURL=clean.js.map