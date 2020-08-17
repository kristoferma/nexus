import { ApolloServerless } from './apollo-server';
import { log } from './logger';
/**
 * Create a handler for graphql requests.
 */
export const createRequestHandlerGraphQL = (schema, createContext, settings) => {
    const server = new ApolloServerless({
        schema,
        context: createContext,
        introspection: settings.introspection,
        formatError: settings.errorFormatterFn,
        logger: log,
        playground: settings.playground,
    });
    return server.createHandler({ path: settings.path });
};
export const createExecutionHandler = (schema, createContext, settings) => {
    const server = new ApolloServerless({
        schema,
        context: createContext,
        introspection: settings.introspection,
        formatError: settings.errorFormatterFn,
        logger: log,
        playground: settings.playground,
    });
    return (graphqlRequest) => server.executeOperation(graphqlRequest);
};
//# sourceMappingURL=handler-graphql.js.map