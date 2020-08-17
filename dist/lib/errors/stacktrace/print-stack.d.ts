export interface ErrorArgs {
    /**
     * Stack of the error
     */
    callsite: string | undefined;
}
export interface PrintStackResult {
    /**
     * Portion of the file where the error happened
     */
    preview: string | null;
    /**
     * Name of the method that caused the error
     */
    methodName: string | null;
    /**
     * Information about the user file where the error happened
     */
    file: {
        /**
         * File path where the error happened
         */
        path: string | null;
        /**
         * File path where the error happened, including the location
         */
        pathLineNumber: string | null;
        /**
         * File path where the error happened, relative to the user home directory
         */
        pathRelToHomeDir: string | null;
    };
}
export declare const printStack: ({ callsite }: ErrorArgs) => PrintStackResult;
/**
 * Stack overflow reference: https://stackoverflow.com/a/43960876
 */
export declare function getProjectRoot(): string | null;
//# sourceMappingURL=print-stack.d.ts.map