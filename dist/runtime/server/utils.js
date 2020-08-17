"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendResponse = exports.sendJSON = exports.sendError = exports.sendErrorData = exports.sendSuccess = void 0;
function sendSuccess(res, data) {
    sendJSON(res, 200, 'Success', {}, data);
}
exports.sendSuccess = sendSuccess;
function sendErrorData(res, e) {
    var _a;
    ;
    res.error = e;
    sendJSON(res, e.status, e.name, (_a = e.headers) !== null && _a !== void 0 ? _a : {}, e.graphqlErrors);
}
exports.sendErrorData = sendErrorData;
function sendError(res, e) {
    var _a;
    ;
    res.error = e;
    sendJSON(res, e.status, e.name, (_a = e.headers) !== null && _a !== void 0 ? _a : {}, { message: e.message });
}
exports.sendError = sendError;
function sendJSON(res, status, statusMessage, headers, data) {
    res.statusCode = status;
    res.statusMessage = statusMessage;
    Object.entries(headers).forEach(([k, v]) => {
        if (v !== undefined) {
            res.setHeader(k, v);
        }
    });
    sendResponse(res, 'application/json', JSON.stringify(data));
}
exports.sendJSON = sendJSON;
/**
 * Helper function for sending a response using only the core Node server APIs.
 */
function sendResponse(res, type, data) {
    const chunk = Buffer.from(data, 'utf8');
    res.setHeader('Content-Type', `${type}; charset=utf-8`);
    res.setHeader('Content-Length', String(chunk.length));
    res.end(chunk);
}
exports.sendResponse = sendResponse;
//# sourceMappingURL=utils.js.map