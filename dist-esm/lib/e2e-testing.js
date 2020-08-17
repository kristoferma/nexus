/**
 * These testing utilities live here so that `nexus-plugin-prisma` can reuse them
 */
import * as Logger from '@nexus/logger';
import * as FS from 'fs-jetpack';
import * as os from 'os';
import * as Path from 'path';
import { Observable, Subject } from 'rxjs';
import { multicast } from 'rxjs/operators';
import stripAnsi from 'strip-ansi';
import * as which from 'which';
import { GraphQLClient } from '../lib/graphql-client';
import { getTmpDir } from './fs';
import { rootLogger } from './nexus-logger';
const log = rootLogger.child('e2eTesting');
/**
 * The path at which to spawn node processes
 */
const NODE_PATH = os.platform() === 'win32' ? 'node.exe' : 'node';
export function createE2EContext(config) {
    var _a, _b;
    Logger.log.settings({ filter: { level: 'trace' } });
    process.env.LOG_LEVEL = 'trace';
    if (config.serverPort) {
        process.env.PORT = String(config.serverPort);
    }
    const localNexusBinPath = config.localNexus
        ? Path.join(config.localNexus.path, 'dist', 'cli', 'main')
        : null;
    const projectDir = (_a = config === null || config === void 0 ? void 0 : config.dir) !== null && _a !== void 0 ? _a : getTmpDir('e2e-app');
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
        getTmpDir: getTmpDir,
        fs: FS.cwd(projectDir),
        client: new GraphQLClient(`http://localhost:${config.serverPort}/graphql`),
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
export function spawn(command, args, opts) {
    const nodePty = requireNodePty();
    const subject = new Subject();
    // On windows, node-pty needs an absolute path to the executable. `which` is used to find that path.
    const commandPath = which.sync(command);
    const ob = new Observable((sub) => {
        var _a, _b;
        const proc = nodePty.spawn(commandPath, args, Object.assign({ cols: (_a = process.stdout.columns) !== null && _a !== void 0 ? _a : 80, rows: (_b = process.stdout.rows) !== null && _b !== void 0 ? _b : 80 }, opts));
        proc.on('data', (data) => {
            process.stdout.write(data);
            sub.next(stripAnsi(data));
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
    const multicasted = ob.pipe(multicast(subject));
    return multicasted;
}
function requireNodePty() {
    try {
        return require('node-pty');
    }
    catch (e) {
        rootLogger.error('Could not require `node-pty`. Please install it as a dev dependency');
        throw e;
    }
}
//# sourceMappingURL=e2e-testing.js.map