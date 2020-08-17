import { defaults, isUndefined } from 'lodash';
import * as Process from '../../lib/process';
import * as Utils from '../../lib/utils';
import { log as serverLogger } from './logger';
const log = serverLogger.child('settings');
export const defaultPlaygroundPath = '/graphql';
export const defaultPlaygroundSettings = () => ({
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
export const defaultGraphqlSettings = () => ({
    introspection: process.env.NODE_ENV === 'production' ? false : true,
});
/**
 * The default server options. These are merged with whatever you provide. Your
 * settings take precedence over these.
 */
export const defaultSettings = () => {
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
            serverLogger.info('listening', {
                url: `http://${Utils.prettifyHost(host)}:${port}${path}`,
            });
        },
        playground: defaultPlaygroundSettings(),
        path: '/graphql',
        cors: { enabled: false },
        graphql: defaultGraphqlSettings(),
    };
};
export function processPlaygroundInput(current, input) {
    if (typeof input === 'boolean') {
        return {
            enabled: input,
            settings: defaultPlaygroundSettings().settings,
        };
    }
    return defaults({}, input, current);
}
export function processGraphqlInput(current, input) {
    return defaults(input, current);
}
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
export function processCorsInput(current, input) {
    if (typeof input === 'boolean') {
        return { enabled: input };
    }
    return defaults({}, input, current);
}
/**
 * Mutate the settings data
 */
export function changeSettings(current, input) {
    if (!isUndefined(input.playground)) {
        current.playground = processPlaygroundInput(current.playground, input.playground);
    }
    if (!isUndefined(input.graphql)) {
        current.graphql = processGraphqlInput(current.graphql, input.graphql);
    }
    if (!isUndefined(input.path)) {
        current.path = validateGraphQLPath(input.path);
    }
    if (!isUndefined(input.port)) {
        current.port = input.port;
    }
    if (!isUndefined(input.startMessage)) {
        current.startMessage = input.startMessage;
    }
    if (!isUndefined(input.cors)) {
        current.cors = processCorsInput(current.cors, input.cors);
    }
}
/**
 * Create a settings manager
 */
export function createServerSettingsManager() {
    const data = defaultSettings();
    function change(newSettings) {
        changeSettings(data, newSettings);
    }
    function reset() {
        for (const k of Object.keys(data)) {
            delete data[k];
        }
        Object.assign(data, defaultSettings());
    }
    return {
        change,
        reset,
        data,
    };
}
//# sourceMappingURL=settings.js.map