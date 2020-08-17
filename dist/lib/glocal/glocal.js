"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setup = void 0;
const tslib_1 = require("tslib");
const common_tags_1 = require("common-tags");
const Path = tslib_1.__importStar(require("path"));
const nexus_logger_1 = require("../nexus-logger");
const detect_exec_layout_1 = require("./detect-exec-layout");
const utils_1 = require("./utils");
const log = nexus_logger_1.rootLogger.child('glocal');
/**
 * Handle relationship between global and local versions of a cli.
 *
 * If the local project does not have the tool on disk then fatal message will
 * be logged and process exited.
 */
function setup({ run, toolName, depName, filename }) {
    // use envar to boost perf, skip costly detection work
    if (!process.env.GLOBAL_LOCAL_HANDOFF) {
        log.trace('execLayout start');
        const execLayout = detect_exec_layout_1.detectExecLayout({ depName, scriptPath: filename });
        log.trace('execLayout done', { execLayout });
        if (execLayout.toolProject && !execLayout.runningLocalTool) {
            if (execLayout.toolCurrentlyPresentInNodeModules) {
                if (process.env.GLOBAL_LOCAL_HANDOFF) {
                    log.warn('warning: multiple handoffs detected, this should not happen.');
                }
                process.env.GLOBAL_LOCAL_HANDOFF = 'true';
                utils_1.globalToLocalModule({
                    localPackageDir: Path.join(execLayout.project.nodeModulesDir, depName),
                    globalPackageFilename: filename,
                });
                return; // we're done, all up to local now
            }
            else {
                log.fatal(glocalMissingLocalToolOnDiskMessage({ toolName, execLayout }));
                process.exit(1);
            }
        }
    }
    run();
}
exports.setup = setup;
/**
 * Message to show users when handoffs fails because local cli wasn't on disk.
 */
function glocalMissingLocalToolOnDiskMessage({ execLayout, toolName, }) {
    //todo detect package manager
    // const packageManager = await createPackageManager(undefined, { projectRoot })
    //todo instead of "try your command again" write out what that command actually was
    return common_tags_1.stripIndent `
    The global ${toolName} CLI you invoked could not hand off to your project-local one because it wasn't on disk.
    
    This can happen for example after you have cloned a fresh copy of your project from a remote repository.

    Please install your dependencies and try your command again.

    Location of the ${toolName} CLI you invoked: ${execLayout.process.toolPath}
    Location of your project-local ${toolName} CLI: ${execLayout.project.toolPath}
  `;
}
//# sourceMappingURL=glocal.js.map