/// <reference types="node" />
import * as NexusLogger from '@nexus/logger';
import * as NexusSchema from '@nexus/schema';
import * as GraphQL from 'graphql';
import * as HTTP from 'http';
import { NexusSchemaStatefulBuilders } from '../../lib/nexus-schema-stateful';
import { RuntimeContributions } from '../../lib/plugin';
import * as Scalars from '../../lib/scalars';
import { Index, MaybePromise } from '../../lib/utils';
import { AppState } from '../app';
import { SchemaSettingsManager } from './settings';
export declare type LazyState = {
    contextContributors: ContextAdder[];
    plugins: NexusSchema.core.NexusPlugin[];
    scalars: Scalars.Scalars;
};
export declare function createLazyState(): LazyState;
export interface Request extends HTTP.IncomingMessage {
    log: NexusLogger.Logger;
}
export interface Response extends HTTP.ServerResponse {
}
export declare type ContextAdderLens = {
    /**
     * Incoming HTTP request
     */
    req: Request;
    /**
     * Server response
     */
    res: Response;
};
export declare type ContextAdder = (params: ContextAdderLens) => MaybePromise<Record<string, unknown>>;
declare type MiddlewareFn = (source: any, args: any, context: NexusSchema.core.GetGen<'context'>, info: GraphQL.GraphQLResolveInfo, next: GraphQL.GraphQLFieldResolver<any, any>) => any;
/**
 * Schema component API
 */
export interface Schema extends NexusSchemaStatefulBuilders {
    /**
     * todo link to website docs
     */
    use(schemaPlugin: NexusSchema.core.NexusPlugin): void;
    /**
     * todo link to website docs
     */
    middleware(fn: (config: NexusSchema.core.CreateFieldResolverInfo) => MiddlewareFn | undefined): void;
    /**
     * todo link to website docs
     */
    addToContext(contextAdder: ContextAdder): void;
}
/**
 * Schema component internal API
 */
export interface SchemaInternal {
    private: {
        settings: SchemaSettingsManager;
        checks(): void;
        assemble(plugins: RuntimeContributions[]): {
            schema: NexusSchema.core.NexusGraphQLSchema;
            missingTypes: Index<NexusSchema.core.MissingType>;
        };
        beforeAssembly(): void;
        reset(): void;
    };
    public: Schema;
}
export declare function create(state: AppState): SchemaInternal;
export {};
//# sourceMappingURL=schema.d.ts.map