import createExpress from 'express';
import * as HTTP from 'http';
import { httpClose, httpListen, noop } from '../../lib/utils';
import * as DevMode from '../dev-mode';
import { assembledGuard } from '../utils';
import { ApolloServerExpress } from './apollo-server';
import { errorFormatter } from './error-formatter';
import { createRequestHandlerGraphQL, createExecutionHandler } from './handler-graphql';
import { log } from './logger';
import { createServerSettingsManager } from './settings';
const resolverLogger = log.child('graphql');
export const defaultState = {
    running: false,
    httpServer: HTTP.createServer(),
    createContext: null,
    apolloServer: null,
};
export function create(appState) {
    const settings = createServerSettingsManager();
    const express = createExpress();
    const state = Object.assign({}, defaultState);
    const api = {
        raw: {
            http: state.httpServer,
        },
        express,
        handlers: {
            get graphql() {
                var _a;
                return ((_a = assembledGuard(appState, 'app.server.handlers.graphql', () => {
                    if (settings.data.cors.enabled) {
                        log.warn('CORS does not work for serverless handlers. Settings will be ignored.');
                    }
                    return createRequestHandlerGraphQL(appState.assembled.schema, appState.assembled.createContext, {
                        path: settings.data.path,
                        introspection: settings.data.graphql.introspection,
                        playground: settings.data.playground.enabled ? settings.data.playground : false,
                        errorFormatterFn: errorFormatter,
                    });
                })) !== null && _a !== void 0 ? _a : noop);
            },
            get execute() {
                return createExecutionHandler(appState.assembled.schema, appState.assembled.createContext, {
                    path: settings.data.path,
                    introspection: settings.data.graphql.introspection,
                    playground: settings.data.playground.enabled ? settings.data.playground : false,
                    errorFormatterFn: errorFormatter,
                });
            },
        },
    };
    const internalServer = {
        private: {
            settings,
            state,
            reset() {
                internalServer.private.state = Object.assign({}, defaultState);
            },
            assemble(loadedRuntimePlugins, schema) {
                state.httpServer.on('request', express);
                const createContext = createContextCreator(appState.components.schema.contextContributors, loadedRuntimePlugins);
                state.apolloServer = new ApolloServerExpress({
                    schema,
                    context: createContext,
                    introspection: settings.data.graphql.introspection,
                    formatError: errorFormatter,
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
                await httpListen(state.httpServer, { port: settings.data.port, host: settings.data.host });
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
                    log.warn('You called `server.stop` but the server was not running.');
                    return Promise.resolve();
                }
                await httpClose(state.httpServer);
                await ((_a = state.apolloServer) === null || _a === void 0 ? void 0 : _a.stop());
                state.running = false;
            },
        },
        public: api,
    };
    return internalServer;
}
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
                graphqlErrors.forEach(errorFormatter);
            }
            else {
                log.error(error.message, {
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
        Object.assign(context, { log: log.child('request') });
        return context;
    };
    return createContext;
}
//# sourceMappingURL=server.js.map