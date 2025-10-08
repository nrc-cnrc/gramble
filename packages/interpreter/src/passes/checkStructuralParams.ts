import { 
    ErrorOp,
    SymbolOp,
    childMustBeGrid,
    siblingRequired,
} from "../ops.js";
import { Err, Message, Msg, Warn } from "../utils/msgs.js";
import { Pass } from "../passes.js";
import { 
    TstOp, 
    TstEmpty,
    TstGrid,
    TST
} from "../tsts.js";
import { PassEnv } from "../components.js";

/**
 * This pass goes through and make sure that TstOps have 
 * the structural parameters (i.e. .sibling and .child) that they
 * need to be interpreted, and also ensures that these are the
 * right types (e.g., that they're grids when they need to be 
 * grids, op when they need to be op, that they're not
 * assignments, etc.)
 */

export class CheckStructuralParams extends Pass<TST,TST> {

    public transformAux(t: TST, env: PassEnv): Msg<TST> {
        
        if (!(t instanceof TstOp)) {
            return t.mapChildren(this, env);
        }
        
        const mapped = t.mapChildren(this, env) as Msg<TstOp>;
        return mapped.bind(t => {
    
            const msgs: Message[] = [];

            // no ops allow assignments as siblings or child, so 
            // if it's going to be an assignment, create an error 
            // and replace it with its child
            if (t.sibling instanceof TstOp 
                 && t.sibling.op instanceof SymbolOp) {
                Err(`Wayward assignment: '${t.sibling.op.text}'.`,
                    `This looks like an assignment to '${t.sibling.op.text}', but ` +
                    "isn't in an appropriate position for one and will be ignored.")
                    .localize(t.sibling.pos).msgTo(msgs);
                t.sibling = t.sibling.child;
            }
        
            if (t.child instanceof TstOp && 
                t.child.op instanceof SymbolOp) {
                Err(`Wayward assignment: '${t.child.op.text}'`,
                    `This looks like an assignment to '${t.child.op.text}', but ` +
                    "isn't in an appropriate position for one and will be ignored.")
                    .localize(t.child.pos).msgTo(msgs);
                t.child = t.child.child;
            }

            // don't bother doing structural param checks on ErrorOps
            if (t.op instanceof ErrorOp) {
                return this.handleError(t, env).msg(msgs);
            }

            // assignments have some special behavior, like that they
            // don't disappear if they don't have a child
            if (t.op instanceof SymbolOp) {
                return this.handleAssignment(t, env).msg(msgs);
            }

            return this.handleOp(t, env).msg(msgs);
        });
    }

    // Note: In handleAssignment, handleError and handleOp, we must not "throw",
    // error/warning msgs; instead we must "return" them. This is because the
    // function (passed to bind) that calls them collects errors/warnings.
    // If we throw an error msg from, say, handleOp, then any messages already
    // accumulated are dropped on the floor.

    public handleAssignment(t: TstOp, env: PassEnv): Msg<TST> {
        
        const msgs: Message[] = [];

        // siblings of assignments don't get assigned to anything
        if (!(t.sibling instanceof TstEmpty)) {
                Warn("This content does not get " +
                    "assigned to anything and will be ignored.")
                    .localize(t.sibling.pos).msgTo(msgs);
        }

        // assignment needs something in its .child param.  if
        // it's empty, issue a warning.
        if (t.child instanceof TstEmpty) {
            return t.warn("This symbol will not contain any content.").msg(msgs);
        }

        return t.msg(msgs);

    }

    public handleError(t: TstOp, env: PassEnv): TST {
        return (t.sibling instanceof TstEmpty)
                        ? t.child
                        : t.sibling
    }

    public handleOp(t: TstOp, env: PassEnv): Msg<TST> {

        // if the op requires a grid to the right, but doesn't have one,
        // issue an error, and return the sibling as the new value.
        if (childMustBeGrid(t.op) == "required"
                && !(t.child instanceof TstGrid)) {
            if (t.child instanceof TstEmpty) {
                return t.sibling.err(`'${t.op.tag}' operator requires non-empty grid`,
                            `This '${t.op.tag}' operator requires a non-empty grid to ` +
                            "the right, but none was found.")
            }
            return t.sibling.err(`'${t.op.tag}' operator requires grid, ` +
                        `not '${t.child.cell.text.trim()}'`,
                        `This '${t.op.tag}' operator requires a grid to the right, ` +
                        `but has another operator instead: '${t.child.cell.text.trim()}'.`)
        }

        const trimmedText = t.cell.text.trim();
        // if the op must have a sibling, but has neither a sibling
        // nor a child, issue an error, and return empty.
        if (siblingRequired(t.op) == "required" 
                && t.sibling instanceof TstEmpty
                && t.child instanceof TstEmpty) {
            return new TstEmpty().err(`Missing content for '${trimmedText}'.`,
                            `The '${trimmedText}' operator requires content above it `  +
                            "and to the right, but both are empty or erroneous.")
                        .localize(t.sibling.pos);
        }

        // if the op must have a sibling and doesn't, issue an error,
        // and return empty
        if (siblingRequired(t.op) == "required"
                && t.sibling instanceof TstEmpty) {
            return new TstEmpty().err(`Missing content for '${trimmedText}'`,
                            `The '${trimmedText}' operator requires content above it, ` +
                            "but it's empty or erroneous.")
                        .localize(t.sibling.pos);
        }

        // all operators need something in their .child param.  if
        // it's empty, issue a warning, and return the sibling as the new value.
        if (t.child instanceof TstEmpty) {
            env.logDebug("***Warning: This will not contain any content.");
            return t.sibling.warn("This will not contain any content.")
                            .localize(t.pos);
        }

        // if there's something in the sibling, but it's forbidden,
        // warn about it.
        if (siblingRequired(t.op) == "forbidden"
                && !(t.sibling instanceof TstEmpty)) {
            throw t.warn("This content does not get assigned to anything " +
                        "and will be ignored.")
                    .localize(t.sibling.pos);
        }

        return t.msg([]);
    }

}
