

export const RESERVED_SYMBOLS = [ 
    "(", ")", "%", "/", "<", ">", 
    "[", "]", ":", ",", ".", ";" 
];

export const REQUIRED_REPLACE_PARAMS = new Set([
    "from",
    "to",
]);

export const REPLACE_PARAMS = new Set([
    "pre",
    "post",
    ...REQUIRED_REPLACE_PARAMS
]);

export const TEST_PARAMS = new Set([
    "unique",
]);

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

export const RESERVED = new Set([
    ...RESERVED_SYMBOLS,
    ...RESERVED_WORDS
]);