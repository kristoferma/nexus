import { PlaygroundRenderPageOptions } from 'apollo-server-express';
import { CorsOptions as OriginalCorsOption } from 'cors';
import { LiteralUnion } from 'type-fest';
import * as Utils from '../../lib/utils';
export declare type PlaygroundInput = {
    /**
     * Should the [GraphQL Playground](https://github.com/prisma-labs/graphql-playground) be hosted by the server?
     *
     * @dynamicDefault
     *
     * - If not production then `true`
     * - Otherwise `false`
     *
     * @remarks
     *
     * GraphQL Playground is useful during development as a visual client to interact with your API. In
     * production, without some kind of security/access control, you will almost
     * certainly want it disabled.
     */
    enabled?: boolean;
    /**
     * Configure the settings of the GraphQL Playground app itself.
     */
    settings?: Omit<Partial<Exclude<PlaygroundRenderPageOptions['settings'], undefined>>, 'general.betaUpdates'>;
};
export declare type GraphqlInput = {
    introspection?: boolean;
};
export declare type HTTPMethods = LiteralUnion<'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD', string>;
export declare type CorsSettings = {
    /**
     * Enable or disable CORS.
     *
     * @default true
     */
    enabled?: boolean;
    /**
     * Configures the Access-Control-Allow-Origin CORS header. Possible values:
     *
     * Boolean - set origin to true to reflect the request origin, as defined by req.header('Origin'), or set it to false to disable CORS.
     *
     * String - set origin to a specific origin. For example if you set it to "http://example.com" only requests from "http://example.com" will be allowed.
     *
     * RegExp - set origin to a regular expression pattern which will be used to test the request origin. If it's a match, the request origin will be reflected. For example the pattern /example\.com$/ will reflect any request that is coming from an origin ending with "example.com".
     *
     * Array - set origin to an array of valid origins. Each origin can be a String or a RegExp. For example ["http://example1.com", /\.example2\.com$/] will accept any request from "http://example1.com" or from a subdomain of "example2.com".
     *
     * Function - set origin to a function implementing some custom logic. The function takes the request origin as the first parameter and a callback (called as callback(err, origin), where origin is a non-function value of the origin option) as the second.
     *
     */
    origin?: OriginalCorsOption['origin'];
    /**
     * Configures the Access-Control-Allow-Methods CORS header.
     *
     * @example ['GET', 'PUT', 'POST']
     */
    methods?: string | HTTPMethods[];
    /**
     * Configures the Access-Control-Allow-Headers CORS header.
     *
     * If not specified, defaults to reflecting the headers specified in the request's Access-Control-Request-Headers header.
     *
     * @example ['Content-Type', 'Authorization']
     */
    allowedHeaders?: string | string[];
    /**
     * Configures the Access-Control-Expose-Headers CORS header.
     *
     * If not specified, no custom headers are exposed.
     *
     * @example ['Content-Range', 'X-Content-Range']
     */
    exposedHeaders?: string | string[];
    /**
     * Configures the Access-Control-Allow-Credentials CORS header.
     *
     * Set to true to pass the header, otherwise it is omitted.
     */
    credentials?: boolean;
    /**
     * Configures the Access-Control-Max-Age CORS header.
     *
     * Set to an integer to pass the header, otherwise it is omitted.
     */
    maxAge?: number;
    /**
     * Pass the CORS preflight response to the next handler.
     */
    preflightContinue?: boolean;
    /**
     * Provides a status code to use for successful OPTIONS requests, since some legacy browsers (IE11, various SmartTVs) choke on 204.
     */
    optionsSuccessStatus?: number;
};
export declare type SettingsInput = {
    /**
     * todo
     */
    port?: number;
    /**
     * Host the server should be listening on.
     */
    host?: string | undefined;
    /**
     * Configure the [GraphQL Playground](https://github.com/prisma-labs/graphql-playground) hosted by the server.
     *
     * - Pass `true` as shorthand for  `{ enabled: true }`
     * - Pass `false` as shorthand for `{ enabled: false }`
     * - Pass an object to configure
     *
     * @dynamicDefault
     *
     * - If not production then `true`
     * - Otherwise `false`
     *
     * @remarks
     *
     * GraphQL Playground is useful during development as a visual client to interact with your API. In
     * production, without some kind of security/access control, you will almost
     * certainly want it disabled.
     */
    playground?: boolean | PlaygroundInput;
    /**
     * Enable CORS for your server
     *
     * When true is passed, the default config is the following:
     *
     * ```
     * {
     *   "origin": "*",
     *   "methods": "GET,HEAD,PUT,PATCH,POST,DELETE",
     *   "preflightContinue": false,
     *   "optionsSuccessStatus": 204
     * }
     * ```
     *
     * @default false
     */
    cors?: boolean | CorsSettings;
    /**
     * The path on which the GraphQL API should be served.
     *
     * @default /graphql
     */
    path?: string;
    /**
     * Create a message suitable for printing to the terminal about the server
     * having been booted.
     */
    startMessage?: (address: {
        port: number;
        host: string;
        ip: string;
        path: string;
    }) => void;
    /**
     * todo
     */
    graphql?: GraphqlInput;
};
export declare type SettingsData = Omit<Utils.DeepRequired<SettingsInput>, 'host' | 'playground' | 'graphql' | 'cors'> & {
    host: string | undefined;
    playground: Required<PlaygroundInput>;
    graphql: Required<GraphqlInput>;
    cors: CorsSettings;
};
export declare const defaultPlaygroundPath = "/graphql";
export declare const defaultPlaygroundSettings: () => Readonly<Required<PlaygroundInput>>;
export declare const defaultGraphqlSettings: () => Readonly<Required<GraphqlInput>>;
/**
 * The default server options. These are merged with whatever you provide. Your
 * settings take precedence over these.
 */
export declare const defaultSettings: () => Readonly<SettingsData>;
export declare function processPlaygroundInput(current: SettingsData['playground'], input: NonNullable<SettingsInput['playground']>): SettingsData['playground'];
export declare function processGraphqlInput(current: SettingsData['graphql'], input: NonNullable<SettingsInput['graphql']>): SettingsData['graphql'];
export declare function processCorsInput(current: SettingsData['cors'], input: NonNullable<SettingsInput['cors']>): SettingsData['cors'];
/**
 * Mutate the settings data
 */
export declare function changeSettings(current: SettingsData, input: SettingsInput): void;
/**
 * Create a settings manager
 */
export declare function createServerSettingsManager(): {
    change: (newSettings: SettingsInput) => void;
    reset: () => void;
    data: Readonly<SettingsData>;
};
export declare type ServerSettingsManager = ReturnType<typeof createServerSettingsManager>;
//# sourceMappingURL=settings.d.ts.map