"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNexusSchemaStateful = void 0;
const tslib_1 = require("tslib");
const NexusSchema = tslib_1.__importStar(require("@nexus/schema"));
const chalk_1 = tslib_1.__importDefault(require("chalk"));
const GraphQL = tslib_1.__importStar(require("graphql"));
const errors_1 = require("../errors");
const nexus_logger_1 = require("../nexus-logger");
const log = nexus_logger_1.rootLogger.child('schema');
const prettyFatal = (err) => errors_1.logPrettyError(log, err, 'fatal');
function validateInput(config, requiredProperties) {
    if (!config) {
        errors_1.logPrettyError(log, new Error('Missing config'), 'fatal');
    }
    for (const prop of requiredProperties) {
        if (config[prop] === undefined) {
            if (config.name) {
                prettyFatal(new Error(`Missing property \`${chalk_1.default.redBright(prop)}\` for GraphQL type "${chalk_1.default.greenBright(config.name)}"`));
            }
            else {
                prettyFatal(new Error(`Missing property \`${chalk_1.default.redBright(prop)}\``));
            }
        }
    }
    return true;
}
/**
 * Create an instance of Stateful Nexus Schema
 */
function createNexusSchemaStateful() {
    const state = {
        types: [],
        scalars: {},
    };
    function objectType(config) {
        validateInput(config, ['name', 'definition']);
        try {
            const typeDef = NexusSchema.objectType(config);
            state.types.push(typeDef);
            return typeDef;
        }
        catch (err) {
            return prettyFatal(err);
        }
    }
    function interfaceType(config) {
        validateInput(config, ['name', 'definition']);
        try {
            const typeDef = NexusSchema.interfaceType(config);
            state.types.push(typeDef);
            return typeDef;
        }
        catch (err) {
            return prettyFatal(err);
        }
    }
    function unionType(config) {
        validateInput(config, ['name', 'definition']);
        try {
            const typeDef = NexusSchema.unionType(config);
            state.types.push(typeDef);
            return typeDef;
        }
        catch (err) {
            return prettyFatal(err);
        }
    }
    function scalarType(config) {
        validateInput(config, ['name', 'serialize']);
        try {
            const typeDef = NexusSchema.scalarType(config);
            state.types.push(typeDef);
            state.scalars[typeDef.name] = new GraphQL.GraphQLScalarType(config);
            return typeDef;
        }
        catch (err) {
            return prettyFatal(err);
        }
    }
    function enumType(config) {
        validateInput(config, ['name', 'members']);
        try {
            const typeDef = NexusSchema.enumType(config);
            state.types.push(typeDef);
            return typeDef;
        }
        catch (err) {
            return prettyFatal(err);
        }
    }
    const inputObjectType = (config) => {
        validateInput(config, ['name', 'definition']);
        try {
            const typeDef = NexusSchema.inputObjectType(config);
            state.types.push(typeDef);
            return typeDef;
        }
        catch (err) {
            return prettyFatal(err);
        }
    };
    const queryType = (config) => {
        validateInput(config, ['definition']);
        try {
            const typeDef = NexusSchema.queryType(config);
            state.types.push(typeDef);
            return typeDef;
        }
        catch (err) {
            return prettyFatal(err);
        }
    };
    const mutationType = (config) => {
        validateInput(config, ['definition']);
        try {
            const typeDef = NexusSchema.mutationType(config);
            state.types.push(typeDef);
            return typeDef;
        }
        catch (err) {
            return prettyFatal(err);
        }
    };
    const subscriptionType = (config) => {
        validateInput(config, ['definition']);
        try {
            const typeDef = NexusSchema.subscriptionType(config);
            state.types.push(typeDef);
            return typeDef;
        }
        catch (err) {
            return prettyFatal(err);
        }
    };
    const extendType = (config) => {
        validateInput(config, ['definition']);
        try {
            const typeDef = NexusSchema.extendType(config);
            state.types.push(typeDef);
            return typeDef;
        }
        catch (err) {
            return prettyFatal(err);
        }
    };
    const extendInputType = (config) => {
        validateInput(config, ['definition']);
        try {
            const typeDef = NexusSchema.extendInputType(config);
            state.types.push(typeDef);
            return typeDef;
        }
        catch (err) {
            return prettyFatal(err);
        }
    };
    function importType(type, methodName) {
        validateInput({ type }, ['type']);
        try {
            if (type instanceof GraphQL.GraphQLScalarType && methodName) {
                const typeDef = NexusSchema.asNexusMethod(type, methodName);
                state.types.push(typeDef);
                state.scalars[typeDef.name] = typeDef;
                return typeDef;
            }
            state.types.push(type);
            return type;
        }
        catch (err) {
            return prettyFatal(err);
        }
    }
    const arg = NexusSchema.arg;
    const intArg = NexusSchema.intArg;
    const stringArg = NexusSchema.stringArg;
    const idArg = NexusSchema.idArg;
    const floatArg = NexusSchema.floatArg;
    const booleanArg = NexusSchema.booleanArg;
    return {
        state: state,
        builders: {
            queryType,
            mutationType,
            subscriptionType,
            objectType,
            inputObjectType,
            unionType,
            interfaceType,
            enumType,
            scalarType,
            arg,
            intArg,
            stringArg,
            idArg,
            floatArg,
            booleanArg,
            extendType,
            extendInputType,
            importType,
        },
    };
}
exports.createNexusSchemaStateful = createNexusSchemaStateful;
//# sourceMappingURL=stateful-nexus-schema.js.map