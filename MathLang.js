"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("ts-parso/index");
const TDL = [
    {
        name: "NUM",
        description: /\d+/,
        precedence: 10,
    },
    {
        name: "WHITESPACE",
        description: /\s+/,
        precedence: 9,
    },
    {
        name: "PLUS",
        description: /\+/,
        precedence: 10,
    },
    {
        name: "STAR",
        description: /\*/,
        precedence: 10,
    },
    {
        name: "CARET",
        description: /\^/,
        precedence: 10,
    },
    {
        name: "LPAREN",
        description: /\(/,
        precedence: 10,
    },
    {
        name: "RPAREN",
        description: /\)/,
        precedence: 10,
    },
];
const testStr = "(1 + 2)^(3 + (23 * 100))";
// "1 + 2 + (3 + 4) * 10^2";
const tokens = (0, index_1.Tokenize)(testStr, TDL);
console.log(tokens);
const gram = [
    // {
    //   type: "Rule",
    //   name: "Addition",
    //   pattern: [["Phrase", "PLUS", "Phrase"]],
    //   callback: (r: RuleMatch<string>) => {
    //     return "";
    //   },
    // },
    // {
    //   type: "Rule",
    //   name: "Multiplication",
    //   pattern: [["Phrase", "STAR", "Phrase"]],
    //   callback: (r: RuleMatch<string>) => {
    //     return "";
    //   },
    // },
    {
        type: "Rule",
        name: "BinaryOp",
        pattern: [["PLUS"], ["CARET"], ["STAR"]],
        callback: (r) => {
            if (r.match[0].rule.type === "Token") {
                return r.match[0].rule.match;
                // switch (r.match[0].rule.match) {
                //   case "PLUS":
                //     return "+";
                //   case "CARET":
                //     return "^";
                //   case "STAR":
                //     return "*";
                //   default:
                //     throw new Error("E7");
                // }
            }
            else {
                throw new Error("E6");
            }
        },
    },
    // {
    //   type: "Rule",
    //   name: "Term",
    //   pattern: [["NUM"]],
    //   callback(r, context) {
    //     return "";
    //   },
    // },
    {
        type: "Rule",
        name: "NonRecPhrase",
        pattern: [
            ["BinaryOp", "NonRecPhrase"],
            ["LPAREN", "Phrase", "RPAREN"],
            ["NUM"],
            ["EMPTY"],
        ],
        callback(r, context) {
            let outputs = "";
            if (r.rule.type === "Rule") {
                if (r.match[0].rule.type === "Token") {
                    outputs += r.match[0].rule.match;
                }
                else {
                    // Must be rule, so binary op
                    outputs += r.match[0].rule.callback(r.match[0]);
                    // throw new Error("E3");
                }
                if (r.match[1]) {
                    if (r.match[1].rule.type === "Rule") {
                        outputs += r.match[1].rule.callback(r.match[1]);
                    }
                    else {
                        throw new Error("E4");
                    }
                }
                if (r.match[2]) {
                    if (r.match[2].rule.type === "Token") {
                        outputs += r.match[2].rule.match;
                    }
                    else {
                        throw new Error("E5");
                    }
                }
            }
            return outputs;
        },
    },
    {
        type: "Rule",
        name: "Phrase",
        pattern: [
            ["NUM", "NonRecPhrase"],
            ["LPAREN", "Phrase", "RPAREN", "NonRecPhrase"],
        ],
        callback(r, context) {
            let outputs = "";
            if (r.rule.type === "Rule") {
                if (r.match[0].rule.type === "Token") {
                    outputs += r.match[0].rule.match;
                }
                else {
                    throw new Error("E1");
                }
                if (r.match[1].rule.type === "Rule") {
                    outputs += r.match[1].rule.callback(r.match[1]);
                }
                else {
                    throw new Error("E2");
                }
                if (r.match[2]) {
                    if (r.match[2].rule.type === "Token" &&
                        r.match[3].rule.type === "Rule") {
                        outputs += r.match[2].rule.match;
                        outputs += r.match[3].rule.callback(r.match[3]);
                    }
                    else {
                        throw new Error("RPAREN not token");
                    }
                }
            }
            return outputs;
        },
    },
];
const phraseRule = gram.find((val) => val.name === "Phrase");
if (!phraseRule)
    throw new Error("COULDNT FIND PHRASE RULE");
const trimmedWhitespace = tokens.filter((val) => val.name !== "WHITESPACE");
console.log(trimmedWhitespace);
const parseOut = (0, index_1.Parser)(3, trimmedWhitespace, gram, phraseRule);
// console.log(JSON.stringify(parseOut));
if (parseOut && parseOut.rule.type === "Rule") {
    console.log(parseOut.rule.callback(parseOut));
}
//# sourceMappingURL=MathLang.js.map