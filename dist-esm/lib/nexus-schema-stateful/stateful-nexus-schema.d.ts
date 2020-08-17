import * as NexusSchema from '@nexus/schema';
import * as GraphQL from 'graphql';
import * as Scalars from '../scalars';
import * as CustomTypes from './custom-types';
export interface StatefulNexusSchema {
    state: {
        types: NexusSchemaTypeDef[];
        scalars: Scalars.Scalars;
    };
    builders: NexusSchemaStatefulBuilders;
}
export interface NexusSchemaStatefulBuilders {
    queryType: typeof NexusSchema.queryType;
    mutationType: typeof NexusSchema.mutationType;
    subscriptionType: typeof NexusSchema.subscriptionType;
    objectType: ReturnType<typeof createNexusSchemaStateful>['builders']['objectType'];
    enumType: ReturnType<typeof createNexusSchemaStateful>['builders']['enumType'];
    scalarType: ReturnType<typeof createNexusSchemaStateful>['builders']['scalarType'];
    unionType: ReturnType<typeof createNexusSchemaStateful>['builders']['unionType'];
    interfaceType: ReturnType<typeof createNexusSchemaStateful>['builders']['interfaceType'];
    inputObjectType: typeof NexusSchema.inputObjectType;
    arg: typeof NexusSchema.arg;
    intArg: typeof NexusSchema.intArg;
    stringArg: typeof NexusSchema.stringArg;
    booleanArg: typeof NexusSchema.booleanArg;
    floatArg: typeof NexusSchema.floatArg;
    idArg: typeof NexusSchema.idArg;
    extendType: typeof NexusSchema.extendType;
    extendInputType: typeof NexusSchema.extendInputType;
    /**
     * Add a GraphQL.js type in your Nexus schema
     */
    importType: {
        /**
         * Add a GraphQL.js scalar type and (optionally) expose it as a method in your definition builders.
         * Check the second overload if you're not adding a scalar type.
         *
         * @example
         *
         * ```ts
         * import { schema } from 'nexus'
         * import { GraphQLDate } from 'graphql-iso-date'
         *
         * schema.importType(GraphQLDate, 'date')
         *
         * schema.objectType({
         *  name: 'SomeObject',
         *  definition(t) {
         *    t.date('createdAt') // t.date() is now available (with types!) thanks to `importType`
         *  },
         * })
         * ```
         *
         */
        (scalarType: GraphQL.GraphQLScalarType, methodName?: string): GraphQL.GraphQLScalarType;
        /**
         * Add a GraphQL.js type in your Nexus schema.
         * Useful to incrementally adopt Nexus if you already have a GraphQL schema built with a different technology than Nexus.
         *
         * @example
         *
         * ```ts
         * import { schema } from 'nexus'
         * import { existingSchema } from './existing-schema'
         *
         * Object.values(
         *   existingSchema.getTypeMap()
         * ).forEach(schema.importType)
         * ```
         */
        (type: GraphQL.GraphQLNamedType): GraphQL.GraphQLNamedType;
    };
}
declare type NexusSchemaTypeDef = NexusSchema.core.AllTypeDefs | NexusSchema.core.NexusExtendInputTypeDef<any> | NexusSchema.core.NexusExtendTypeDef<any>;
/**
 * Create an instance of Stateful Nexus Schema
 */
export declare function createNexusSchemaStateful(): {
    state: {
        types: NexusSchemaTypeDef[];
        scalars: Record<string, GraphQL.GraphQLScalarType>;
    };
    builders: {
        queryType: typeof NexusSchema.queryType;
        mutationType: typeof NexusSchema.mutationType;
        subscriptionType: typeof NexusSchema.subscriptionType;
        objectType: <TypeName extends string>(config: CustomTypes.NexusObjectTypeConfig<TypeName>) => NexusSchema.core.NexusObjectTypeDef<TypeName>;
        inputObjectType: typeof NexusSchema.inputObjectType;
        unionType: <TypeName_1 extends string>(config: CustomTypes.NexusUnionTypeConfig<TypeName_1>) => NexusSchema.core.NexusUnionTypeDef<TypeName_1>;
        interfaceType: <TypeName_2 extends string>(config: CustomTypes.NexusInterfaceTypeConfig<TypeName_2>) => NexusSchema.core.NexusInterfaceTypeDef<TypeName_2>;
        enumType: <TypeName_3 extends string>(config: CustomTypes.NexusEnumTypeConfig<TypeName_3>) => NexusSchema.core.NexusEnumTypeDef<TypeName_3>;
        scalarType: <TypeName_4 extends string>(config: CustomTypes.NexusScalarTypeConfig<TypeName_4>) => NexusSchema.core.NexusScalarTypeDef<TypeName_4>;
        arg: typeof NexusSchema.arg;
        intArg: typeof NexusSchema.intArg;
        stringArg: typeof NexusSchema.stringArg;
        idArg: typeof NexusSchema.idArg;
        floatArg: typeof NexusSchema.floatArg;
        booleanArg: typeof NexusSchema.booleanArg;
        extendType: typeof NexusSchema.extendType;
        extendInputType: typeof NexusSchema.extendInputType;
        importType: {
            (type: GraphQL.GraphQLScalarType, methodName?: string | undefined): GraphQL.GraphQLScalarType;
            (type: GraphQL.GraphQLNamedType): GraphQL.GraphQLNamedType;
        };
    };
};
export {};
//# sourceMappingURL=stateful-nexus-schema.d.ts.map