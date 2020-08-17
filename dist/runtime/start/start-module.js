"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.printStaticImports = exports.prepareStartModule = exports.createStartModuleContent = exports.START_MODULE_HEADER = exports.START_MODULE_NAME = void 0;
const tslib_1 = require("tslib");
const common_tags_1 = require("common-tags");
const os_1 = require("os");
const Path = tslib_1.__importStar(require("path"));
const slash_1 = tslib_1.__importDefault(require("slash"));
const fs_1 = require("../../lib/fs");
const nexus_logger_1 = require("../../lib/nexus-logger");
const tsc_1 = require("../../lib/tsc");
const utils_1 = require("../../lib/utils");
const log = nexus_logger_1.rootLogger.child('startModule');
exports.START_MODULE_NAME = 'index';
exports.START_MODULE_HEADER = 'GENERATED NEXUS START MODULE';
function createStartModuleContent(config) {
    let content = `// ${exports.START_MODULE_HEADER}`;
    if (config.registerTypeScript) {
        content += os_1.EOL + os_1.EOL + os_1.EOL;
        content += common_tags_1.stripIndent `
      import { registerTypeScriptTranspile } from '${config.absoluteModuleImports
            ? Path.dirname(utils_1.requireResolveFrom('nexus', config.layout.projectRoot))
            : 'nexus/dist'}/lib/tsc'
      registerTypeScriptTranspile(${typeof config.registerTypeScript === 'object' ? JSON.stringify(config.registerTypeScript) : '{}'})
    `;
    }
    if (config.internalStage === 'dev') {
        content += os_1.EOL + os_1.EOL + os_1.EOL;
        content += common_tags_1.stripIndent `
      process.env.NEXUS_STAGE = 'dev'
    `;
    }
    content += os_1.EOL + os_1.EOL + os_1.EOL;
    content += common_tags_1.stripIndent `
    // Run framework initialization side-effects
    // Also, import the app for later use
    import app from "${config.absoluteModuleImports ? utils_1.requireResolveFrom('nexus', config.layout.projectRoot) : 'nexus'}")
  `;
    if (config.catchUnhandledErrors !== false) {
        // todo test coverage for this feature
        content += os_1.EOL + os_1.EOL + os_1.EOL;
        content += common_tags_1.stripIndent `
    // Last resort error handling
    process.once('uncaughtException', error => {
      app.log.fatal('uncaughtException', { error: error })
      process.exit(1)
    })

    process.once('unhandledRejection', error => {
      app.log.fatal('unhandledRejection', { error: error })
      process.exit(1)
    })
  `;
    }
    // This MUST come after nexus package has been imported for its side-effects
    const staticImports = printStaticImports(config.layout, {
        absolutePaths: config.absoluteModuleImports,
    });
    if (staticImports !== '') {
        content += os_1.EOL + os_1.EOL + os_1.EOL;
        content += common_tags_1.stripIndent `
        // Import the user's Nexus modules
        ${staticImports}
      `;
    }
    if (config.layout.app.exists) {
        content += os_1.EOL + os_1.EOL + os_1.EOL;
        content += common_tags_1.stripIndent `
      // Import the user's app module
      require("${config.absoluteModuleImports
            ? importId(config.layout.app.path)
            : relativeImportId(config.layout.sourceRelative(config.layout.app.path))}")
    `;
    }
    if (config.runtimePluginManifests.length) {
        content += os_1.EOL + os_1.EOL + os_1.EOL;
        content += common_tags_1.stripIndent `
      ${config.runtimePluginManifests
            .map((plugin, i) => {
            return `import { ${plugin.runtime.export} as plugin_${i} } from '${config.absoluteModuleImports
                ? importId(plugin.runtime.module)
                : absolutePathToPackageImportId(plugin.name, plugin.runtime.module)}'`;
        })
            .join(os_1.EOL)}
    `;
    }
    content += os_1.EOL + os_1.EOL + os_1.EOL;
    content += common_tags_1.stripIndent `
    app.assemble()
    app.start()
  `;
    log.trace('created start module', { content });
    return content;
}
exports.createStartModuleContent = createStartModuleContent;
function prepareStartModule(tsProject, startModule) {
    log.trace('Transpiling start module');
    return tsc_1.transpileModule(startModule, tsProject.getCompilerOptions());
}
exports.prepareStartModule = prepareStartModule;
/**
 * Build up static import code for all schema modules in the project. The static
 * imports are relative so that they can be calculated based on source layout
 * but used in build layout.
 *
 * Note that it is assumed the module these imports will run in will be located
 * in the source/build root.
 */
function printStaticImports(layout, opts) {
    return layout.nexusModules.reduce((script, modulePath) => {
        const path = (opts === null || opts === void 0 ? void 0 : opts.absolutePaths) ? importId(modulePath)
            : relativeImportId(layout.sourceRelative(modulePath));
        return `${script}\n${printSideEffectsImport(path)}`;
    }, '');
}
exports.printStaticImports = printStaticImports;
/**
 * Format given path to be a valid module id. Extensions are stripped. Posix path separators used.
 */
function importId(filePath) {
    return slash_1.default(fs_1.stripExt(filePath));
}
/**
 * Format given path to be a valid relative module id. Extensions are stripped. Explicit "./" is added. posix path separators used.
 */
function relativeImportId(filePath) {
    return importId(filePath.startsWith('./') ? filePath : './' + filePath);
}
/**
 * Given an absolute path to a module within a package find the import id for it.
 *
 * The given package name is found within absolute path and considered the start of the import id.
 */
function absolutePathToPackageImportId(packageName, absoluteFilePath) {
    // todo throw error if packageName not found in absoluteFilePath
    const moduleNamePos = absoluteFilePath.lastIndexOf(packageName);
    const relativeModuleImport = absoluteFilePath.substring(moduleNamePos);
    return importId(relativeModuleImport);
}
/**
 * Print a package import statement but do not important any members from it.
 */
function printSideEffectsImport(modulePath) {
    return `import '${modulePath}'`;
}
//# sourceMappingURL=start-module.js.map