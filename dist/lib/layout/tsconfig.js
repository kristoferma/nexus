"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tsconfigTemplate = exports.readOrScaffoldTsconfig = exports.NEXUS_TS_LSP_IMPORT_ID = void 0;
const tslib_1 = require("tslib");
const chalk_1 = tslib_1.__importDefault(require("chalk"));
const common_tags_1 = require("common-tags");
const Either_1 = require("fp-ts/lib/Either");
const fs = tslib_1.__importStar(require("fs-jetpack"));
const lodash_1 = require("lodash");
const os_1 = require("os");
const Path = tslib_1.__importStar(require("path"));
const ts = tslib_1.__importStar(require("typescript"));
const util_1 = require("util");
const nexus_logger_1 = require("../nexus-logger");
const utils_1 = require("../utils");
const build_1 = require("./build");
exports.NEXUS_TS_LSP_IMPORT_ID = 'nexus/typescript-language-service';
const log = nexus_logger_1.rootLogger.child('tsconfig');
const diagnosticHost = {
    getNewLine: () => ts.sys.newLine,
    getCurrentDirectory: () => process.cwd(),
    getCanonicalFileName: (path) => path,
};
/**
 * An error following the parsing of tsconfig. Kinds of errors include type validations like if include field is an array.
 */
const invalidTsConfig = utils_1.exceptionType('invalid_tsconfig', ({ diagnostics }) => 'Your tsconfig.json is invalid\n\n' + ts.formatDiagnosticsWithColorAndContext(diagnostics, diagnosticHost));
async function readOrScaffoldTsconfig(input) {
    var _a, _b;
    log.trace('start read');
    let tsconfigPath = ts.findConfigFile(input.projectRoot, ts.sys.fileExists, 'tsconfig.json');
    if (!tsconfigPath) {
        tsconfigPath = Path.join(input.projectRoot, 'tsconfig.json');
        const tsconfigContent = tsconfigTemplate({
            sourceRootRelative: '.',
            outRootRelative: build_1.DEFAULT_BUILD_DIR_PATH_RELATIVE_TO_PROJECT_ROOT,
        });
        log.warn('We could not find a "tsconfig.json" file');
        log.warn(`We scaffolded one for you at ${tsconfigPath}`);
        await fs.writeAsync(tsconfigPath, tsconfigContent);
    }
    const projectRoot = Path.dirname(tsconfigPath);
    const tscfgReadResult = ts.readConfigFile(tsconfigPath, ts.sys.readFile);
    if (tscfgReadResult.error) {
        return Either_1.left(utils_1.exception('Unable to read your tsconifg.json\n\n' +
            ts.formatDiagnosticsWithColorAndContext([tscfgReadResult.error], diagnosticHost), {
        // todo leads to circ ref error in json serialize
        // diagnostics: [tscfgReadResult.error],
        }));
    }
    const tsconfigSource = tscfgReadResult.config;
    // setup zero values
    if (!tsconfigSource.compilerOptions) {
        tsconfigSource.compilerOptions = {};
    }
    if (!tsconfigSource.compilerOptions.plugins) {
        tsconfigSource.compilerOptions.plugins = [];
    }
    if (!tsconfigSource.include) {
        tsconfigSource.include = [];
    }
    else if (!Array.isArray(tsconfigSource.include)) {
        // If the include is present but not array it must mean a mal-formed tsconfig.
        // Exit early, if we contintue we will have a runtime error when we try .push on a non-array.
        // todo testme once we're not relying on mock process exit
        const diagnostics = ts.parseJsonConfigFileContent(tsconfigSource, ts.sys, projectRoot, undefined, tsconfigPath).errors;
        if (diagnostics.length > 0) {
            return Either_1.left(invalidTsConfig({ diagnostics }));
        }
    }
    const tsconfigSourceOriginal = lodash_1.cloneDeep(tsconfigSource);
    let tsconfigParsed = ts.parseJsonConfigFileContent(tsconfigSourceOriginal, ts.sys, projectRoot, undefined, tsconfigPath);
    // Lint
    // plugins compiler option is not inheried by extends
    // thus we should not be working with parsed tsconfig here
    const plugins = tsconfigSource.compilerOptions.plugins;
    if (plugins.length) {
        if (!plugins.map((p) => p.name).includes('nexus/typescript-language-service')) {
            // work with the local tsconfig for fix
            const pluginsFixed = tsconfigSource.compilerOptions.plugins.concat([{ name: exports.NEXUS_TS_LSP_IMPORT_ID }]);
            log.warn(common_tags_1.stripIndent `
          You have not added the Nexus TypeScript Language Service Plugin to your configured TypeScript plugins. Add this to your compilerOptions:

              ${chalk_1.default.yellowBright(`"plugins": ${JSON.stringify(pluginsFixed)}`)}
        ` + os_1.EOL);
        }
    }
    else {
        log.warn(common_tags_1.stripIndent `
        You have not setup the Nexus TypeScript Language Service Plugin. Add this to your compiler options:

            "plugins": [{ "name": "${exports.NEXUS_TS_LSP_IMPORT_ID}" }]
      ` + os_1.EOL);
    }
    if (tsconfigParsed.options.tsBuildInfoFile) {
        delete tsconfigParsed.options.tsBuildInfoFile;
        const setting = renderSetting(`compilerOptions.tsBuildInfoFile`);
        log.warn(`You have set ${setting} but it will be ignored by Nexus. Nexus manages this value internally.`);
    }
    if (tsconfigParsed.options.incremental) {
        delete tsconfigParsed.options.incremental;
        const setting = renderSetting('compilerOptions.incremental');
        log.warn(`You have set ${setting} but it will be ignored by Nexus. Nexus manages this value internally.`);
    }
    const { types } = tsconfigParsed.options;
    if (types) {
        delete tsconfigParsed.options.typeRoots;
        delete tsconfigParsed.options.types;
        const setting = renderSetting('compilerOptions.types');
        log.error(`You have set ${setting} but Nexus does not support it. If you do not remove your customization you may/will (e.g. VSCode) see inconsistent results between your IDE and what Nexus tells you at build time. If you would like to see Nexus support this setting please chime in at https://github.com/graphql-nexus/nexus/issues/1036.`);
    }
    /**
     * Setup typeRoots
     */
    const { typeRoots } = tsconfigSourceOriginal.compilerOptions;
    const nameAtTypes = 'node_modules/@types';
    const nameTypes = 'types';
    const explainAtTypes = `"${nameAtTypes}" is the TypeScript default for types packages and where Nexus outputs typegen to.`;
    const explainTypes = `"${nameTypes}" is the Nexus convention for _local_ types packages.`;
    if (!typeRoots) {
        const setting = renderSetting('compilerOptions.typeRoots');
        const val = renderVal([nameAtTypes, nameTypes]);
        const explainsRendered = [explainAtTypes, explainTypes].join(' ');
        tsconfigSource.compilerOptions.typeRoots = [nameAtTypes, nameTypes];
        log.warn(`Please set ${setting} to ${val}. ${explainsRendered}`);
    }
    else {
        const vals = [];
        let missingAtTypes = false;
        let explainAtTypes = '';
        let explainTypes = '';
        let explains = [];
        if (!typeRoots.includes(nameAtTypes)) {
            missingAtTypes = true;
            explains.push(explainAtTypes);
            tsconfigSource.compilerOptions.typeRoots.push(nameAtTypes);
            vals.push(nameAtTypes);
        }
        if (!typeRoots.includes(nameTypes)) {
            explains.push(explainTypes);
            tsconfigSource.compilerOptions.typeRoots.push(nameTypes);
            vals.push(nameTypes);
        }
        if (vals.length) {
            const setting = renderSetting('compilerOptions.typeRoots');
            const valsRendered = vals.map(renderVal).join(', ');
            const explainsRendered = explains.join(' ');
            // If typeRoots are specified but node_modules/@types is not in them
            // that's really bad! So elevate log to error level.
            if (missingAtTypes) {
                log.error(`Please add ${valsRendered} to your ${setting} array. ${explainsRendered}`);
            }
            else {
                log.warn(`Please add ${valsRendered} to your ${setting} array. ${explainsRendered}`);
            }
        }
    }
    /**
     * Setup types declaration file support.
     * Work with local tsconfig source contents as the Nexus convention is
     * supporting a types.d.ts file at project root and "include" is relative to
     * the tsconfig it shows up in. Thus We want to lint for local config
     * presence, not inherited.
     */
    if (!((_a = tsconfigSourceOriginal.include) === null || _a === void 0 ? void 0 : _a.includes('types.d.ts'))) {
        tsconfigSource.include.push('types.d.ts');
        const val = renderVal('types.d.ts');
        const setting = renderVal('include');
        log.warn(`Please add ${val} to your ${setting} array. If you do not then results from Nexus and your IDE will not agree if the declaration file is used in your project.`);
    }
    /**
     * Setup source root (aka. rootDir)
     */
    // Do not edit paths of tsconfig parsed
    // Doing so is dangerous because the input in tsconfig source is processed by parsing
    // To edit tsconfig parsed directly would be to know/redo that parsing, which we don't
    if (!tsconfigSource.compilerOptions.rootDir) {
        tsconfigSource.compilerOptions.rootDir = '.';
        const setting = renderSetting('compilerOptions.rootDir');
        const val = renderVal(tsconfigSource.compilerOptions.rootDir);
        log.warn(`Please set ${setting} to ${val}`);
    }
    if (!tsconfigSource.include.includes(tsconfigSource.compilerOptions.rootDir)) {
        tsconfigSource.include.push(tsconfigSource.compilerOptions.rootDir);
        const setting = renderSetting('include');
        log.warn(`Please set ${setting} to have "${tsconfigSource.compilerOptions.rootDir}"`);
    }
    /**
     * Handle noEmit
     * Users should also set to true
     * But inernally we enable
     */
    if (tsconfigParsed.options.noEmit !== true) {
        const setting = renderSetting('compilerOptions.noEmit');
        log.warn(`Please set ${setting} to true. This will ensure you do not accidentally emit using ${chalk_1.default.yellowBright(`\`$ tsc\``)}. Use ${chalk_1.default.yellowBright(`\`$ nexus build\``)} to build your app and emit JavaScript.`);
    }
    if (tsconfigParsed.options.esModuleInterop !== true) {
        tsconfigParsed.options.esModuleInterop = true;
        const setting = renderSetting('compilerOptions.esModuleInterop');
        log.warn(`Please set ${setting} to true. This will ensure that some libraries that Nexus uses will properly be transpiled to Javascript.`);
    }
    /**
     * Setup out root (aka. outDir)
     */
    // todo what's the point of letting users modify this?
    // Just that if they disable bundle they need an output path?
    if (((_b = input.overrides) === null || _b === void 0 ? void 0 : _b.outRoot) !== undefined) {
        tsconfigParsed.options.outDir = input.overrides.outRoot;
    }
    else if (!tsconfigParsed.options.outDir) {
        tsconfigParsed.options.outDir = build_1.DEFAULT_BUILD_DIR_PATH_RELATIVE_TO_PROJECT_ROOT;
    }
    /**
     * Rebuild the parsed tsconfig if it changed
     * For example if we adjusted include or rootDir we need those paths to be expanded.
     */
    if (!util_1.isDeepStrictEqual(tsconfigSource, tsconfigSourceOriginal)) {
        tsconfigParsed = ts.parseJsonConfigFileContent(tsconfigSource, ts.sys, projectRoot, undefined, tsconfigPath);
    }
    /**
     * Forced internal settings
     */
    tsconfigParsed.options.noEmit = false;
    /**
     * Validate the tsconfig
     */
    if (tsconfigParsed.errors.length > 0) {
        return Either_1.left(invalidTsConfig({ diagnostics: tsconfigParsed.errors }));
    }
    log.trace('finished read');
    return Either_1.right({ content: tsconfigParsed, path: tsconfigPath });
}
exports.readOrScaffoldTsconfig = readOrScaffoldTsconfig;
/**
 * Create tsconfig source contents, optimized for Nexus
 */
function tsconfigTemplate(input) {
    // Render empty source root as '.' which is what node path module relative func will do when same dir.
    const sourceRelative = input.sourceRootRelative || '.';
    const config = {
        compilerOptions: {
            target: 'es2016',
            module: 'commonjs',
            lib: ['esnext'],
            strict: true,
            rootDir: sourceRelative,
            noEmit: true,
            plugins: [{ name: 'nexus/typescript-language-service' }],
            typeRoots: ['node_modules/@types', 'types'],
            esModuleInterop: true
        },
        include: ['types.d.ts', sourceRelative],
    };
    return JSON.stringify(config, null, 2);
}
exports.tsconfigTemplate = tsconfigTemplate;
/**
 * Prettify a property path for terminal output.
 */
function renderSetting(setting) {
    return chalk_1.default.yellowBright(`\`${setting}\``);
}
/**
 * Prettify a JSON value for terminal output.
 */
function renderVal(val) {
    return chalk_1.default.yellowBright(JSON.stringify(val));
}
//# sourceMappingURL=tsconfig.js.map