import { Gen, StringDict } from "./util";


interface MPParser<T> {

    parse(input: string[]): Gen<[T, string[]]>;
}

class DelayParser<T> implements MPParser<T> {

    public child: MPParser<T> | null = null;

    public *parse(input: string[]): Gen<[T, string[]]> {
        if (this.child == null) {
            return;
        }
        yield* this.child.parse(input);
    }

}

type StringMatcher = (s: string) => boolean;

class AtomicParser<T> implements MPParser<T> {

    constructor(
        protected matcherFunction: (s: string) => Boolean,
        protected resultConstructor: (s: string) => T
    ) { }   

    public *parse(input: string[]): Gen<[T, string[]]> {
        if (input.length == 0 || !this.matcherFunction(input[0])) {
            return;
        }
        yield [this.resultConstructor(input[0]), input.slice(1)];
    }
}

class ParensParser<T> implements MPParser<T> {

    constructor(
        protected openMatcher: (s: string) => Boolean,
        protected innerMatcher: MPParser<T>,
        protected closedMatcher: (s: string) => Boolean,
        protected resultConstructor: (child: T) => T
    ) { }   

    public *parse(input: string[]): Gen<[T, string[]]> {

        if (input.length == 0 || !this.openMatcher(input[0])) {
            return;
        }
    
        for (const [t, rem] of this.innerMatcher.parse(input.slice(1))) {
            if (rem.length == 0 || !this.closedMatcher(rem[0])) {
                return;
            }
    
            yield [t, rem.slice(1)]
        }
    }
}

class UnaryParser<T> implements MPParser<T> {

    constructor(
        protected opMatcher: (s: string) => Boolean,
        protected innerMatcher:  MPParser<T>,
        protected resultConstructor: (s: string, child: T) => T
    ) { }

    public *parse(input: string[]): Gen<[T, string[]]> {
            if (input.length == 0 || !this.opMatcher(input[0])) {
            return;
        }
        for (const [child, rem] of this.innerMatcher.parse(input.slice(1))) {
            yield [this.resultConstructor(input[0], child), rem];
        }
    }
}

class BinaryParser<T> implements MPParser<T> {

    constructor(
        protected child1Matcher:  MPParser<T>,
        protected opMatcher: (s: string) => Boolean,
        protected child2Matcher:  MPParser<T>,
        protected resultConstructor: (s: string, child1: T, child2: T) => T
    ) { }

    public *parse(input: string[]): Gen<[T, string[]]> {
        if (input.length == 0) {
            return;
        }

        for (const [t1, rem1] of this.child1Matcher.parse(input)) {
            if (rem1.length == 0 || !this.opMatcher(rem1[0])) {
                return;
            }
            for (const [t2, rem2] of this.child2Matcher.parse(rem1.slice(1))) {
                yield [this.resultConstructor(rem1[0], t1, t2), rem2];
            }
        }
    }
}

class MPAlt<T> implements MPParser<T> {

    protected children: MPParser<T>[];

    constructor(
        ...children: MPParser<T>[]
    ) { 
        this.children = children;
    }

    public *parse(input: string[]): Gen<[T, string[]]> {
        for (const child of this.children) {
            yield* child.parse(input);
        }
    }


}

export interface MPResult { }

export class MPLiteral implements MPResult {

    public text: string;

    constructor(
        text: string
    ) { 
        this.text = text.trim();
    }
}

const SYMBOL = new Set(["(", ")", "~", "|"]);

export class MPNegation implements MPResult {
    constructor(
        public text: string,
        public child: MPResult
    ) { }
}

export class MPAlternation implements MPResult {
    constructor(
        public text: string,
        public child1: MPResult,
        public child2: MPResult
    ) { }
}

var EXPR = new DelayParser<MPResult>();
var SUBEXPR = new DelayParser<MPResult>();

const LITERAL = new AtomicParser<MPResult>(
    (s) => !SYMBOL.has(s),  // what to recognize
    (s) => new MPLiteral(s)  // what to do with it
);

const PARENS = new ParensParser<MPResult>(
    (s) => s == "(",
    EXPR,
    (s) => s == ")",
    (c) => c
)

const NEGATION = new UnaryParser<MPResult>(
    (s) => s == "~",     // how to recognize the operator
    EXPR,             // how to recognize the child
    (s, c) => new MPNegation(s, c), // what to do with them
);

const ALTERNATION = new BinaryParser<MPResult>(
    SUBEXPR,             // how to recognize child1
    (s) => s == "|",     // how to recognize the operator
    EXPR,             // how to recognize child2
    (s, c1, c2) => new MPAlternation(s, c1, c2), // what to do with them
)

SUBEXPR.child = new MPAlt<MPResult>(LITERAL, PARENS);
EXPR.child = new MPAlt<MPResult>(NEGATION, ALTERNATION, SUBEXPR);

const tokenizer = new RegExp("(" + 
                            [...SYMBOL].map(s => "\\"+s).join("|") + 
                            ")");

function tokenize(text: string): string[] {
    return text.split(tokenizer).filter(
        (s: string) => s !== undefined && s !== ''
    );
}

export function parseBooleanCell(text: string): MPResult {
    const pieces = tokenize(text);
    var result = [... EXPR.parse(pieces)];
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