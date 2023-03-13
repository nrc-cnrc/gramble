import { 
    miniParse, MiniParseEnv, MPAlt, 
    MPParser, MPReserved, 
    MPSequence, MPUnreserved 
} from "./miniParser";
import { Err, Msgs, Result } from "./msgs";
import { REPLACE_PARAMS, REQUIRED_REPLACE_PARAMS, RESERVED, RESERVED_SYMBOLS, TEST_PARAMS } from "./reserved";
import { isValidSymbolName } from "./util";

export const BLANK_PARAM: string = "__";

export type Requirement = "required" | "forbidden";

export abstract class Op {

    public abstract get id(): string;

    public msg(msgs: Msgs = []): Result<Op> {
        return new Result(this, msgs);
    }

    public get siblingReq(): Requirement {
        return "forbidden";
    }

    public get childGridReq(): Requirement {
        return "forbidden";
    }

    public get allowedNamedParams(): Set<string> {
        return new Set([BLANK_PARAM]);
    }
    
    public get requiredNamedParams(): Set<string> {
        return new Set([BLANK_PARAM]);
    }

    /**
     * This is for operators that require a perfect parameterization
     * to execute at all, lest there be unanticipated effects.
     */
    public get requirePerfectParams(): boolean {
        return false;
    }

    /**
     * This is for Test and TestNot, which require every parameter
     * in their child to be a literal
     */
    public get requireLiteralParams(): boolean {
        return false;
    }

}

export class TableOp extends Op { 

    public get id(): string {
        return "table";
    }

    public get childGridReq(): Requirement {
        return "required";
    }
}

export class CollectionOp extends Op { 

    public get id(): string {
        return "collection";
    }
}

export abstract class SpecialOp extends Op {

    public get siblingReq(): Requirement {
        return "required";
    }

    public get childGridReq(): Requirement {
        return "required";
    }

    public get requirePerfectParams(): boolean {
        return true;
    }

}

export class TestOp extends SpecialOp { 

    public get id(): string {
        return "test";
    }

    public get allowedNamedParams(): Set<string> {
        return new Set([BLANK_PARAM, ...TEST_PARAMS]);
    }
    
    public get requireLiteralParams(): boolean {
        return true;
    }

}

export class TestNotOp extends SpecialOp { 

    public get id(): string {
        return "testnot";
    }

    public get allowedNamedParams(): Set<string> {
        return new Set([BLANK_PARAM, ...TEST_PARAMS]);
    }
    
    public get requireLiteralParams(): boolean {
        return true;
    }
}

export class ReplaceOp extends SpecialOp { 

    public get id(): string {
        return "replace";
    }

    public get requiredNamedParams(): Set<string> {
        return REQUIRED_REPLACE_PARAMS;
    }

    public get allowedNamedParams(): Set<string> {
        return REPLACE_PARAMS;
    }

}

export class ReplaceTapeOp extends SpecialOp {

    constructor(
        public child: SymbolOp
    ) { 
        super();
    }

    public get id(): string {
        return `replace[${this.child.id}]`;
    }

    public get requiredNamedParams(): Set<string> {
        return REQUIRED_REPLACE_PARAMS;
    }

    public get allowedNamedParams(): Set<string> {
        return REPLACE_PARAMS;
    }

}

abstract class BinaryOp extends Op {
    public get siblingReq(): Requirement {
        return "required";
    }
}

export class OrOp extends BinaryOp { 

    public get id(): string {
        return "or";
    }

}
export class JoinOp extends BinaryOp { 

    public get id(): string {
        return "join";
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

    public get id(): string {
        return this.text;
    }

}

export class ErrorOp extends Op {

    constructor(
        public text: string
    ) { 
        super();
    }

    public get id(): string {
        return "ERR";
    }

    
}

const OP_TABLE = MPSequence<Op>(
    ["table"],
    () => new TableOp().msg()
);

const OP_COLLECTION = MPSequence<Op>(
    ["collection"],
    () => new CollectionOp().msg()
);

const OP_TEST = MPSequence<Op>(
    ["test"],
    () => new TestOp().msg()
);

const OP_TESTNOT = MPSequence<Op>(
    ["testnot"],
    () => new TestNotOp().msg()
);

const OP_UNRESERVED = MPUnreserved<Op>(
    (s) => {
        if (isValidSymbolName(s)) {
            return new SymbolOp(s).msg()
        } else {
            return new ErrorOp(s).msg([Err( 
                `Invalid tape name`, 
                `${s} looks like it should be a tape name, but tape names should start with letters or _`
            )]);
        }
    } 
);

const OP_REPLACE = MPSequence<Op>(
    ["replace"], 
    () => new ReplaceOp().msg()
);

const OP_REPLACE_TAPE = MPSequence<Op>(
    ["replace", OP_UNRESERVED], 
    (child) => child.bind(c => new ReplaceTapeOp(c as SymbolOp))
);

const OP_OR = MPSequence<Op>(
    ["or"], 
    () => new OrOp().msg()
);

const OP_JOIN = MPSequence<Op>(
    ["join"], 
    () => new JoinOp().msg()
);

const OP_EXPR: MPParser<Op> = MPAlt(
    OP_TABLE, OP_COLLECTION,
    OP_TEST, OP_TESTNOT,
    OP_REPLACE, 
    OP_REPLACE_TAPE,
    OP_OR, OP_JOIN,
    OP_UNRESERVED
);

const OP_EXPR_WITH_COLON: MPParser<Op> = MPSequence(
    [OP_EXPR, ":"],
    (op) => op
)

export function parseOp(text: string): Result<Op> {
    const trimmedText = text.trim();

    const env = new MiniParseEnv(new Set(RESERVED_SYMBOLS), RESERVED);
    const results = miniParse(env, OP_EXPR_WITH_COLON, trimmedText);
    if (results.length == 0) {
        // if there are no results, the programmer made a syntax error
        return new ErrorOp(text).msg([Err("Invalid operator",
                "This ends in a colon so it looks like an operator, but it cannot be parsed.")]);
    }
    
    if (results.length > 1) {
        // if this happens, it's an error on our part
        throw new Error(`Ambiguous, cannot uniquely parse ${text}`);
    }
    return results[0];
}