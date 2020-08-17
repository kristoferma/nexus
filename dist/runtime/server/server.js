"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.create = exports.defaultState = void 0;
const tslib_1 = require("tslib");
const express_1 = tslib_1.__importDefault(require("express"));
const HTTP = tslib_1.__importStar(require("http"));
const utils_1 = require("../../lib/utils");
const DevMode = tslib_1.__importStar(require("../dev-mode"));
const utils_2 = require("../utils");
const apollo_server_1 = require("./apollo-server");
const error_formatter_1 = require("./error-formatter");
const handler_graphql_1 = require("./handler-graphql");
const logger_1 = require("./logger");
const settings_1 = require("./settings");
const resolverLogger = logger_1.log.child('graphql');
exports.defaultState = {
    running: false,
    httpServer: HTTP.createServer(),
    createContext: null,
    apolloServer: null,
};
function create(appState) {
    const settings = settings_1.createServerSettingsManager();
    const express = express_1.default();
    const state = Object.assign({}, exports.defaultState);
    const api = {
        raw: {
            http: state.httpServer,
        },
        express,
        handlers: {
            get graphql() {
                var _a;
                return ((_a = utils_2.assembledGuard(appState, 'app.server.handlers.graphql', () => {
                    if (settings.data.cors.enabled) {
                        logger_1.log.warn('CORS does not work for serverless handlers. Settings will be ignored.');
                    }
                    return handler_graphql_1.createRequestHandlerGraphQL(appState.assembled.schema, appState.assembled.createContext, {
                        path: settings.data.path,
                        introspection: settings.data.graphql.introspection,
                        playground: settings.data.playground.enabled ? settings.data.playground : false,
                        errorFormatterFn: error_formatter_1.errorFormatter,
                    });
                })) !== null && _a !== void 0 ? _a : utils_1.noop);
            },
            get execute() {
                return handler_graphql_1.createExecutionHandler(appState.assembled.schema, appState.assembled.createContext, {
                    path: settings.data.path,
                    introspection: settings.data.graphql.introspection,
                    playground: settings.data.playground.enabled ? settings.data.playground : false,
                    errorFormatterFn: error_formatter_1.errorFormatter,
                });
            },
        },
    };
    const internalServer = {
        private: {
            settings,
            state,
            reset() {
                internalServer.private.state = Object.assign({}, exports.defaultState);
            },
            assemble(loadedRuntimePlugins, schema) {
                state.httpServer.on('request', express);
                const createContext = createContextCreator(appState.components.schema.contextContributors, loadedRuntimePlugins);
                state.apolloServer = new apollo_server_1.ApolloServerExpress({
                    schema,
                    context: createContext,
                    introspection: settings.data.graphql.introspection,
                    formatError: error_formatter_1.errorFormatter,
                    logger: resolverLogger,
                    playground: settings.data.playground.enabled
                        ? {
                            endpoint: settings.data.path,
                            settings: settings.data.playground.settings,
                        }
                        : false,
                });
                state.apolloServer.applyMiddleware({
                    app: express,
                    path: settings.data.path,
                    cors: settings.data.cors,
                });
                return { createContext };
            },
            async start() {
                await utils_1.httpListen(state.httpServer, { port: settings.data.port, host: settings.data.host });
                state.running = true;
                // About !
                // 1. We do not support listening on unix domain sockets so string
                //    value will never be present here.
                // 2. We are working within the listen callback so address will not be null
                const address = state.httpServer.address();
                settings.data.startMessage({
                    port: address.port,
                    host: address.address,
                    ip: address.address,
                    path: settings.data.path,
                });
                DevMode.sendServerReadySignalToDevModeMaster();
            },
            async stop() {
                var _a;
                if (!state.running) {
                    logger_1.log.warn('You called `server.stop` but the server was not running.');
                    return Promise.resolve();
                }
                await utils_1.httpClose(state.httpServer);
                await ((_a = state.apolloServer) === null || _a === void 0 ? void 0 : _a.stop());
                state.running = false;
            },
        },
        public: api,
    };
    return internalServer;
}
exports.create = create;
/**
 * Log http errors during development.
 */
const wrapHandlerWithErrorHandling = (handler) => {
    return async (req, res) => {
        await handler(req, res);
        if (res.statusCode !== 200 && res.error) {
            const error = res.error;
            const graphqlErrors = error.graphqlErrors;
            if (graphqlErrors.length > 0) {
                graphqlErrors.forEach(error_formatter_1.errorFormatter);
            }
            else {
                logger_1.log.error(error.message, {
                    error,
                });
            }
        }
    };
};
/**
 * Combine all the context contributions defined in the app and in plugins.
 */
function createContextCreator(contextContributors, plugins) {
    const createContext = async (params) => {
        let context = {};
        // Integrate context from plugins
        for (const plugin of plugins) {
            if (!plugin.context)
                continue;
            const contextContribution = await plugin.context.create(params.req);
            Object.assign(context, contextContribution);
        }
        // Integrate context from app context api
        // TODO good runtime feedback to user if something goes wrong
        for (const contextContributor of contextContributors) {
            const contextContribution = await contextContributor(params);
            Object.assign(context, contextContribution);
        }
        Object.assign(context, { log: logger_1.log.child('request') });
        return context;
    };
    return createContext;
}
//# sourceMappingURL=server.js.map