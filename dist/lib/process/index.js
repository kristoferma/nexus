"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearConsole = exports.createRunner = exports.run = exports.runSync = exports.fatal = void 0;
const child_process_1 = require("child_process");
const common_tags_1 = require("common-tags");
const nexus_logger_1 = require("../nexus-logger");
/**
 * Log a meaningful semantic error message sans stack track and then crash
 * the program with exit code 1. Parameters are a passthrough to `console.error`.
 */
function fatal(errOrMsg, context) {
    if (errOrMsg instanceof Error) {
        nexus_logger_1.log.fatal(errOrMsg.message, context);
    }
    else {
        nexus_logger_1.log.fatal(errOrMsg, context);
    }
    process.exit(1);
}
exports.fatal = fatal;
// TODO conditional type over require option
function runSync(commandRaw, options) {
    const command = parseCommandString(commandRaw);
    const env = (options === null || options === void 0 ? void 0 : options.envAdditions) ? Object.assign(Object.assign({}, process.env), options.envAdditions) : process.env;
    const { stderr, stdout, status: exitCode, signal } = child_process_1.spawnSync(command.name, command.args, Object.assign(Object.assign({}, options), { encoding: 'utf8', env }));
    const error = isFailedExitCode(exitCode)
        ? createCommandError({
            command: commandRaw,
            underlyingError: null,
            stderr,
            stdout,
            exitCode,
            signal,
        })
        : null;
    if (error && (options === null || options === void 0 ? void 0 : options.require) === true) {
        throw error;
    }
    else {
        return { command: commandRaw, stderr, stdout, exitCode, signal, error };
    }
}
exports.runSync = runSync;
async function run(commandRaw, options) {
    const command = parseCommandString(commandRaw);
    const env = (options === null || options === void 0 ? void 0 : options.envAdditions) ? Object.assign(Object.assign({}, process.env), options.envAdditions) : process.env;
    const child = child_process_1.spawn(command.name, command.args, Object.assign(Object.assign({}, options), { 
        // Use shell on Windows so we don't have to specify absolute paths to commands
        // https://stackoverflow.com/questions/37459717/error-spawn-enoent-on-windows/37487465
        shell: process.platform === 'win32', env }));
    // TODO use proper signal typing, see child exit cb types
    const result = await new Promise((resolve, reject) => {
        // NOTE "exit" may fire after "error", in which case it will be a noop
        // as per how promises work.
        // When spawn is executed in pipe mode, then we buffer up the data for
        // later inspection
        // TODO return type should use conditional types to express mapping
        // between stdio option settings and resulting returned std err/out buffers.
        let stderr = null;
        let stdout = null;
        if (child.stderr) {
            stderr = '';
            child.stderr.on('data', bufferStderr);
        }
        if (child.stdout) {
            stdout = '';
            child.stdout.on('data', bufferStdout);
        }
        function bufferStderr(chunk) {
            stderr += String(chunk);
        }
        function bufferStdout(chunk) {
            stdout += String(chunk);
        }
        child.once('error', (error) => {
            const richError = createCommandError({
                command: commandRaw,
                underlyingError: error,
                stderr,
                stdout,
                signal: null,
                exitCode: null,
            });
            if ((options === null || options === void 0 ? void 0 : options.require) === true) {
                cleanup();
                reject(richError);
            }
            else {
                cleanup();
                resolve({
                    command: commandRaw,
                    stdout,
                    stderr,
                    signal: null,
                    error: richError,
                    exitCode: null,
                });
            }
        });
        child.once('exit', (exitCode, signal) => {
            const error = isFailedExitCode(exitCode)
                ? createCommandError({
                    command: commandRaw,
                    underlyingError: null,
                    signal,
                    stderr,
                    stdout,
                    exitCode,
                })
                : null;
            if ((options === null || options === void 0 ? void 0 : options.require) === true && isFailedExitCode(exitCode)) {
                cleanup();
                reject(error);
            }
            else {
                cleanup();
                resolve({
                    command: commandRaw,
                    signal,
                    stderr,
                    stdout,
                    exitCode,
                    error,
                });
            }
        });
        function cleanup() {
            var _a, _b;
            (_a = child.stderr) === null || _a === void 0 ? void 0 : _a.removeListener('data', bufferStderr);
            (_b = child.stdout) === null || _b === void 0 ? void 0 : _b.removeListener('data', bufferStdout);
        }
    });
    return result;
}
exports.run = run;
exports.createRunner = (cwd) => {
    return (cmd, opts) => {
        return runSync(cmd, Object.assign(Object.assign({}, opts), { cwd }));
    };
};
function createCommandError({ command, signal, stderr, stdout, exitCode, underlyingError, }) {
    const error = new Error(common_tags_1.stripIndent `
    The following command failed to complete successfully:

        ${command}

    It ended with this exit code:

        ${exitCode}

    This underlying error occured (null = none occured):

        ${underlyingError}

    It received signal (null = no signal received):

        ${signal}

    It output on stderr (null = not spawned in pipe mode):

        ${stderr}

    It output on stdout (null = not spawned in pipe mode):

        ${stdout}
  `);
    // @ts-ignore
    error.exitCode = exitCode;
    // @ts-ignore
    error.signal = signal;
    // @ts-ignore
    error.stderr = stderr;
    // @ts-ignore
    error.stdout = stdout;
    return error;
}
function parseCommandString(cmd) {
    const [name, ...args] = cmd.split(' ');
    return {
        name,
        args,
    };
}
function isFailedExitCode(exitCode) {
    return typeof exitCode === 'number' && exitCode !== 0;
}
function clearConsole() {
    /**
     * For convenience, we disable clearing the console when debugging
     */
    if (process.env.LOG_LEVEL !== undefined ||
        process.env.LOG_FILTER !== undefined ||
        process.env.NEXUS_NO_CLEAR !== undefined) {
        return;
    }
    process.stdout.write('\x1Bc');
}
exports.clearConsole = clearConsole;
//# sourceMappingURL=index.js.map