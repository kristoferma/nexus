declare type Context = Record<string, any>;
declare type ContribCreator<CIn extends Context = {}, COut extends Context = {}> = (ctx: CIn) => COut;
/**
 * Brand a function as a context contributor.
 */
export declare function createContributor<CIn extends Context = {}, COut extends Context = {}>(contribCreator: ContribCreator<CIn, COut>): ContribCreator<CIn, COut>;
/**
 * Create a test context. You can pass one or more so-called "context
 * contributors". You may also pass object literals with will get
 * shallowly-merged. Each one builds on top of the context from the previous
 * contributor.
 *
 * Context contributors run within the jest `beforeEach` hook. This means the
 * returned context must be treated specially:
 *
 * - Do not detach properties, always access dynamically off the contet object.
 * - Do not access context properties outside of a jest test closure.
 */
export declare function compose<A, R1 extends Context, R2 extends Context, R3 extends Context, R4 extends Context, R5 extends Context, R6 extends Context>(f: R1 | ((arg: A) => R1), g: R2 | ((arg: R1) => R2), h: R3 | ((arg: R1 & R2) => R3), i: R4 | ((arg: R1 & R2 & R3) => R4), j: R5 | ((arg: R1 & R2 & R3 & R4) => R5), k: R6 | ((arg: R1 & R2 & R3 & R4 & R5) => R6)): R1 & R2 & R3 & R4 & R5 & R6;
export declare function compose<A, R1 extends Context, R2 extends Context, R3 extends Context, R4 extends Context, R5 extends Context>(f: R1 | ((arg: A) => R1), g: R2 | ((arg: R1) => R2), h: R3 | ((arg: R1 & R2) => R3), i: R4 | ((arg: R1 & R2 & R3) => R4), j: R5 | ((arg: R1 & R2 & R3 & R4) => R5)): R1 & R2 & R3 & R4 & R5;
export declare function compose<A, R1 extends Context, R2 extends Context, R3 extends Context, R4 extends Context>(f: R1 | ((arg: A) => R1), g: R2 | ((arg: R1) => R2), h: R3 | ((arg: R1 & R2) => R3), i: R4 | ((arg: R1 & R2 & R3) => R4)): R1 & R2 & R3 & R4;
export declare function compose<A, R1 extends Context, R2 extends Context, R3 extends Context>(f: R1 | ((arg: A) => R1), g: R2 | ((arg: R1) => R2), h: R3 | ((arg: R1 & R2) => R3)): R1 & R2 & R3;
export declare function compose<A, R1 extends Context, R2 extends Context>(f: R1 | ((arg: A) => R1), g: R2 | ((arg: R1) => R2)): R1 & R2;
export { compose as create };
//# sourceMappingURL=compose-create.d.ts.map