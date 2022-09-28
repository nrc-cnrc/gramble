import { 
    miniParse, MPAlternation, 
    MPParser, MPReserved, 
    MPSequence, MPUnreserved 
} from "./miniParser";
import { 
    AlternationGrammar, Grammar, 
    JoinGrammar, SequenceGrammar 
} from "./grammars";


const SYMBOL = [ ":" ];

const REPLACE_PARAMS = [
    "from",
    "to",
    "pre",
    "post"
]

const TEST_PARAMS = [
    "unique"
]

const RESERVED_HEADERS = new Set([
    "embed", 
    "optional", 
    //"not", 
    "hide", 
    //"reveal", 
    "equals", 
    "starts", 
    "ends", 
    "contains",
    "re",
    ...REPLACE_PARAMS,
    ...TEST_PARAMS
]);


export const BINARY_OPS_MAP: {[opName: string]: (c1: Grammar, c2: Grammar) => Grammar;} = {
    "or": (c1, c2) => new AlternationGrammar([c1, c2]),
    "concat": (c1, c2) => new SequenceGrammar([c1, c2]),
    "join": (c1, c2) => new JoinGrammar(c1, c2),
}

const BINARY_OPS = new Set(Object.keys(BINARY_OPS_MAP));

const RESERVED_OPS: Set<string> = new Set([
    "table", 
    "test", 
    "testnot",
    "replace",
    "namespace",
    ...BINARY_OPS
]);

export const RESERVED_WORDS = new Set([
    ...RESERVED_HEADERS, 
    ...RESERVED_OPS
]);

export const RESERVED = new Set([
    ...SYMBOL,
    ...RESERVED_WORDS
]);


const tokenizer = new RegExp("\\s+|(" + 
                            SYMBOL.map(s => "\\"+s).join("|") + 
                            ")");

function tokenize(text: string): string[] {
    return text.split(tokenizer).filter(
        (s: string) => s !== undefined && s !== ''
    );
}

export type Requirement = "required" | "forbidden";

export abstract class Op {

    public get siblingRequirement(): Requirement {
        return "forbidden";
    }

}

export class TableOp extends Op { }

export class NamespaceOp extends Op { }

export abstract class BinaryOp extends Op {

    public get siblingRequirement(): Requirement {
        return "required";
    }
}

export class TestOp extends BinaryOp { }

export class TestNotOp extends BinaryOp { }

export class AtomicReplaceOp extends BinaryOp { }

export class ReplaceOp extends BinaryOp {

    constructor(
        public child: SymbolOp
    ) { 
        super();
    }
}

export class BuiltInBinaryOp extends BinaryOp {
    
    constructor(
        public text: string
    ) { 
        super();
    }
}

/**
 * This is an op that holds any string that's not a reserved
 * word. If it's going to become a TST, it becomes a TstAssignment,
 * but that's not the only place we use these; it's also how
 * arbitrary symbols are handled for operators that allow these like 
 * "replace <tapename>:"
 */
export class SymbolOp extends Op {

    constructor(
        public text: string
    ) { 
        super();
    }

}

export class ErrorOp extends Op {

    constructor(
        public text: string,
        public shortMsg: string,
        public longMsg: string,
    ) { 
        super();
    }
    
}

const OP_TABLE = MPSequence<Op>(
    ["table"],
    () => new TableOp()
);

const OP_NAMESPACE = MPSequence<Op>(
    ["namespace"],
    () => new NamespaceOp()
);

const OP_TEST = MPSequence<Op>(
    ["test"],
    () => new TestOp()
);

const OP_TESTNOT = MPSequence<Op>(
    ["testnot"],
    () => new TestNotOp()
);

const OP_UNRESERVED = MPUnreserved<Op>(
    RESERVED_WORDS, 
    (s) => new SymbolOp(s)
);

const OP_ATOMIC_REPLACE = MPSequence<Op>(
    ["replace"], 
    () => new AtomicReplaceOp()
);

const OP_RESERVED_HEADER = MPReserved<Op>(
    RESERVED_HEADERS, 
    (s) => new ErrorOp(s, "Reserved word in operator", 
            "This cell has to be a symbol name or " +
            `an operator, but it's a reserved word ${s}.`)
);

const OP_RESERVED_WORD = MPReserved<Op>(
    RESERVED_WORDS, 
    (s) => new ErrorOp(s, "Reserved word in operator", 
            "This cell has to be a symbol name or " +
            `an operator, but it's a reserved word '${s}'.`)
);

const OP_REPLACE = MPSequence<Op>(
    ["replace", OP_UNRESERVED], 
    (c) => new ReplaceOp(c as SymbolOp)
);

const OP_REPLACE_ERROR = MPSequence<Op>(
    ["replace", OP_RESERVED_WORD], 
    (c) => { 
        const s = (c as ErrorOp).text;
        return new ErrorOp(s, "Reserved word in operator",
            "This replace has to be followed by a tape name, " +
            `but is instead followed by the reserved word '${s}'`);
    }
);

const OP_BINARY = MPReserved<Op>(
    BINARY_OPS, 
    (s) => new BuiltInBinaryOp(s)
);

const OP_EXPR: MPParser<Op> = MPAlternation(
    OP_TABLE, OP_NAMESPACE,
    OP_TEST, OP_TESTNOT,
    OP_ATOMIC_REPLACE, 
    OP_REPLACE, OP_REPLACE_ERROR,
    OP_BINARY,
    OP_UNRESERVED, OP_RESERVED_HEADER
);

const OP_EXPR_WITH_COLON: MPParser<Op> = MPSequence(
    [OP_EXPR, ":"],
    (op) => op
)

export function parseOp(text: string): Op {
    const trimmedText = text.trim().toLowerCase();
    const results = miniParse(tokenize, OP_EXPR_WITH_COLON, trimmedText);
    if (results.length == 0) {
        // if there are no results, the programmer made a syntax error
        return new ErrorOp(text, "Invalid operator",
                "This ends in a colon so it looks like an operator, but it cannot be parsed.")
    }
    
    if (results.length > 1) {
        // if this happens, it's an error on our part
        throw new Error(`Ambiguous, cannot uniquely parse ${text}`);
    }
    return results[0];
}