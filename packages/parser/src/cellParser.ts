import { Gen } from "./util";

type MPParser<T> = (input: string[]) => Gen<[T, string[]]>

function Delay<T>(child: () => MPParser<T>): MPParser<T> {
    return function*(input: string[]) {
        yield* child()(input);
    }
}

function Unreserved<T>(reserved: Set<string>, constr: (s: string) => T): MPParser<T> {
    return function*(input: string[]) {
        if (input.length == 0 || reserved.has(input[0])) {
            return;
        }
        yield [constr(input[0]), input.slice(1)];
    }
}

function Sequence<T>(children: (string | MPParser<T>)[], constr: (...children: T[]) => T): MPParser<T> {
    return function*(input: string[]) {

        var results: [T[], string[]][] = [[[], input]];

        for (const child of children) {
            var newResults: [T[], string[]][] = [];
            for (const [existingOutputs, existingRemnant] of results) {
                if (typeof child == "string") {
                    if (existingRemnant.length > 0 && existingRemnant[0] == child) {
                        newResults.push([existingOutputs, existingRemnant.slice(1)]);
                    }
                    continue;
                }
    
                for (const [output2, remnant2] of child(existingRemnant)) {
                    const newOutput: T[] = [...existingOutputs, output2];
                    newResults.push([newOutput, remnant2]);
                }
            }
            results = newResults;
        }  
        for (const [output, remnant] of results) {
            yield [constr(...output), remnant];
        }
    }
}

function Alternation<T>(...children: MPParser<T>[]): MPParser<T> {
    return function*(input: string[]) {
        for (const child of children) {
            yield* child(input);
        }
    }
}

function parse<T>(
    tokenizer: (text: string) => string[],
    grammar: MPParser<T>,
    text: string
): T {
    const pieces = tokenizer(text);
    var result = [... grammar(pieces)];
    // result is a list of [header, remaining_tokens] pairs.  
    // we only want results where there are no remaining tokens.
    result = result.filter(([t, r]) => r.length == 0);

    if (result.length == 0) {
        // if there are no results, the programmer made a syntax error
        throw new Error(`Cannot parse: ${text}`);
    }
    if (result.length > 1) {
         // the grammar above should be unambiguous, so we shouldn't get 
         // multiple results, but just in case...
        throw new Error(`Ambiguous, cannot parse: ${text}.` +
                " This probably isn't your fault.");
    }
    return result[0][0];
}

/**
 * The boolean cell grammar (e.g. ~(1SG|2SG)) is below
 */

export interface MPResult { }

export class MPUnreserved implements MPResult {
    constructor(
        public text: string
    ) { 
        this.text = text.trim();
    }
}

export class MPNegation implements MPResult {
    constructor(
        public child: MPResult
    ) { }
}

export class MPAlternation implements MPResult {
    constructor(
        public child1: MPResult,
        public child2: MPResult
    ) { }
}

var EXPR: MPParser<MPResult> = Delay(() =>
    Alternation(NEGATION, ALTERNATION, SUBEXPR)
);

var SUBEXPR: MPParser<MPResult> = Delay(() =>
    Alternation(UNRESERVED, PARENS)
);

const RESERVED = new Set(["(", ")", "~", "|"]);
const UNRESERVED = Unreserved<MPResult>(RESERVED, (s) => new MPUnreserved(s));

const PARENS = Sequence(
    ["(", EXPR, ")"],
    (child) => child 
)

const NEGATION = Sequence(
    ["~", EXPR],
    (child) => new MPNegation(child)
);

const ALTERNATION = Sequence(
    [SUBEXPR, "|", EXPR],
    (c1, c2) => new MPAlternation(c1, c2)
)

const tokenizer = new RegExp("(" + 
                            [...RESERVED].map(s => "\\"+s).join("|") + 
                            ")");

function tokenize(text: string): string[] {
    return text.split(tokenizer).filter(
        (s: string) => s !== undefined && s !== ''
    );
}

export function parseBooleanCell(text: string): MPResult {
    return parse(tokenize, EXPR, text);
}


