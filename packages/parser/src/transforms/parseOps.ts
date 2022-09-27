import { 
    TstAnonymousOp,
    TstAssignment, TstBinary, 
    TstBinaryOp, 
    TstComponent, TstEmpty,
    TstNamespace,
    TstResult, 
    TstTableOp, TstTransform,
    TstNegativeUnitTest, TstReplace, 
    TstReplaceTape, TstUnitTest 
} from "../tsts";
import { Err, Msgs, Result } from "../msgs";
import { TransEnv } from "../transforms";
import { 
    miniParse, MPAlternation, 
    MPParser, MPReserved, 
    MPSequence, MPUnreserved 
} from "../miniParser";
import { AlternationGrammar, Grammar, JoinGrammar, SequenceGrammar } from "../grammars";

export class ParseOps extends TstTransform {

    public get desc(): string {
        return "Parsing operators";
    }

    public transform(t: TstComponent, env: TransEnv): TstResult {

        switch(t.constructor) {
            case TstAnonymousOp:
                return this.transformAnonymous(t as TstAnonymousOp, env);
            default:
                return t.transform(this, env);
        }
    }

    public transformAnonymous(t: TstAnonymousOp, env: TransEnv): TstResult {

        const [result, msgs] = t.transform(this, env)
                                .destructure() as [TstAnonymousOp, Msgs];
        
        return parseAndTransform(result).msg(msgs);
    }
}



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

interface Op {
    transform(t: TstAnonymousOp): TstResult;
}

export class TableOp implements Op {

    public transform(t: TstAnonymousOp): TstResult {
        return new TstTableOp(t.cell, t.sibling, t.child).msg();
    }
}

export class NamespaceOp implements Op {

    public transform(t: TstAnonymousOp): TstResult {
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

export class TestOp implements Op {
    public transform(t: TstAnonymousOp): TstResult {
        return new TstUnitTest(t.cell, t.sibling, t.child).msg();
    }

}

export class TestNotOp implements Op {
    public transform(t: TstAnonymousOp): TstResult {
        return new TstNegativeUnitTest(t.cell, t.sibling, t.child).msg();
    }
}

export class AtomicReplaceOp implements Op {
    public transform(t: TstAnonymousOp): TstResult {
        return new TstReplace(t.cell, t.sibling, t.child).msg();
    }
}

export class ReplaceOp implements Op {

    constructor(
        public child: UnreservedOp
    ) { }

    public transform(t: TstAnonymousOp): TstResult {
        const tapeName = this.child.text;
        return new TstReplaceTape(t.cell, tapeName, 
                                  t.sibling, t.child).msg();
    }
}

export class BinaryOp implements Op {
    
    constructor(
        public text: string
    ) { }

    public transform(t: TstAnonymousOp): TstResult {
        const op = BINARY_OPS_MAP[this.text];
        return new TstBinaryOp(t.cell, op, t.sibling, t.child).msg();
    }
}

export class UnreservedOp implements Op {

    constructor(
        public text: string
    ) { }

    public transform(t: TstAnonymousOp): TstResult {
        // This only gets called if the UnreservedOp is at the top
        // level.  Otherwise, the UnreservedOp is only being used
        // to store a string (like a tape name)
        return new TstAssignment(t.cell, t.sibling, t.child).msg();
    }
}

export class ReservedErrorOp implements Op {

    constructor(
        public text: string
    ) { }

    public transform(t: TstAnonymousOp): TstResult {
        return t.msg().err("Reserved word in operator", 
                    "This cell has to be a symbol name or " +
                    " an operator, but it's a reserved word.");            
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
    (s) => new BinaryOp(s)
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

export function parseAndTransform(t: TstAnonymousOp): Result<TstComponent> {
    const trimmedText = t.text.trim().toLowerCase();
    const results = miniParse(tokenize, OP_EXPR_WITH_COLON, trimmedText);
    if (results.length == 0) {
        // if there are no results, the programmer made a syntax error
        return new TstEmpty().msg([Err(
            "Invalid operator",
            "This cell ends in a colon so it appears to " +
            " be an operator, but it cannot be parsed as one.",
            t.cell.pos)]);
    }
    
    if (results.length > 1) {
        // if this happens, it's an error on our part
        throw new Error(`Ambiguous, cannot uniquely parse ${t.text}`);
    }
    return results[0].transform(t);
}