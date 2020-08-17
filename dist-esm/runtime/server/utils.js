export function sendSuccess(res, data) {
    sendJSON(res, 200, 'Success', {}, data);
}
export function sendErrorData(res, e) {
    var _a;
    ;
    res.error = e;
    sendJSON(res, e.status, e.name, (_a = e.headers) !== null && _a !== void 0 ? _a : {}, e.graphqlErrors);
}
export function sendError(res, e) {
    var _a;
    ;
    res.error = e;
    sendJSON(res, e.status, e.name, (_a = e.headers) !== null && _a !== void 0 ? _a : {}, { message: e.message });
}
export function sendJSON(res, status, statusMessage, headers, data) {
    res.statusCode = status;
    res.statusMessage = statusMessage;
    Object.entries(headers).forEach(([k, v]) => {
        if (v !== undefined) {
            res.setHeader(k, v);
        }
    });
    sendResponse(res, 'application/json', JSON.stringify(data));
}
/**
 * Helper function for sending a response using only the core Node server APIs.
 */
export function sendResponse(res, type, data) {
    const chunk = Buffer.from(data, 'utf8');
    res.setHeader('Content-Type', `${type}; charset=utf-8`);
    res.setHeader('Content-Length', String(chunk.length));
    res.end(chunk);
}
//# sourceMappingURL=utils.js.map