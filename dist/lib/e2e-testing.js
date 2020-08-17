"use strict";
/**
 * These testing utilities live here so that `nexus-plugin-prisma` can reuse them
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.spawn = exports.createE2EContext = void 0;
const tslib_1 = require("tslib");
const Logger = tslib_1.__importStar(require("@nexus/logger"));
const FS = tslib_1.__importStar(require("fs-jetpack"));
const os = tslib_1.__importStar(require("os"));
const Path = tslib_1.__importStar(require("path"));
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const strip_ansi_1 = tslib_1.__importDefault(require("strip-ansi"));
const which = tslib_1.__importStar(require("which"));
const graphql_client_1 = require("../lib/graphql-client");
const fs_1 = require("./fs");
const nexus_logger_1 = require("./nexus-logger");
const log = nexus_logger_1.rootLogger.child('e2eTesting');
/**
 * The path at which to spawn node processes
 */
const NODE_PATH = os.platform() === 'win32' ? 'node.exe' : 'node';
function createE2EContext(config) {
    var _a, _b;
    Logger.log.settings({ filter: { level: 'trace' } });
    process.env.LOG_LEVEL = 'trace';
    if (config.serverPort) {
        process.env.PORT = String(config.serverPort);
    }
    const localNexusBinPath = config.localNexus
        ? Path.join(config.localNexus.path, 'dist', 'cli', 'main')
        : null;
    const projectDir = (_a = config === null || config === void 0 ? void 0 : config.dir) !== null && _a !== void 0 ? _a : fs_1.getTmpDir('e2e-app');
    const PROJ_NEXUS_BIN_PATH = Path.join(projectDir, 'node_modules', '.bin', 'nexus');
    log.trace('setup', { projectDir, config });
    FS.dir(projectDir);
    const contextAPI = {
        usingLocalNexus: config.localNexus,
        /**
         * Ignore this if usingLocalNexus is set.
         */
        useNexusVersion: (_b = process.env.E2E_NEXUS_VERSION) !== null && _b !== void 0 ? _b : 'latest',
        dir: projectDir,
        config: config,
        getTmpDir: fs_1.getTmpDir,
        fs: FS.cwd(projectDir),
        client: new graphql_client_1.GraphQLClient(`http://localhost:${config.serverPort}/graphql`),
        node(args, opts = {}) {
            return spawn(NODE_PATH, args, Object.assign({ cwd: projectDir }, opts));
        },
        spawn(binPathAndArgs, opts = {}) {
            const [binPath, ...args] = binPathAndArgs;
            return spawn(binPath, args, Object.assign({ cwd: projectDir }, opts));
        },
        nexus(args, opts = {}) {
            return spawn(PROJ_NEXUS_BIN_PATH, args, Object.assign({ cwd: projectDir }, opts));
        },
        npxNexus(options, args) {
            return spawn('npx', [`nexus@${options.nexusVersion}`, ...args], {
                cwd: projectDir,
                env: Object.assign(Object.assign({}, process.env), { LOG_LEVEL: 'trace' }),
            });
        },
        npxNexusCreatePlugin(options) {
            return spawn('npx', [`nexus@${options.nexusVersion}`, 'create', 'plugin'], {
                cwd: projectDir,
                env: Object.assign(Object.assign({}, process.env), { CREATE_PLUGIN_CHOICE_NAME: options.name, LOG_LEVEL: 'trace' }),
            });
        },
        npxNexusCreateApp(options) {
            var _a;
            return spawn('npx', [`nexus@${options.nexusVersion}`], {
                cwd: projectDir,
                env: Object.assign(Object.assign({}, process.env), { NEXUS_PLUGIN_PRISMA_VERSION: (_a = options.prismaPluginVersion) !== null && _a !== void 0 ? _a : 'latest', CREATE_APP_CHOICE_PACKAGE_MANAGER_TYPE: options.packageManagerType, CREATE_APP_CHOICE_DATABASE_TYPE: options.databaseType, LOG_LEVEL: 'trace' }),
            });
        },
        localNexus: config.localNexus
            ? (args) => {
                return spawn(NODE_PATH, [localNexusBinPath, ...args], {
                    cwd: projectDir,
                    env: Object.assign(Object.assign({}, process.env), { LOG_LEVEL: 'trace' }),
                });
            }
            : null,
        localNexusCreateApp: config.localNexus
            ? (options) => {
                var _a;
                return spawn(NODE_PATH, [localNexusBinPath], {
                    cwd: projectDir,
                    env: Object.assign(Object.assign({}, process.env), { NEXUS_PLUGIN_PRISMA_VERSION: (_a = options.prismaPluginVersion) !== null && _a !== void 0 ? _a : 'latest', CREATE_APP_CHOICE_PACKAGE_MANAGER_TYPE: options.packageManagerType, CREATE_APP_CHOICE_DATABASE_TYPE: options.databaseType, LOG_LEVEL: 'trace' }),
                });
            }
            : null,
        localNexusCreatePlugin: config.localNexus
            ? (options) => {
                return spawn(NODE_PATH, [localNexusBinPath, 'create', 'plugin'], {
                    cwd: projectDir,
                    env: Object.assign(Object.assign({}, process.env), { CREATE_PLUGIN_CHOICE_NAME: options.name, LOG_LEVEL: 'trace' }),
                });
            }
            : null,
    };
    if (config.localNexus) {
        process.env.CREATE_APP_CHOICE_NEXUS_VERSION = `file:${config.localNexus.path}`;
    }
    return contextAPI;
}
exports.createE2EContext = createE2EContext;
function spawn(command, args, opts) {
    const nodePty = requireNodePty();
    const subject = new rxjs_1.Subject();
    // On windows, node-pty needs an absolute path to the executable. `which` is used to find that path.
    const commandPath = which.sync(command);
    const ob = new rxjs_1.Observable((sub) => {
        var _a, _b;
        const proc = nodePty.spawn(commandPath, args, Object.assign({ cols: (_a = process.stdout.columns) !== null && _a !== void 0 ? _a : 80, rows: (_b = process.stdout.rows) !== null && _b !== void 0 ? _b : 80 }, opts));
        proc.on('data', (data) => {
            process.stdout.write(data);
            sub.next(strip_ansi_1.default(data));
        });
        proc.on('exit', (exitCode, signal) => {
            const result = {
                exitCode: exitCode,
                signal: signal,
            };
            if (exitCode !== 0) {
                const error = new Error(`command "${command} ${args.join(' ')}" exited ${exitCode}`);
                Object.assign(error, result);
                sub.error(error);
            }
            else {
                sub.complete();
            }
        });
        return function unsub() {
            proc.kill();
        };
    });
    const multicasted = ob.pipe(operators_1.multicast(subject));
    return multicasted;
}
exports.spawn = spawn;
function requireNodePty() {
    try {
        return require('node-pty');
    }
    catch (e) {
        nexus_logger_1.rootLogger.error('Could not require `node-pty`. Please install it as a dev dependency');
        throw e;
    }
}
//# sourceMappingURL=e2e-testing.js.map