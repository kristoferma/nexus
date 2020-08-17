"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApolloServerExpress = void 0;
const apollo_server_express_1 = require("apollo-server-express");
class ApolloServerExpress extends apollo_server_express_1.ApolloServer {
    constructor(config) {
        super(config);
    }
}
exports.ApolloServerExpress = ApolloServerExpress;
//# sourceMappingURL=express.js.map