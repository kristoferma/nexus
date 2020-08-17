export declare const REFLECTION_ENV_VAR = "NEXUS_REFLECTION";
export declare type ReflectionType = 'plugin' | 'typegen';
/**
 * Set the NEXUS_REFLECTION environment variable
 */
export declare function getReflectionStageEnv(type: ReflectionType): {
    NEXUS_REFLECTION: ReflectionType;
};
export declare function setReflectionStage(type: ReflectionType): void;
export declare function unsetReflectionStage(): void;
/**
 * Check whether the app is executing in a particular reflection stage.
 */
export declare function isReflectionStage(type: ReflectionType): boolean;
/**
 * Check whether the app is executing in any reflection stage.
 */
export declare function isReflection(): boolean;
//# sourceMappingURL=stage.d.ts.map