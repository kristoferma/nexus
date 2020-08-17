"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.highlightGraphQL = exports.highlightTS = void 0;
const tslib_1 = require("tslib");
const Prism = tslib_1.__importStar(require("prismjs"));
const theme_1 = require("./theme");
Prism.languages.typescript = Prism.languages.extend('javascript', {
    'class-name': {
        pattern: /(\b(?:class|extends|implements|instanceof|interface|new|type)\s+)(?!keyof\b)[_$a-zA-Z\xA0-\uFFFF][$\w\xA0-\uFFFF]*(?:\s*<(?:[^<>]|<(?:[^<>]|<[^<>]*>)*>)*>)?/,
        lookbehind: true,
        greedy: true,
        inside: null // see below
    },
    // From JavaScript Prism keyword list and TypeScript language spec: https://github.com/Microsoft/TypeScript/blob/master/doc/spec.md#221-reserved-words
    'keyword': /\b(?:abstract|as|asserts|async|await|break|case|catch|class|const|constructor|continue|debugger|declare|default|delete|do|else|enum|export|extends|finally|for|from|function|get|if|implements|import|in|instanceof|interface|is|keyof|let|module|namespace|new|null|of|package|private|protected|public|readonly|return|require|set|static|super|switch|this|throw|try|type|typeof|undefined|var|void|while|with|yield)\b/,
    'builtin': /\b(?:string|Function|any|number|boolean|Array|symbol|console|Promise|unknown|never)\b/,
});
Prism.languages.graphql = {
    comment: /#.*/,
    description: {
        pattern: /(?:"""(?:[^"]|(?!""")")*"""|"(?:\\.|[^\\"\r\n])*")(?=\s*[a-z_])/i,
        greedy: true,
        alias: 'string',
        inside: {
            'language-markdown': {
                pattern: /(^"(?:"")?)(?!\1)[\s\S]+(?=\1$)/,
                lookbehind: true,
                inside: Prism.languages.markdown,
            },
        },
    },
    string: {
        pattern: /"""(?:[^"]|(?!""")")*"""|"(?:\\.|[^\\"\r\n])*"/,
        greedy: true,
    },
    number: /(?:\B-|\b)\d+(?:\.\d+)?(?:e[+-]?\d+)?\b/i,
    boolean: /\b(?:true|false)\b/,
    variable: /\$[a-z_]\w*/i,
    directive: {
        pattern: /@[a-z_]\w*/i,
        alias: 'function',
    },
    'attr-name': {
        pattern: /[a-z_]\w*(?=\s*(?:\((?:[^()"]|"(?:\\.|[^\\"\r\n])*")*\))?:)/i,
        greedy: true,
    },
    'class-name': {
        pattern: /(\b(?:enum|implements|interface|on|scalar|type|union)\s+|&\s*)[a-zA-Z_]\w*/,
        lookbehind: true,
    },
    fragment: {
        pattern: /(\bfragment\s+|\.{3}\s*(?!on\b))[a-zA-Z_]\w*/,
        lookbehind: true,
        alias: 'function',
    },
    keyword: /\b(?:directive|enum|extend|fragment|implements|input|interface|mutation|on|query|repeatable|scalar|schema|subscription|type|union)\b/,
    operator: /[!=|&]|\.{3}/,
    punctuation: /[!(){}\[\]:=,]/,
    constant: /\b(?!ID\b)[A-Z][A-Z_\d]*\b/,
};
function highlightTS(str) {
    return highlightForTerminal(str, Prism.languages.typescript);
}
exports.highlightTS = highlightTS;
function highlightGraphQL(str) {
    return highlightForTerminal(str, Prism.languages.graphql);
}
exports.highlightGraphQL = highlightGraphQL;
function stringifyToken(t, language) {
    if (typeof t == 'string') {
        return t;
    }
    if (Array.isArray(t)) {
        return t
            .map(function (element) {
            return stringifyToken(element, language);
        })
            .join('');
    }
    return getColorForSyntaxKind(t.type)(t.content.toString());
}
function getColorForSyntaxKind(syntaxKind) {
    return theme_1.theme[syntaxKind] || theme_1.identity;
}
function highlightForTerminal(str, grammar) {
    const tokens = Prism.tokenize(str, grammar);
    return tokens.map((t) => stringifyToken(t)).join('');
}
//# sourceMappingURL=highlight.js.map