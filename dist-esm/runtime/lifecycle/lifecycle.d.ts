import * as NexusSchema from '@nexus/schema';
import { AppState } from '../app';
/**
 * The data we pass to callbacks
 */
declare type Data = {
    schema: NexusSchema.core.NexusGraphQLSchema;
};
/**
 * The function users can register
 */
declare type Callback = (data: Data) => void;
export declare type LazyState = {
    callbacks: {
        start: Callback[];
    };
};
export declare function createLazyState(): LazyState;
/**
 * Public component interface
 */
export interface Lifecycle {
    /**
     * Register callback to be run when the application starts.
     *
     * @remarks
     *
     * Put initialization code here that you don't want run during [Nexus reflection](https://nxs.li/about/reflection).
     */
    start(callback: (data: Data) => void): void;
}
/**
 * Internal component controls
 */
export interface Private {
    reset(): void;
    trigger: {
        start(data: Data): void;
    };
}
/**
 * Control the Lifecycle component
 */
export interface Controller {
    public: Lifecycle;
    private: Private;
}
/**
 * Create an instance of Lifecycle
 */
export declare function create(state: AppState): Controller;
export {};
//# sourceMappingURL=lifecycle.d.ts.map