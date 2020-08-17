import { GraphQLClient } from '../lib/graphql-client';
export interface TestContextAppCore {
    start(): Promise<void>;
    stop(): Promise<void>;
}
export interface TestContextCore {
    app: TestContextAppCore;
    client: GraphQLClient;
}
declare global {
    interface NexusTestContextApp extends TestContextAppCore {
    }
    interface NexusTestContextRoot {
        app: NexusTestContextApp;
        client: GraphQLClient;
    }
}
export declare type TestContext = NexusTestContextRoot;
export interface CreateTestContextOptions {
    /**
     * A path to the entrypoint of your app. Only necessary if the entrypoint falls outside of Nexus conventions.
     * You should typically use this if you're using `nexus dev --entrypoint` or `nexus build --entrypoint`.
     */
    entrypointPath?: string;
    /**
     * Nexus usually determines the project root by the first `package.json` found while traversing up the file system.
     * In some cases, e.g. usage in a monorepo, this might not always be correct.
     * For those cases, you can specify the `projectRoot` manually.
     *
     * Example: `await createTestContext({ projectRoot: path.join(__dirname, '../..') })`
     */
    projectRoot?: string;
}
/**
 * Setup a test context providing utilities to query against your GraphQL API
 *
 * @example
 *
 * With jest
 * ```ts
 * import { createTestContext, TestContext } from 'nexus/testing'
 *
 * let ctx: TestContext
 *
 * beforeAll(async () => {
 *   ctx = await createTestContext()
 *   await ctx.app.start()
 * })
 *
 * afterAll(async () => {
 *   await ctx.app.stop()
 * })
 * ```
 */
export declare function createTestContext(opts?: CreateTestContextOptions): Promise<TestContext>;
//# sourceMappingURL=testing.d.ts.map