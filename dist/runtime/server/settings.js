"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createServerSettingsManager = exports.changeSettings = exports.processCorsInput = exports.processGraphqlInput = exports.processPlaygroundInput = exports.defaultSettings = exports.defaultGraphqlSettings = exports.defaultPlaygroundSettings = exports.defaultPlaygroundPath = void 0;
const tslib_1 = require("tslib");
const lodash_1 = require("lodash");
const Process = tslib_1.__importStar(require("../../lib/process"));
const Utils = tslib_1.__importStar(require("../../lib/utils"));
const logger_1 = require("./logger");
const log = logger_1.log.child('settings');
exports.defaultPlaygroundPath = '/graphql';
exports.defaultPlaygroundSettings = () => ({
    enabled: process.env.NODE_ENV === 'production' ? false : true,
    settings: {
        'general.betaUpdates': false,
        'editor.theme': 'dark',
        'editor.cursorShape': 'line',
        'editor.reuseHeaders': true,
        'tracing.hideTracingResponse': true,
        'queryPlan.hideQueryPlanResponse': true,
        'editor.fontSize': 14,
        'editor.fontFamily': `'Source Code Pro', 'Consolas', 'Inconsolata', 'Droid Sans Mono', 'Monaco', monospace`,
        'request.credentials': 'omit',
    },
});
exports.defaultGraphqlSettings = () => ({
    introspection: process.env.NODE_ENV === 'production' ? false : true,
});
/**
 * The default server options. These are merged with whatever you provide. Your
 * settings take precedence over these.
 */
exports.defaultSettings = () => {
    var _a, _b;
    return {
        host: (_b = (_a = process.env.NEXUS_HOST) !== null && _a !== void 0 ? _a : process.env.HOST) !== null && _b !== void 0 ? _b : undefined,
        port: typeof process.env.NEXUS_PORT === 'string'
            ? parseInt(process.env.NEXUS_PORT, 10)
            : typeof process.env.PORT === 'string'
                ? // e.g. Heroku convention https://stackoverflow.com/questions/28706180/setting-the-port-for-node-js-server-on-heroku
                    parseInt(process.env.PORT, 10)
                : process.env.NODE_ENV === 'production'
                    ? 80
                    : 4000,
        startMessage: ({ port, host, path }) => {
            logger_1.log.info('listening', {
                url: `http://${Utils.prettifyHost(host)}:${port}${path}`,
            });
        },
        playground: exports.defaultPlaygroundSettings(),
        path: '/graphql',
        cors: { enabled: false },
        graphql: exports.defaultGraphqlSettings(),
    };
};
function processPlaygroundInput(current, input) {
    if (typeof input === 'boolean') {
        return {
            enabled: input,
            settings: exports.defaultPlaygroundSettings().settings,
        };
    }
    return lodash_1.defaults({}, input, current);
}
exports.processPlaygroundInput = processPlaygroundInput;
function processGraphqlInput(current, input) {
    return lodash_1.defaults(input, current);
}
exports.processGraphqlInput = processGraphqlInput;
function validateGraphQLPath(path) {
    let outputPath = path;
    if (path.length === 0) {
        Process.fatal('Custom GraphQL `path` cannot be empty and must start with a /');
    }
    if (path.startsWith('/') === false) {
        log.warn('Custom GraphQL `path` must start with a "/". Please add it.');
        outputPath = '/' + outputPath;
    }
    return outputPath;
}
function processCorsInput(current, input) {
    if (typeof input === 'boolean') {
        return { enabled: input };
    }
    return lodash_1.defaults({}, input, current);
}
exports.processCorsInput = processCorsInput;
/**
 * Mutate the settings data
 */
function changeSettings(current, input) {
    if (!lodash_1.isUndefined(input.playground)) {
        current.playground = processPlaygroundInput(current.playground, input.playground);
    }
    if (!lodash_1.isUndefined(input.graphql)) {
        current.graphql = processGraphqlInput(current.graphql, input.graphql);
    }
    if (!lodash_1.isUndefined(input.path)) {
        current.path = validateGraphQLPath(input.path);
    }
    if (!lodash_1.isUndefined(input.port)) {
        current.port = input.port;
    }
    if (!lodash_1.isUndefined(input.startMessage)) {
        current.startMessage = input.startMessage;
    }
    if (!lodash_1.isUndefined(input.cors)) {
        current.cors = processCorsInput(current.cors, input.cors);
    }
}
exports.changeSettings = changeSettings;
/**
 * Create a settings manager
 */
function createServerSettingsManager() {
    const data = exports.defaultSettings();
    function change(newSettings) {
        changeSettings(data, newSettings);
    }
    function reset() {
        for (const k of Object.keys(data)) {
            delete data[k];
        }
        Object.assign(data, exports.defaultSettings());
    }
    return {
        change,
        reset,
        data,
    };
}
exports.createServerSettingsManager = createServerSettingsManager;
//# sourceMappingURL=settings.js.map