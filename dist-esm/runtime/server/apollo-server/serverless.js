import { renderPlaygroundPage } from '@apollographql/graphql-playground-html';
import accepts from 'accepts';
import { ApolloServerBase, convertNodeHttpToRequest, processFileUploads, runHttpQuery, } from 'apollo-server-core';
import { isLeft } from 'fp-ts/lib/Either';
import createError from 'http-errors';
import { parseBody, parseQuery } from '../parse-body';
import { sendError, sendJSON, sendResponse } from '../utils';
export class ApolloServerless extends ApolloServerBase {
    constructor(config) {
        super(config);
    }
    // Extract Apollo Server options from the request.
    async createGraphQLServerOptions(req, res) {
        return super.graphQLServerOptions({ req, res });
    }
    // Prepares and returns an async function that can be used by Micro to handle
    // GraphQL requests.
    createHandler({ path, disableHealthCheck, onHealthCheck } = {}) {
        // We'll kick off the `willStart` right away, so hopefully it'll finish
        // before the first request comes in.
        const promiseWillStart = this.willStart();
        return async (req, res) => {
            this.graphqlPath = path || '/graphql';
            await promiseWillStart;
            if (typeof processFileUploads === 'function') {
                await this.handleFileUploads(req, res);
            }
            if (this.isHealthCheckRequest(req, disableHealthCheck)) {
                return this.handleHealthCheck({
                    req,
                    res,
                    onHealthCheck,
                });
            }
            if (this.isPlaygroundRequest(req)) {
                return this.handleGraphqlRequestsWithPlayground({ req, res });
            }
            return this.handleGraphqlRequestsWithServer({ req, res });
        };
    }
    // This integration supports file uploads.
    supportsUploads() {
        return true;
    }
    // This integration supports subscriptions.
    supportsSubscriptions() {
        return false;
    }
    isHealthCheckRequest(req, disableHealthCheck) {
        return !disableHealthCheck && req.url === '/.well-known/apollo/server-health';
    }
    isPlaygroundRequest(req) {
        const playgroundEnabled = Boolean(this.playgroundOptions) && req.method === 'GET';
        const acceptTypes = accepts(req).types();
        const prefersHTML = acceptTypes.find((x) => x === 'text/html') === 'text/html';
        return playgroundEnabled && prefersHTML;
    }
    // If health checking is enabled, trigger the `onHealthCheck`
    // function when the health check URL is requested.
    async handleHealthCheck({ req, res, onHealthCheck, }) {
        // Response follows
        // https://tools.ietf.org/html/draft-inadarei-api-health-check-01
        res.setHeader('Content-Type', 'application/health+json');
        if (onHealthCheck) {
            try {
                await onHealthCheck(req);
            }
            catch (error) {
                sendJSON(res, 503, 'Service Unavailable', {}, { status: 'fail' });
                return;
            }
        }
        sendJSON(res, 200, 'Success', {}, { status: 'pass' });
    }
    // If the `playgroundOptions` are set, register a `graphql-playground` instance
    // (not available in production) that is then used to handle all
    // incoming GraphQL requests.
    handleGraphqlRequestsWithPlayground({ req, res, }) {
        const middlewareOptions = Object.assign({ endpoint: this.graphqlPath, subscriptionEndpoint: this.subscriptionsPath }, this.playgroundOptions);
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.statusCode = 200;
        res.statusMessage = 'Success';
        sendResponse(res, 'text/html', renderPlaygroundPage(middlewareOptions));
    }
    // Handle incoming GraphQL requests using Apollo Server.
    async handleGraphqlRequestsWithServer({ req, res, }) {
        const handler = graphqlHandler(() => {
            return this.createGraphQLServerOptions(req, res);
        });
        await handler(req, res);
    }
    // If file uploads are detected, prepare them for easier handling with
    // the help of `graphql-upload`.
    async handleFileUploads(req, res) {
        if (typeof processFileUploads !== 'function') {
            return;
        }
        const contentType = req.headers['content-type'];
        if (this.uploadsConfig && contentType && contentType.startsWith('multipart/form-data')) {
            ;
            req.filePayload = await processFileUploads(req, res, this.uploadsConfig);
        }
    }
}
// Utility function used to set multiple headers on a response object.
function setHeaders(res, headers) {
    Object.keys(headers).forEach((header) => {
        res.setHeader(header, headers[header]);
    });
}
// Build and return an async function that passes incoming GraphQL requests
// over to Apollo Server for processing, then fires the results/response back
// using Micro's `send` functionality.
export function graphqlHandler(options) {
    if (!options) {
        throw new Error('Apollo Server requires options.');
    }
    if (arguments.length > 1) {
        throw new Error(`Apollo Server expects exactly one argument, got ${arguments.length}`);
    }
    return async (req, res) => {
        var _a, _b, _c, _d, _e;
        try {
            if (req.method !== 'GET' && req.method !== 'POST') {
                return sendError(res, createError(400, 'Only GET and POST requests allowed'));
            }
            const query = req.method === 'POST' ? await parseBody(req) : parseQuery(req);
            if (isLeft(query)) {
                return sendError(res, query.left);
            }
            const { graphqlResponse, responseInit } = await runHttpQuery([req, res], {
                method: (_a = req.method) !== null && _a !== void 0 ? _a : 'GET',
                options,
                query: query.right,
                request: convertNodeHttpToRequest(req),
            });
            setHeaders(res, (_b = responseInit.headers) !== null && _b !== void 0 ? _b : {});
            sendJSON(res, 200, 'Success', {}, JSON.parse(graphqlResponse));
        }
        catch (error) {
            if ('HttpQueryError' !== error.name) {
                throw error;
            }
            const e = error;
            res.statusCode = (_c = e.statusCode) !== null && _c !== void 0 ? _c : 500;
            res.statusMessage = e.name;
            if (e.isGraphQLError) {
                sendJSON(res, res.statusCode, res.statusMessage, (_d = e.headers) !== null && _d !== void 0 ? _d : {}, JSON.parse(e.message));
            }
            else {
                sendJSON(res, res.statusCode, res.statusMessage, (_e = e.headers) !== null && _e !== void 0 ? _e : {}, { message: e.message });
            }
        }
    };
}
//# sourceMappingURL=serverless.js.map