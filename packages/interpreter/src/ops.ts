import { Component } from "./components.js";
import { 
    miniParse, MiniParseEnv, 
    MPAlt, MPParser, 
    MPSequence, MPUnreserved 
} from "./miniParser.js";
import { exhaustive } from "./utils/func.js";
import { Msg } from "./utils/msgs.js";
import { 
    REPLACE_PARAMS, REQUIRED_REPLACE_PARAMS, 
    ALL_RESERVED, RESERVED_SYMBOLS, 
    isValidSymbol, BLANK_PARAM_SET, TEST_PARAM_SET 
} from "./utils/reserved.js";

export type Requirement = "required" | "forbidden";

export type Op = TableOp
               | CollectionOp
               | TestOp
               | TestNotOp
               | ReplaceOp
               | OrOp
               | JoinOp
               | SymbolOp
               | ErrorOp;

export class TableOp extends Component { 
    public readonly tag = "table";
}

export class CollectionOp extends Component { 
    public readonly tag = "collection";
}

export class TestOp extends Component { 
    public readonly tag = "test";
}

export class TestNotOp extends Component { 
    public readonly tag = "testnot";
}

export class ReplaceOp extends Component {
    public readonly tag = "replace";

    constructor(
        public child: SymbolOp
    ) { 
        super();
    }
}

export class OrOp extends Component { 
    public readonly tag = "or";
}

export class JoinOp extends Component { 
    public readonly tag = "join";
}

/**
 * This is an op that holds any string that's not a reserved
 * word. If it's going to become a TST, it becomes a TstAssignment,
 * but that's not the only place we use these; it's also how
 * arbitrary symbols are handled for operators that allow these like 
 * "replace <tapename>:"
 */
export class SymbolOp extends Component {
    public readonly tag = "symbol";

    constructor(
        public text: string
    ) { 
        super();
    }
}

export class ErrorOp extends Component {
    public readonly tag = "error";
}

const OP_TABLE = MPSequence<Op>(
    ["table"],
    () => new TableOp()
);

const OP_COLLECTION = MPSequence<Op>(
    ["collection"],
    () => new CollectionOp()
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
    (s) => {
        if (isValidSymbol(s)) {
            return new SymbolOp(s)
        } else {
            throw new ErrorOp().err(
                `Invalid identifier: '${s}'`, 
                `'${s}' looks like it should be an identifier, ` +
                "but it contains an invalid symbol."
            );
        }
    } 
);

const OP_REPLACE = MPSequence<Op>(
    ["replace", OP_UNRESERVED], 
    ([child]) => new ReplaceOp(child as SymbolOp)
);

const OP_OR = MPSequence<Op>(
    ["or"], 
    () => new OrOp()
);

const OP_JOIN = MPSequence<Op>(
    ["join"], 
    () => new JoinOp()
);

const OP_SUBEXPR: MPParser<Op> = MPAlt(
    OP_TABLE, OP_COLLECTION,
    OP_TEST, OP_TESTNOT,
    OP_REPLACE,
    OP_OR, OP_JOIN
);

const OP_SUBEXPR_WITH_COLON: MPParser<Op> = MPSequence(
    [OP_SUBEXPR, ":"],
    ([child]) => child
)

const OP_ASSIGNMENT = MPSequence(
    [OP_UNRESERVED, "="],
    ([child]) => child
);

const OP_EXPR = MPAlt(
    OP_ASSIGNMENT,
    OP_SUBEXPR_WITH_COLON
);

export function parseOp(text: string): Msg<Op> {
    const trimmedText = text.trim();

    const env = new MiniParseEnv(RESERVED_SYMBOLS, ALL_RESERVED);
    const results = miniParse(env, OP_EXPR, trimmedText);
    if (results.length == 0) {
        // if there are no results, the programmer made a syntax error
        return new ErrorOp().err(`Invalid operator: '${trimmedText}'`,
                                `'${trimmedText}' looks like an operator, ` +
                                "but it cannot be parsed as one");
    }
    
    if (results.length > 1) {
        // if this happens, it's an error on our part
        throw new Error(`Ambiguous, cannot uniquely parse '${trimmedText}'`);
    }
    return results[0];
}

export function siblingRequired(op: Op): Requirement {
    switch (op.tag) {

        // if something is above one of these, it's an error
        case "table": 
        case "collection":
        case "symbol": 
        case "error":      return "forbidden";

        // each of these requires something above, to apply to
        case "test":
        case "testnot":
        case "replace":
        case "or": 
        case "join":       return "required";
        default: exhaustive(op);
    }
}

export function childMustBeGrid(op: Op): Requirement {
    switch (op.tag) {
        // these have to have a grid child, not another op
        case "table":
        case "test":
        case "testnot": 
        case "replace":    return "required";

        // if the child is a grid, we automatically wrap
        // a table op around it
        case "collection":
        case "or": 
        case "join":  
        case "symbol":  
        case "error":      return "forbidden";
        default: exhaustive(op);
    }
}

export function allowedParams(op: Op): Set<string> {
    switch (op.tag) {
        // most ops only allow the __ param
        case "table": 
        case "collection":
        case "or":  
        case "join": 
        case "symbol": 
        case "error":      return BLANK_PARAM_SET;

        // test allows "unique" and __
        case "test":
        case "testnot":    return TEST_PARAM_SET;

        // replace only allows from/to/context
        case "replace":    return REPLACE_PARAMS;
        default: exhaustive(op);
    }
}

export function requiredParams(op: Op): Set<string> {
    switch (op.tag) {

        // most operators only require __
        case "table": 
        case "collection": 
        case "test":  
        case "testnot":  
        case "or": 
        case "join":  
        case "symbol":  
        case "error":      return BLANK_PARAM_SET;
        
        // replace requires from/to/context
        case "replace":    return REQUIRED_REPLACE_PARAMS;

        default: exhaustive(op);
    }
}


/**
 * This is for operators that require a perfect parameterization
 * to execute at all, lest there be unanticipated effects.
 */
export function paramsMustBePerfect(op: Op): boolean {
    switch (op.tag) {
        // if a param is imperfect, ignore that column, but don't
        // throw everything else out
        case "table": 
        case "collection": 
        case "or": 
        case "join": 
        case "symbol": 
        case "error":      return false;
        
        // things can go wrong if not everything is perfect
        case "test": 
        case "testnot": 
        case "replace":    return true;

        default: exhaustive(op);
    }
}

/**
 * This is for Test and TestNot, which require every parameter
 * in their child to be a literal
 */
export function paramsMustBeLiteral(op: Op): boolean {
    switch (op.tag) {
        // most ops allow anything
        case "table":   
        case "collection": 
        case "replace": 
        case "or":  
        case "join":  
        case "symbol":   
        case "error":      return false;

        // tests don't allow fancy params alternations,
        // it's literals or it's failure
        case "test": 
        case "testnot":    return true;
        default: exhaustive(op);
    }
}

export function autoID(x: Op): string {
    const elements = [ x.tag,
                      ("text" in x) ? x.text as string : "",
                      ("child" in x) ? autoID(x.child as Op) : "" ]
    const str = elements.filter(s => s.length > 0).join(" ");
    return "(" + str + ")";
}
