/// <reference types="node" />
import { Express } from 'express';
import { GraphQLSchema } from 'graphql';
import * as HTTP from 'http';
import * as Plugin from '../../lib/plugin';
import { AppState } from '../app';
import { ContextAdder } from '../schema';
import { ApolloServerExpress } from './apollo-server';
import { ExecutionHandler } from './handler-graphql';
export declare type NexusRequestHandler = (req: HTTP.IncomingMessage, res: HTTP.ServerResponse) => void;
/**
 * Public interface of the server component
 */
export interface Server {
    /**
     * Escape hatches to various Nexus server internals.
     *
     * These things are available mostly as escape hatches, and maybe a few valid advanced use-cases. If you haven't already/are not sure, consider [opening an issue](https://nxs.li/issues/create/feature) for your use-case. Maybe Nexus can and should provide better first-class support for what you are trying to do!
     */
    raw: {
        /**
         * The underlying [Node HTTP Server](https://nodejs.org/api/http.html#http_class_http_server) instance.
         *
         * Access to this is made available mostly as an escape hatch, and maybe a few valid advanced use-cases. If you haven't already/are not sure, consider [opening an issue](https://nxs.li/issues/create/feature) for your use-case. Maybe Nexus can and should provide better first-class support for what you are trying to do!
         */
        http: HTTP.Server;
    };
    express: Express;
    handlers: {
        graphql: NexusRequestHandler;
        execute: ExecutionHandler;
    };
}
interface State {
    running: boolean;
    httpServer: HTTP.Server;
    createContext: null | (() => ContextAdder);
    apolloServer: null | ApolloServerExpress;
}
export declare const defaultState: {
    running: boolean;
    httpServer: HTTP.Server;
    createContext: null;
    apolloServer: null;
};
export declare function create(appState: AppState): {
    private: {
        settings: {
            change: (newSettings: import("./settings").SettingsInput) => void;
            reset: () => void;
            data: Readonly<import("./settings").SettingsData>;
        };
        state: State;
        reset(): void;
        assemble(loadedRuntimePlugins: Plugin.RuntimeContributions[], schema: GraphQLSchema): {
            createContext: ContextAdder;
        };
        start(): Promise<void>;
        stop(): Promise<void>;
    };
    public: Server;
};
export {};
//# sourceMappingURL=server.d.ts.map