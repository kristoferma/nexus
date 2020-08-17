import { __rest } from "tslib";
import { clone, isArray, isPlainObject, isString } from 'lodash';
import Module from 'module';
import * as Path from 'path';
import Git from 'simple-git/promise';
import slash from 'slash';
export * from './either';
/**
 * Guarantee the length of a given string, padding before or after with the
 * given character. If the given string is longer than  the span target, then it
 * will be cropped.
 */
export function span(padSide, padChar, target, content) {
    if (content.length > target) {
        return content.slice(0, target);
    }
    let toPadSize = target - content.length;
    while (toPadSize > 0) {
        if (padSide === 'padAfter') {
            content = content + padChar;
        }
        else if (padSide === 'padBefore') {
            content = padChar + content;
        }
        toPadSize--;
    }
    return content;
}
/**
 * Guarantee the length of a given string, padding with space as needed. Content
 * is aligned left and if exceeds span target length to begin with gets cropped.
 */
export const clampSpace = span.bind(null, 'padAfter', ' ');
/**
 * Create a string of space of the given length.
 */
export function spanSpace(num) {
    return spanChar(num, ' ');
}
/**
 * Create a string of the given length and character
 */
export function spanChar(num, char) {
    return range(num).map(constant(char)).join('');
}
/**
 * Guarantee the length of a given string, padding with space as needed. Content
 * is aligned right and if exceeds span target length to begin with gets cropped.
 */
export const spanSpaceRight = span.bind(null, 'padBefore', ' ');
/**
 * Use this to make assertion at end of if-else chain that all members of a
 * union have been accounted for.
 */
export function casesHandled(x) {
    throw new Error(`A case was not handled for value: ${x}`);
}
/**
 * Create a function that will only ever return the given value when called.
 */
export function constant(x) {
    return function () {
        return x;
    };
}
/**
 * Create a range of integers.
 */
export function range(times) {
    const list = [];
    while (list.length < times) {
        list.push(list.length + 1);
    }
    return list;
}
/**
 * Generate a randomized Nexus project name.
 */
export function generateProjectName() {
    return 'my-nexus-app-' + Math.random().toString().slice(2);
}
/**
 * Get the name of the CWD or if at disk root and thus making it impossible to
 * extract a meaningful name, generate one.
 */
export function CWDProjectNameOrGenerate(opts = { cwd: process.cwd() }) {
    return Path.basename(opts.cwd) || generateProjectName();
}
/**
 * Creates a new git repository with an initial commit of all contents at the
 * time this function is run.
 */
export async function createGitRepository() {
    const git = Git();
    await git.init();
    await git.raw(['add', '-A']);
    await git.raw(['commit', '-m', 'initial commit']);
}
export function requireModule(config) {
    const depPath = process.env.LINK
        ? Path.join(process.cwd(), '/node_modules/', config.depName)
        : config.depName;
    try {
        const dep = require(depPath);
        // The code may have been compiled from a TS source and then may have a .default property
        if (dep.default !== undefined) {
            return dep.default;
        }
        else {
            return dep;
        }
    }
    catch (error) {
        if (error.code === 'MODULE_NOT_FOUND' && config.optional) {
            return null;
        }
        throw error;
    }
}
/**
 * Check whether Worker Threads are available. In Node 10, workers aren't available by default.
 */
export function areWorkerThreadsAvailable() {
    try {
        require('worker_threads');
        return true;
    }
    catch (error) {
        if (error.code === 'MODULE_NOT_FOUND') {
            return false;
        }
        throw error;
    }
}
/**
 * Iterate through all values in a plain object and convert all paths into posix ones, and replace basePath if given and found with baesPathMask if given otherwise "<dynamic>".
 *
 * Special handling is given for errors, turning them into plain objects, stack and message properties dropped, enumerable props processed.
 */
export function normalizePathsInData(x, basePath, basePathMask) {
    if (isString(x)) {
        let x_ = x;
        if (basePath) {
            x_ = replaceEvery(x_, basePath, basePathMask !== null && basePathMask !== void 0 ? basePathMask : '<dynamic>');
            x_ = replaceEvery(x_, slash(basePath), basePathMask !== null && basePathMask !== void 0 ? basePathMask : '<dynamic>');
        }
        x_ = replaceEvery(x_, Path.sep, Path.posix.sep);
        return x_;
    }
    if (isArray(x)) {
        return x.map((item) => {
            return normalizePathsInData(item, basePath, basePathMask);
        });
    }
    if (isPlainObject(x)) {
        const x_ = {};
        for (const [k, v] of Object.entries(x)) {
            x_[k] = normalizePathsInData(v, basePath, basePathMask);
        }
        return x_;
    }
    if (x instanceof Error) {
        const x_ = clone(x);
        for (const [k, v] of Object.entries(x)) {
            const anyx_ = x_;
            anyx_[k] = normalizePathsInData(v, basePath, basePathMask);
        }
        return x_;
    }
    return x;
}
// todo extends Json
export function repalceInObject(dynamicPattern, replacement, content) {
    return JSON.parse(JSON.stringify(content)
        .split(JSON.stringify(dynamicPattern).replace(/^"|"$/g, ''))
        .join(replacement)
        // Normalize snapshotted paths across OSs
        // Namely turn Windows "\" into "/"
        .split(Path.sep)
        .join('/'));
}
export function replaceEvery(str, dynamicPattern, replacement) {
    return str.split(dynamicPattern).join(replacement);
}
/**
 * Creates an array of elements split into two groups.
 * The first of which contains elements predicate returns truthy for, the second of which contains elements predicate returns falsey for.
 * The predicate is invoked with one argument: (value).
 */
export function partition(array, predicate) {
    const partitioned = [[], []];
    for (const value of array) {
        const partitionIndex = predicate(value) ? 0 : 1;
        partitioned[partitionIndex].push(value);
    }
    return partitioned;
}
/**
 * Render IPv6 `::` as localhost. By default Node servers will use :: if IPv6
 * host is available otherwise IPv4 0.0.0.0. In local development it seems that
 * rendering as localhost makes the most sense as to what the user expects.
 * According to Node docs most operating systems that are supporting IPv6
 * somehow bind `::` to `0.0.0.0` anyways.
 */
export function prettifyHost(host) {
    return host === '::' ? 'localhost' : host;
}
/**
 * Makes sure, that there is only one execution at a time
 * and the last invocation doesn't get lost (tail behavior of debounce)
 * Mostly designed for watch mode
 */
export function simpleDebounce(fn) {
    let executing = false;
    let pendingExecution = null;
    let res;
    return (async (...args) => {
        if (executing) {
            // if there's already an execution, make it pending
            pendingExecution = args;
            return { type: 'executing' };
        }
        executing = true;
        res = await fn(...args).catch((e) => console.error(e));
        if (pendingExecution) {
            res = await fn(...args).catch((e) => console.error(e));
            pendingExecution = null;
        }
        executing = false;
        return { type: 'result', data: res };
    });
}
/**
 * An ESM-aware reading of the main entrypoint to a package.
 */
export function getPackageJsonMain(packageJson) {
    // todo when building for a bundler, we want to read from the esm paths. Otherwise the cjs paths.
    //  - this condition takes a stab at the problem but is basically a stub.
    //  - this todo only needs to be completed once we are actually trying to do esm tree-shaking (meaning, we've moved beyond node-file-trace)
    return process.env.ESM && packageJson.module
        ? Path.dirname(packageJson.module)
        : Path.dirname(packageJson.main);
}
export function exceptionType(type, messageOrTemplate) {
    // todo overload function (or two functions)
    // make template optional
    // if given, return factory that only accepts context
    // if not given, return factory that accepts message + context
    return (ctx) => {
        const e = new Error(typeof messageOrTemplate === 'string' ? messageOrTemplate : messageOrTemplate(ctx));
        e.type = type;
        e.context = ctx;
        return e;
    };
}
/**
 * Create an error with contextual data about it.
 *
 * @remarks
 *
 * This is handy with fp-ts Either<...> because, unlike try-catch, errors are
 * strongly typed with the Either contstruct, making it so the error contextual
 * data flows with inference through your program.
 */
export function exception(message, context) {
    const e = new Error(message);
    Object.defineProperty(e, 'message', {
        enumerable: true,
        value: e.message,
    });
    if (context) {
        e.context = context;
    }
    e.type = 'generic';
    return e;
}
export function serializeError(e) {
    return Object.assign(Object.assign({}, e), { name: e.name, message: e.message, stack: e.stack });
}
export function deserializeError(se) {
    const { name, stack, message } = se, rest = __rest(se, ["name", "stack", "message"]);
    const e = name === 'EvalError'
        ? new EvalError(message)
        : name === 'RangeError'
            ? new RangeError(message)
            : name === 'TypeError'
                ? new TypeError(message)
                : name === 'URIError'
                    ? new URIError(message)
                    : name === 'SyntaxError'
                        ? new SyntaxError(message)
                        : name === 'ReferenceError'
                            ? new ReferenceError(message)
                            : new Error(message);
    Object.defineProperty(e, 'stack', {
        enumerable: false,
        value: stack,
    });
    Object.assign(e, rest);
    return e;
}
export function noop() { }
/**
 * This makes the optimally pretty import path following Node's algorithm.
 *
 * @example
 *
 * ```
 * foo -> foo
 * ```
 * ```
 * foo/bar -> foo/bar
 * ```
 * ```
 * foo/bar.js -> foo/bar
 * ```
 * ```
 * foo/bar/index.js -> foo/bar
 * ```
 */
export function prettyImportPath(id) {
    const { dir, name, ext } = Path.parse(id);
    if (name === 'index')
        return dir;
    if (ext) {
        return id.replace(ext, '');
    }
    return id;
}
export function httpListen(server, options) {
    return new Promise((res, rej) => {
        server.listen(options, () => {
            res();
        });
    });
}
export function httpClose(server) {
    return new Promise((res, rej) => {
        server.close((err) => {
            if (err) {
                rej(err);
            }
            else {
                res();
            }
        });
    });
}
/**
 * Run require resolve from the given path
 */
export function requireResolveFrom(moduleId, fromPath) {
    const resolvedPath = require.resolve(moduleId, {
        paths: Module._nodeModulePaths(fromPath),
    });
    return slash(resolvedPath);
}
export function indent(str, len, char = ' ') {
    return str
        .split('\n')
        .map((s) => char.repeat(len) + s)
        .join('\n');
}
//# sourceMappingURL=index.js.map