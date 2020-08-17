import { Headers as FetchHeaders } from 'cross-fetch';
import * as GQLR from 'graphql-request';
export class GraphQLClient {
    constructor(url) {
        this.url = url;
        this.fetchHeaders = new FetchHeaders();
        this.headers = new Headers(this.fetchHeaders);
    }
    send(queryString, variables) {
        let headers = fetchHeadersToObject(this.fetchHeaders);
        const url = this.url;
        const client = new GQLR.GraphQLClient(url, { headers });
        return client.request(queryString, variables);
    }
}
/**
 * Create a GraphQL Client instance
 */
export class Headers {
    constructor(fetchHeaders) {
        this.fetchHeaders = fetchHeaders;
    }
    set(...args) {
        let input;
        if (Array.isArray(args[0])) {
            input = { [args[0][0]]: args[0][1] };
        }
        else if (typeof args[0] === 'string' && typeof args[1] === 'string') {
            input = { [args[0]]: args[1] };
        }
        else if (typeof args[0] === 'object' && args[0] !== null) {
            input = args[0];
        }
        else
            throw new TypeError(`invalid input: ${args}`);
        Object.entries(input).forEach(([k, v]) => {
            this.fetchHeaders.set(k, v);
        });
        return undefined;
    }
    add(...args) {
        let input;
        if (Array.isArray(args[0])) {
            input = { [args[0][0]]: args[0][1] };
        }
        else if (typeof args[0] === 'string' && typeof args[1] === 'string') {
            input = { [args[0]]: args[1] };
        }
        else if (typeof args[0] === 'object') {
            input = args[0];
        }
        else
            throw new TypeError(`invalid input: ${args}`);
        Object.entries(input).forEach(([name, value]) => {
            this.fetchHeaders.append(name, value);
        });
        return undefined;
    }
    del(name) {
        return this.fetchHeaders.delete(name);
    }
    get(name) {
        return this.fetchHeaders.get(name);
    }
    has(name) {
        return this.fetchHeaders.has(name);
    }
    entries() {
        return this.fetchHeaders.entries();
    }
}
/**
 * Convert fetch headers to plain object.
 */
function fetchHeadersToObject(headers) {
    let obj = {};
    for (const [name, value] of headers.entries()) {
        obj[name] = value;
    }
    return obj;
}
//# sourceMappingURL=index.js.map