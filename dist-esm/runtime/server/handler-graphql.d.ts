import { GraphQLError, GraphQLFormattedError, GraphQLSchema } from 'graphql';
import { GraphQLRequest, GraphQLResponse } from 'apollo-server-core/dist/requestPipeline';
import { ContextAdder } from '../schema';
import { NexusRequestHandler } from './server';
import { PlaygroundInput } from './settings';
declare type Settings = {
    introspection: boolean;
    playground: false | PlaygroundInput;
    path: string;
    errorFormatterFn(graphqlError: GraphQLError): GraphQLFormattedError;
};
declare type CreateHandler = (schema: GraphQLSchema, createContext: ContextAdder, settings: Settings) => NexusRequestHandler;
/**
 * Create a handler for graphql requests.
 */
export declare const createRequestHandlerGraphQL: CreateHandler;
export declare type ExecutionHandler = (graphqlRequest: GraphQLRequest) => Promise<GraphQLResponse>;
declare type CreateExecutionHandler = (schema: GraphQLSchema, createContext: ContextAdder, settings: Settings) => ExecutionHandler;
export declare const createExecutionHandler: CreateExecutionHandler;
export {};
//# sourceMappingURL=handler-graphql.d.ts.map