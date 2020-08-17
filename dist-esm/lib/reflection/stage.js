export const REFLECTION_ENV_VAR = 'NEXUS_REFLECTION';
/**
 * Set the NEXUS_REFLECTION environment variable
 */
export function getReflectionStageEnv(type) {
    return {
        [REFLECTION_ENV_VAR]: type,
    };
}
export function setReflectionStage(type) {
    process.env[REFLECTION_ENV_VAR] = type;
}
export function unsetReflectionStage() {
    // assigning `undefined` will result in envar becoming string 'undefined'
    delete process.env[REFLECTION_ENV_VAR];
}
/**
 * Check whether the app is executing in a particular reflection stage.
 */
export function isReflectionStage(type) {
    return process.env[REFLECTION_ENV_VAR] === type;
}
/**
 * Check whether the app is executing in any reflection stage.
 */
export function isReflection() {
    return process.env[REFLECTION_ENV_VAR] !== undefined;
}
//# sourceMappingURL=stage.js.map