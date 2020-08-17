"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseBody = exports.parseQuery = void 0;
const tslib_1 = require("tslib");
/**
 * This module is copy-pasted & adapted from https://github.com/graphql/express-graphql/blob/master/src/parseBody.js
 */
const content_type_1 = tslib_1.__importDefault(require("content-type"));
const Either_1 = require("fp-ts/lib/Either");
const http_errors_1 = tslib_1.__importDefault(require("http-errors"));
const querystring_1 = tslib_1.__importDefault(require("querystring"));
const raw_body_1 = tslib_1.__importDefault(require("raw-body"));
const url = tslib_1.__importStar(require("url"));
const zlib_1 = tslib_1.__importDefault(require("zlib"));
function parseQuery(request) {
    const urlData = (request.url && url.parse(request.url, true).query) || {};
    return Either_1.right(urlData);
}
exports.parseQuery = parseQuery;
/**
 * Provided a "Request" provided by express or connect (typically a node style
 * HTTPClientRequest), Promise the body data contained.
 */
async function parseBody(req) {
    const { body } = req;
    // If express has already parsed a body as a keyed object, use it.
    if (typeof body === 'object' && !(body instanceof Buffer)) {
        return Either_1.right(body);
    }
    // Skip requests without content types.
    if (req.headers['content-type'] === undefined) {
        return Either_1.right({});
    }
    const typeInfo = content_type_1.default.parse(req);
    // If express has already parsed a body as a string, and the content-type
    // was application/graphql, parse the string body.
    if (typeof body === 'string' && typeInfo.type === 'application/graphql') {
        return Either_1.right({ query: body });
    }
    // Already parsed body we didn't recognise? Parse nothing.
    if (body != null) {
        return Either_1.right({});
    }
    const rawBody = await readBody(req, typeInfo);
    if (Either_1.isLeft(rawBody))
        return rawBody;
    // Use the correct body parser based on Content-Type header.
    switch (typeInfo.type) {
        case 'application/graphql':
            return Either_1.right({ query: rawBody.right });
        case 'application/json':
            if (jsonObjRegex.test(rawBody.right)) {
                try {
                    return Either_1.right(JSON.parse(rawBody.right));
                }
                catch (error) {
                    // Do nothing
                }
            }
            return Either_1.left(http_errors_1.default(400, 'POST body sent invalid JSON.'));
        case 'application/x-www-form-urlencoded':
            return Either_1.right(querystring_1.default.parse(rawBody.right));
    }
    // If no Content-Type header matches, parse nothing.
    return Either_1.right({});
}
exports.parseBody = parseBody;
/**
 * RegExp to match an Object-opening brace "{" as the first non-space
 * in a string. Allowed whitespace is defined in RFC 7159:
 *
 *     ' '   Space
 *     '\t'  Horizontal tab
 *     '\n'  Line feed or New line
 *     '\r'  Carriage return
 */
const jsonObjRegex = /^[ \t\n\r]*\{/;
// Read and parse a request body.
async function readBody(req, typeInfo) {
    const charset = (typeInfo.parameters.charset || 'utf-8').toLowerCase();
    // Assert charset encoding per JSON RFC 7159 sec 8.1
    if (charset.slice(0, 4) !== 'utf-') {
        return Either_1.left(http_errors_1.default(415, `Unsupported charset "${charset.toUpperCase()}".`));
    }
    // Get content-encoding (e.g. gzip)
    const contentEncoding = req.headers['content-encoding'];
    const encoding = typeof contentEncoding === 'string' ? contentEncoding.toLowerCase() : 'identity';
    const length = encoding === 'identity' ? req.headers['content-length'] : null;
    const limit = 100 * 1024; // 100kb
    const stream = decompressed(req, encoding);
    if (Either_1.isLeft(stream))
        return stream;
    // Read body from stream.
    try {
        const body = await raw_body_1.default(stream.right, { encoding: charset, length, limit });
        return Either_1.right(body);
    }
    catch (err) {
        return err.type === 'encoding.unsupported'
            ? Either_1.left(http_errors_1.default(415, `Unsupported charset "${charset.toUpperCase()}".`))
            : Either_1.left(http_errors_1.default(400, `Invalid body: ${err.message}.`));
    }
}
/**
 * Return a decompressed stream, given an encoding.
 */
function decompressed(req, encoding) {
    switch (encoding) {
        case 'identity':
            return Either_1.right(req);
        case 'deflate':
            return Either_1.right(req.pipe(zlib_1.default.createInflate()));
        case 'gzip':
            return Either_1.right(req.pipe(zlib_1.default.createGunzip()));
    }
    return Either_1.left(http_errors_1.default(415, `Unsupported content-encoding "${encoding}".`));
}
//# sourceMappingURL=parse-body.js.map