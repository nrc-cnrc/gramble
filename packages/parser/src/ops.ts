
import { AlternationGrammar, Grammar, JoinGrammar, SequenceGrammar } from "./grammars";
import { 
    miniParse, MPAlternation, MPComment, 
    MPDelay, MPParser, MPReserved, 
    MPSequence, MPUnreserved 
} from "./miniParser";
import { 
    TstAssignment, TstBinaryOp, TstEnclosure, TstNamespace, 
    TstNegativeUnitTest, TstReplace, TstReplaceTape, TstTableOp, TstUnitTest 
} from "./tsts";
import { Cell } from "./util";


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
    "maybe", 
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

const BINARY_OPS = new Set([
    "or",
    "concat",
    "join"
]);

const RESERVED_OPS: Set<string> = new Set([
    "table", 
    "test", 
    "testnot",
    "replace",
    "namespace",
    ...BINARY_OPS
]);

const RESERVED_WORDS = new Set([
    ...SYMBOL, 
    ...RESERVED_HEADERS, 
    ...RESERVED_OPS
]);


const tokenizer = new RegExp("\\s+|(" + 
                            SYMBOL.map(s => "\\"+s).join("|") + 
                            ")");

function tokenize(text: string): string[] {
    return text.split(tokenizer).filter(
        (s: string) => s !== undefined && s !== ''
    );
}

export abstract class Op {
    public abstract toTST(cell: Cell): TstEnclosure;
}

export class TableOp {
    public toTST(cell: Cell): TstEnclosure {
        return new TstTableOp(cell);
    }
}

export class NamespaceOp {
    public toTST(cell: Cell): TstEnclosure {
        return new TstNamespace(cell);
    }
}

export class TestOp {
    public toTST(cell: Cell): TstEnclosure {
        return new TstUnitTest(cell);
    }
}

export class TestNotOp {
    public toTST(cell: Cell): TstEnclosure {
        return new TstNegativeUnitTest(cell);
    }
}

export class AtomicReplaceOp {
    public toTST(cell: Cell): TstEnclosure {
        return new TstReplace(cell);
    }
}

export class ReplaceOp {

    constructor(
        public child: UnreservedOp
    ) { }

    public toTST(cell: Cell): TstEnclosure {
        const tapeName = this.child.text;
        return new TstReplaceTape(cell, tapeName);
    }
}

export class BinaryOp {
    public toTST(cell: Cell): TstEnclosure {
        return new TstBinaryOp(cell);
    }
}

export class UnreservedOp {

    constructor(
        public text: string
    ) { }

    public toTST(cell: Cell): TstEnclosure {
        // This only gets called if the UnreservedOp is at the top
        // level.  Otherwise, the UnreservedOp is only being used
        // to store a string (like a tape name)
        return new TstAssignment(cell);
    }
}

export class ReservedErrorOp {

    constructor(
        public text: string
    ) { }

    public toTST(cell: Cell): TstEnclosure {
        
        // oops, assigning to a reserved word
        cell.message({
            type: "error",
            shortMsg: "Reserved word as operator", 
            longMsg: "This cell has to be a symbol name or an operator, but it's a reserved word."
        });            

        // treating it as a TstEnclosure will at least
        // get its siblings/children error checked too
        return new TstEnclosure(cell);
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
    (s) => new UnreservedOp(s)
);

const OP_ATOMIC_REPLACE = MPSequence<Op>(
    ["replace"], 
    () => new AtomicReplaceOp()
);

const OP_REPLACE = MPSequence<Op>(
    ["replace", OP_UNRESERVED], 
    (c) => new ReplaceOp(c as UnreservedOp)
);

const OP_RESERVED = MPReserved<Op>(
    RESERVED_HEADERS, 
    (s) => new ReservedErrorOp(s)
);

const OP_BINARY = MPReserved<Op>(
    BINARY_OPS, 
    () => new BinaryOp()
);

const OP_EXPR: MPParser<Op> = MPAlternation(
    OP_TABLE, OP_NAMESPACE,
    OP_TEST, OP_TESTNOT,
    OP_ATOMIC_REPLACE, OP_REPLACE,
    OP_BINARY,
    OP_UNRESERVED, OP_RESERVED
);

const OP_EXPR_WITH_COLON: MPParser<Op> = MPSequence(
    [OP_EXPR, ":"],
    (op) => op
)

export function parseOpCell(text: string): Op {
    const trimmedText = text.trim().toLowerCase();
    const results = miniParse(tokenize, OP_EXPR_WITH_COLON, trimmedText);
    if (results.length == 0) {
        // if there are no results, the programmer made a syntax error
        throw new Error(`Cannot parse operator ${text}`);
    }
    if (results.length > 1) {
        // if this happens, it's an error on our part
        throw new Error(`Ambiguous, cannot uniquely parse ${text}`);
    }
    return results[0];
}