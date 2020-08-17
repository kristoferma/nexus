"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isReflection = exports.isReflectionStage = exports.unsetReflectionStage = exports.setReflectionStage = exports.getReflectionStageEnv = exports.REFLECTION_ENV_VAR = void 0;
exports.REFLECTION_ENV_VAR = 'NEXUS_REFLECTION';
/**
 * Set the NEXUS_REFLECTION environment variable
 */
function getReflectionStageEnv(type) {
    return {
        [exports.REFLECTION_ENV_VAR]: type,
    };
}
exports.getReflectionStageEnv = getReflectionStageEnv;
function setReflectionStage(type) {
    process.env[exports.REFLECTION_ENV_VAR] = type;
}
exports.setReflectionStage = setReflectionStage;
function unsetReflectionStage() {
    // assigning `undefined` will result in envar becoming string 'undefined'
    delete process.env[exports.REFLECTION_ENV_VAR];
}
exports.unsetReflectionStage = unsetReflectionStage;
/**
 * Check whether the app is executing in a particular reflection stage.
 */
function isReflectionStage(type) {
    return process.env[exports.REFLECTION_ENV_VAR] === type;
}
exports.isReflectionStage = isReflectionStage;
/**
 * Check whether the app is executing in any reflection stage.
 */
function isReflection() {
    return process.env[exports.REFLECTION_ENV_VAR] !== undefined;
}
exports.isReflection = isReflection;
//# sourceMappingURL=stage.js.map