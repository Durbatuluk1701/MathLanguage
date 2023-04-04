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
        name: "MINUS",
        description: /-/,
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
const testStr = "7 - (4 + 1)";
// "(1 + 2)^(3 + (23 * 100)) - 100";
// "1 + 2 + (3 + 4) * 10^2";
const tokens = (0, index_1.Tokenize)(testStr, TDL);
console.log(tokens);
const gram = [
    {
        type: "Rule",
        name: "BinaryOp",
        pattern: [["PLUS"], ["CARET"], ["STAR"], ["MINUS"]],
        callback: (r, context) => {
            if (r.match[0].rule.type !== "Token")
                throw new Error("Only expected tokens as a binary operator");
            const lastVal = context.stack.pop();
            if (!lastVal)
                throw new Error("Cannot do operation with empty stack");
            switch (r.match[0].rule.name) {
                case "PLUS":
                    return (n) => {
                        return lastVal(0) + n;
                    };
                case "MINUS":
                    if (!lastVal)
                        throw new Error("Cannot do operation with empty stack");
                    return (n) => {
                        return lastVal(0) - n;
                    };
                case "CARET":
                    if (!lastVal)
                        throw new Error("Cannot do operation with empty stack");
                    return (n) => {
                        return Math.pow(lastVal(0), n);
                    };
                case "STAR":
                    if (!lastVal)
                        throw new Error("Cannot do operation with empty stack");
                    return (n) => {
                        return lastVal(0) * n;
                    };
                default:
                    throw new Error("Expecting a valid operation name");
            }
        },
    },
    {
        type: "Rule",
        name: "NonRecPhrase",
        pattern: [["BinaryOp", "Phrase", "NonRecPhrase"], ["EMPTY"]],
        callback(r, context) {
            if (r.rule.type !== "Rule")
                throw new Error("This should be a rule!");
            const match0 = r.match[0];
            if (match0.rule.name === "EMPTY") {
                const currentTop = context.stack.pop();
                if (currentTop)
                    return currentTop;
                throw new Error("Encountered a final empty, with an empty stack");
            }
            const match1 = r.match[1];
            const match2 = r.match[2];
            if (match0.rule.type !== "Rule" || match1.rule.type !== "Rule")
                throw new Error("Each match should be a rule, but at least 1 is not");
            const binaryOpOutput = match0.rule.callback(match0, context);
            context.stack.push(binaryOpOutput);
            const phraseOutput = match1.rule.callback(match1, context);
            if (match2 && match2.match.length > 0 && match2.rule.type === "Rule") {
                context.stack.push(phraseOutput);
                const nonRecOutput = match2.rule.callback(match2, context);
                return nonRecOutput;
            }
            return phraseOutput;
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
            const match0 = r.match[0];
            const match1 = r.match[1];
            if (r.rule.type === "Rule" && match0.rule.type === "Token") {
                switch (match0.rule.name) {
                    case "NUM":
                        const stackTop = context.stack.pop();
                        const numberOutput = Number.parseInt(match0.rule.match);
                        if (stackTop) {
                            // We have something at the top of the stack to work with
                            context.stack.push((n) => stackTop(numberOutput));
                        }
                        else {
                            // Nothing at the top of the stack, so just add first item
                            context.stack.push(() => numberOutput);
                        }
                        if (match1 && match1.match.length > 0) {
                            // Now we do the NonRecPhrase part
                            if (match1.rule.type !== "Rule")
                                throw new Error("Expecting a 'NonRecPhrase', but we did not encounter one");
                            const recCallOutput = match1.rule.callback(match1, context);
                            context.stack.push(recCallOutput);
                        }
                        else {
                            // the NonRecPhrase was EMPTY, just return the top of the context
                            const topStack = context.stack.pop();
                            if (topStack) {
                                return topStack;
                            }
                            else {
                                throw new Error("No top of stack, and empty phrase remaining!");
                            }
                        }
                        break;
                    case "LPAREN":
                        // We are opening some parens, so we need to do the inside first
                        // Get the phrases output
                        if (match1.rule.type !== "Rule")
                            throw new Error("Expecting a 'Phrase', but we did not encounter one");
                        // Providing a clean NUM context for within
                        const previousStackTop = context.stack.pop();
                        context.stack.push((n) => n);
                        const internalOutput = match1.rule.callback(match1, context);
                        // This output should really be combined with a previous stack input if possible
                        if (previousStackTop) {
                            // We have something at the top of the stack to work with
                            context.stack.push((n) => previousStackTop(internalOutput(n)));
                        }
                        else {
                            // Nothing at the top of the stack, so just add first item
                            context.stack.push(internalOutput);
                        }
                        // context.stack.push(internalOutput);
                        const match3 = r.match[3];
                        if (!match3) {
                            // The last part is EMPTY, so proceed without it and just return previous top
                            break;
                        }
                        if (match3.rule.type !== "Rule")
                            throw new Error("Expecting a 'Phrase', but we did not encounter one");
                        const finalOutput = match3.rule.callback(match3, context);
                        context.stack.push(finalOutput);
                        break;
                    default:
                        throw new Error(`Expecting either a NUM or LPAREN, but instead received a ${match0.rule.name}`);
                }
                const retVal = context.stack.pop();
                if (retVal)
                    return retVal;
                throw new Error("The context stack was empty, nothing to return!");
            }
            else {
                throw new Error("Expecting this to be a rule, but it wasnt somehow?");
            }
        },
    },
];
const phraseRule = gram.find((val) => val.name === "Phrase");
if (!phraseRule)
    throw new Error("COULDNT FIND PHRASE RULE");
const trimmedWhitespace = tokens.filter((val) => val.name !== "WHITESPACE");
// console.log(trimmedWhitespace);
const parseOut = (0, index_1.Parser)(3, trimmedWhitespace, gram, phraseRule);
// console.log(JSON.stringify(parseOut));
if (parseOut && parseOut.rule.type === "Rule") {
    console.log(parseOut.rule.callback(parseOut, { stack: [] })(0));
}
//# sourceMappingURL=MathLang.js.map