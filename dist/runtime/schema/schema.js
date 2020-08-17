"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.create = exports.createLazyState = void 0;
const tslib_1 = require("tslib");
const NexusSchema = tslib_1.__importStar(require("@nexus/schema"));
const chalk_1 = tslib_1.__importDefault(require("chalk"));
const GraphQL = tslib_1.__importStar(require("graphql"));
const errors_1 = require("../../lib/errors");
const nexus_schema_stateful_1 = require("../../lib/nexus-schema-stateful");
const Process = tslib_1.__importStar(require("../../lib/process"));
const Scalars = tslib_1.__importStar(require("../../lib/scalars"));
const DevMode = tslib_1.__importStar(require("../dev-mode"));
const utils_1 = require("../utils");
const logger_1 = require("./logger");
const settings_1 = require("./settings");
const settings_mapper_1 = require("./settings-mapper");
function createLazyState() {
    return {
        contextContributors: [],
        plugins: [],
        scalars: {},
    };
}
exports.createLazyState = createLazyState;
function create(state) {
    state.components.schema = createLazyState();
    const statefulNexusSchema = nexus_schema_stateful_1.createNexusSchemaStateful();
    const settings = settings_1.createSchemaSettingsManager();
    const api = Object.assign(Object.assign({}, statefulNexusSchema.builders), { use(plugin) {
            utils_1.assertAppNotAssembled(state, 'app.schema.use', 'The Nexus Schema plugin you used will be ignored.');
            state.components.schema.plugins.push(plugin);
        },
        addToContext(contextAdder) {
            state.components.schema.contextContributors.push(contextAdder);
        },
        middleware(fn) {
            api.use(NexusSchema.plugin({
                // TODO: Do we need to expose the name property?
                name: 'local-middleware',
                onCreateFieldResolver(config) {
                    return fn(config);
                },
            }));
        } });
    return {
        public: api,
        private: {
            settings: settings,
            reset() {
                statefulNexusSchema.state.types = [];
                statefulNexusSchema.state.scalars = {};
                state.components.schema.contextContributors = [];
                state.components.schema.plugins = [];
                state.components.schema.scalars = {};
            },
            beforeAssembly() {
                state.components.schema.scalars = statefulNexusSchema.state.scalars;
            },
            assemble(plugins) {
                const nexusSchemaConfig = settings_mapper_1.mapSettingsAndPluginsToNexusSchemaConfig(plugins, settings.data);
                nexusSchemaConfig.types.push(...statefulNexusSchema.state.types);
                nexusSchemaConfig.plugins.push(...state.components.schema.plugins);
                try {
                    const { schema, missingTypes } = NexusSchema.core.makeSchemaInternal(nexusSchemaConfig);
                    if (process.env.NEXUS_STAGE === 'dev') {
                        // Validate GraphQL Schema
                        // TODO: This should be done in @nexus/schema
                        GraphQL.validate(schema, GraphQL.parse(GraphQL.getIntrospectionQuery()));
                    }
                    return { schema, missingTypes };
                }
                catch (err) {
                    errors_1.logPrettyError(logger_1.log, err, 'fatal');
                }
            },
            checks() {
                assertNoMissingTypesDev(state.assembled.schema, state.assembled.missingTypes);
                // TODO: We should separate types added by the framework and the ones added by users
                if (statefulNexusSchema.state.types.length === 2 &&
                    statefulNexusSchema.state.types.every((t) => Scalars.builtinScalars[t.name] !== undefined)) {
                    logger_1.log.warn(emptyExceptionMessage());
                }
            },
        },
    };
}
exports.create = create;
function emptyExceptionMessage() {
    return `Your GraphQL schema is empty. This is normal if you have not defined any GraphQL types yet. If you did however, check that your files are contained in the same directory specified in the \`rootDir\` property of your tsconfig.json file.`;
}
function assertNoMissingTypesDev(schema, missingTypes) {
    const missingTypesNames = Object.keys(missingTypes);
    if (missingTypesNames.length === 0) {
        return;
    }
    const schemaTypeMap = schema.getTypeMap();
    const schemaTypeNames = Object.keys(schemaTypeMap).filter((typeName) => !NexusSchema.core.isUnknownType(schemaTypeMap[typeName]));
    if (DevMode.isDevMode()) {
        missingTypesNames.map((typeName) => {
            const suggestions = NexusSchema.core.suggestionList(typeName, schemaTypeNames);
            let suggestionsString = '';
            if (suggestions.length > 0) {
                suggestionsString = ` Did you mean ${suggestions
                    .map((s) => `"${chalk_1.default.greenBright(s)}"`)
                    .join(', ')} ?`;
            }
            logger_1.log.error(`Missing type "${chalk_1.default.redBright(typeName)}" in your GraphQL Schema.${suggestionsString}`);
        });
    }
    else {
        Process.fatal(`Missing types ${missingTypesNames.map((t) => `"${t}"`).join(', ')} in your GraphQL Schema.`, { missingTypesNames });
    }
}
//# sourceMappingURL=schema.js.map