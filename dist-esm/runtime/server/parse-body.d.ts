/// <reference types="node" />
import { Either } from 'fp-ts/lib/Either';
import { IncomingMessage } from 'http';
import { HttpError } from 'http-errors';
import { ParsedUrlQuery } from 'querystring';
export declare function parseQuery(request: IncomingMessage): Either<HttpError, ParsedUrlQuery>;
/**
 * Provided a "Request" provided by express or connect (typically a node style
 * HTTPClientRequest), Promise the body data contained.
 */
export declare function parseBody(req: IncomingMessage): Promise<Either<HttpError, Record<string, unknown>>>;
//# sourceMappingURL=parse-body.d.ts.map