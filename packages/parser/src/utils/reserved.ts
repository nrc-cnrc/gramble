import { PLAIN_PARAM } from "./constants";

export const RESERVED_SYMBOLS = new Set([ 
    "(", ")", "%", "/", "<", ">", 
    "[", "]", ":", ",", ".", ";", "=", "{", "}"
]);

export const REQUIRED_REPLACE_PARAMS = new Set([
    "from",
    "to",
]);

export const REPLACE_PARAMS = new Set([
    "context",
    ...REQUIRED_REPLACE_PARAMS
]);

export const TEST_PARAMS = new Set([
    "unique",
]);

export const BLANK_PARAM_SET = new Set([PLAIN_PARAM]);
export const TEST_PARAM_SET = new Set([PLAIN_PARAM, ...TEST_PARAMS]);

export const RESERVED_HEADERS = new Set([
    "embed", 
    "optional",
    "hide", 
    "equals", 
    "starts", 
    "ends", 
    "contains",
    "re",
    ...REPLACE_PARAMS,
    ...TEST_PARAMS
]);

export const RESERVED_OPS: Set<string> = new Set([
    "table", 
    "test", 
    "testnot",
    "replace",
    "collection",
    "join",
    "or"
]);

export const RESERVED_WORDS = new Set([
    ...RESERVED_HEADERS, 
    ...RESERVED_OPS
]);

export const ALL_RESERVED = new Set([
    ...RESERVED_SYMBOLS,
    ...RESERVED_WORDS
]);

/* RESERVED SYMBOLS */
export const RESERVED_FOR_PLAINTEXT = new Set(["|"]);
export const RESERVED_FOR_SYMBOL = new Set([...RESERVED_FOR_PLAINTEXT, ".", "{", "}"])
export const RESERVED_FOR_REGEX = new Set([...RESERVED_FOR_SYMBOL, "(", ")", "~", "*", "?", "+"]);
export const RESERVED_FOR_CONTEXT = new Set([...RESERVED_FOR_REGEX, "#", "_"]);

export function isValidSymbolName(s: string): boolean {
    return /^(\p{L}|\p{M}|\p{Sk}|_)(\p{L}|\p{M}|\p{Sk}|\p{N}|[_@#$&\-^'"])*$/iu.test(s);
}