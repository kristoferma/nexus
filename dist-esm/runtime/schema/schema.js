import * as NexusSchema from '@nexus/schema';
import chalk from 'chalk';
import * as GraphQL from 'graphql';
import { logPrettyError } from '../../lib/errors';
import { createNexusSchemaStateful } from '../../lib/nexus-schema-stateful';
import * as Process from '../../lib/process';
import * as Scalars from '../../lib/scalars';
import * as DevMode from '../dev-mode';
import { assertAppNotAssembled } from '../utils';
import { log } from './logger';
import { createSchemaSettingsManager } from './settings';
import { mapSettingsAndPluginsToNexusSchemaConfig } from './settings-mapper';
export function createLazyState() {
    return {
        contextContributors: [],
        plugins: [],
        scalars: {},
    };
}
export function create(state) {
    state.components.schema = createLazyState();
    const statefulNexusSchema = createNexusSchemaStateful();
    const settings = createSchemaSettingsManager();
    const api = Object.assign(Object.assign({}, statefulNexusSchema.builders), { use(plugin) {
            assertAppNotAssembled(state, 'app.schema.use', 'The Nexus Schema plugin you used will be ignored.');
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
                const nexusSchemaConfig = mapSettingsAndPluginsToNexusSchemaConfig(plugins, settings.data);
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
                    logPrettyError(log, err, 'fatal');
                }
            },
            checks() {
                assertNoMissingTypesDev(state.assembled.schema, state.assembled.missingTypes);
                // TODO: We should separate types added by the framework and the ones added by users
                if (statefulNexusSchema.state.types.length === 2 &&
                    statefulNexusSchema.state.types.every((t) => Scalars.builtinScalars[t.name] !== undefined)) {
                    log.warn(emptyExceptionMessage());
                }
            },
        },
    };
}
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
                    .map((s) => `"${chalk.greenBright(s)}"`)
                    .join(', ')} ?`;
            }
            log.error(`Missing type "${chalk.redBright(typeName)}" in your GraphQL Schema.${suggestionsString}`);
        });
    }
    else {
        Process.fatal(`Missing types ${missingTypesNames.map((t) => `"${t}"`).join(', ')} in your GraphQL Schema.`, { missingTypesNames });
    }
}
//# sourceMappingURL=schema.js.map