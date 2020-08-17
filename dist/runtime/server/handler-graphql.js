"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createExecutionHandler = exports.createRequestHandlerGraphQL = void 0;
const apollo_server_1 = require("./apollo-server");
const logger_1 = require("./logger");
/**
 * Create a handler for graphql requests.
 */
exports.createRequestHandlerGraphQL = (schema, createContext, settings) => {
    const server = new apollo_server_1.ApolloServerless({
        schema,
        context: createContext,
        introspection: settings.introspection,
        formatError: settings.errorFormatterFn,
        logger: logger_1.log,
        playground: settings.playground,
    });
    return server.createHandler({ path: settings.path });
};
exports.createExecutionHandler = (schema, createContext, settings) => {
    const server = new apollo_server_1.ApolloServerless({
        schema,
        context: createContext,
        introspection: settings.introspection,
        formatError: settings.errorFormatterFn,
        logger: logger_1.log,
        playground: settings.playground,
    });
    return (graphqlRequest) => server.executeOperation(graphqlRequest);
};
//# sourceMappingURL=handler-graphql.js.map