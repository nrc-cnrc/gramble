import { 
    TstOp,
    TstAssignment, TstBinary, 
    TstBinaryOp, 
    TstComponent, TstEmpty,
    TstNamespace,
    TstResult, 
    TstTableOp, TstTransform,
    TstNegativeUnitTest, TstReplace, 
    TstReplaceTape, TstUnitTest 
} from "./tsts";
import { Err, Result } from "./msgs";
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


const BINARY_OPS_MAP: {[opName: string]: (c1: Grammar, c2: Grammar) => Grammar;} = {
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

    public get isBinary(): boolean {
        return false;
    }

    public abstract transform(t: TstOp): TstResult;
}

export class TableOp extends Op {

    public transform(t: TstOp): TstResult {
        return new TstTableOp(t.cell, t.sibling, t.child).msg();
    }
}

export class NamespaceOp extends Op {

    public transform(t: TstOp): TstResult {
        const children: TstComponent[] = [];
        let currentChild: TstComponent = t.child;
        while (currentChild instanceof TstBinary) {
            const sib = currentChild.sibling;
            currentChild.sibling = new TstEmpty();
            children.push(currentChild);
            currentChild = sib;
        }
        children.reverse();
        return new TstNamespace(t.cell, children).msg();
    }

}

export abstract class BinaryOp extends Op {

    public get isBinary(): boolean {
        return true;
    }
}

export class TestOp extends BinaryOp {
    public transform(t: TstOp): TstResult {
        return new TstUnitTest(t.cell, t.sibling, t.child).msg();
    }

}

export class TestNotOp extends BinaryOp {
    public transform(t: TstOp): TstResult {
        return new TstNegativeUnitTest(t.cell, t.sibling, t.child).msg();
    }
}

export class AtomicReplaceOp extends BinaryOp {
    public transform(t: TstOp): TstResult {
        return new TstReplace(t.cell, t.sibling, t.child).msg();
    }
}

export class ReplaceOp extends BinaryOp {

    constructor(
        public child: UnreservedOp
    ) { 
        super();
    }

    public transform(t: TstOp): TstResult {
        const tapeName = this.child.text;
        return new TstReplaceTape(t.cell, tapeName, 
                                  t.sibling, t.child).msg();
    }
}

export class BuiltInBinaryOp extends BinaryOp {
    
    constructor(
        public text: string
    ) { 
        super();
    }

    public transform(t: TstOp): TstResult {
        const op = BINARY_OPS_MAP[this.text];
        return new TstBinaryOp(t.cell, op, t.sibling, t.child).msg();
    }
}

export class UnreservedOp extends Op {

    constructor(
        public text: string
    ) { 
        super();
    }

    public transform(t: TstOp): TstResult {
        // This only gets called if the UnreservedOp is at the top
        // level.  Otherwise, the UnreservedOp is only being used
        // to store a string (like a tape name)
        return new TstAssignment(t.cell, t.sibling, t.child).msg();
    }
}

export class ErrorOp extends Op {

    constructor(
        public shortMsg: string,
        public longMsg: string
    ) { 
        super();
    }

    public transform(t: TstOp): TstResult {
        return t.msg().err(this.shortMsg, this.longMsg);            
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
    (s) => new ErrorOp("Reserved word in operator", 
            "This cell has to be a symbol name or " +
            `an operator, but it's a reserved word ${s}.`)
);

const OP_BINARY = MPReserved<Op>(
    BINARY_OPS, 
    (s) => new BuiltInBinaryOp(s)
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

export function parseOp(text: string): Op {
    const trimmedText = text.trim().toLowerCase();
    const results = miniParse(tokenize, OP_EXPR_WITH_COLON, trimmedText);
    if (results.length == 0) {
        // if there are no results, the programmer made a syntax error
        return new ErrorOp("Invalid operator",
                "This ends in a colon so it looks like an operator, but it cannot be parsed.")
    }
    
    if (results.length > 1) {
        // if this happens, it's an error on our part
        throw new Error(`Ambiguous, cannot uniquely parse ${text}`);
    }
    return results[0];
}