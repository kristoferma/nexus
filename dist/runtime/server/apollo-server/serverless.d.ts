/// <reference types="node" />
import { ApolloServerBase, GraphQLOptions } from 'apollo-server-core';
import { IncomingMessage, ServerResponse } from 'http';
import { NexusRequestHandler } from '../server';
import { ApolloConfig } from './types';
export interface ServerRegistration {
    path?: string;
    disableHealthCheck?: boolean;
    onHealthCheck?: (req: IncomingMessage) => Promise<any>;
}
export declare class ApolloServerless extends ApolloServerBase {
    constructor(config: ApolloConfig);
    createGraphQLServerOptions(req: IncomingMessage, res: ServerResponse): Promise<GraphQLOptions>;
    createHandler({ path, disableHealthCheck, onHealthCheck }?: ServerRegistration): (req: IncomingMessage, res: ServerResponse) => Promise<void>;
    protected supportsUploads(): boolean;
    protected supportsSubscriptions(): boolean;
    private isHealthCheckRequest;
    private isPlaygroundRequest;
    private handleHealthCheck;
    private handleGraphqlRequestsWithPlayground;
    private handleGraphqlRequestsWithServer;
    private handleFileUploads;
}
export interface NexusGraphQLOptionsFunction {
    (req: IncomingMessage, res: ServerResponse): GraphQLOptions | Promise<GraphQLOptions>;
}
export declare function graphqlHandler(options: NexusGraphQLOptionsFunction): NexusRequestHandler;
//# sourceMappingURL=serverless.d.ts.map