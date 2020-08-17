import { GraphQLError, Source, SourceLocation } from 'graphql';
export declare function errorFormatter(graphQLError: GraphQLError): GraphQLError;
/**
 * Render a helpful description of the location in the GraphQL Source document.
 * Modified version from graphql-js
 */
export declare function printSourceLocation(source: Source, sourceLocation: SourceLocation): string;
//# sourceMappingURL=error-formatter.d.ts.map