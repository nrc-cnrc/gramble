import { 
    AutoTableOp,
    ErrorOp,
    SymbolOp,
    TableOp,
    childMustBeGrid,
    siblingRequired,
} from "../ops.js";
import { Err, Message, Msg, Warn } from "../utils/msgs.js";
import { Pass } from "../passes.js";
import { 
    TST,
    TstEmpty,
    TstGrid,
    TstOp,
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
        const msgs: Message[] = [];
        let result: TST = t;

        if (t.op instanceof TableOp || t.op instanceof AutoTableOp) {
            // Silently drop an extra table op if it's an AutoTableOp, or issue
            // a wayward table op error if its a TableOp.
            if (t.child instanceof TstOp && t.child.op instanceof AutoTableOp ) {
                t.child = t.child.child;
            } else if (t.child instanceof TstOp && t.child.op instanceof TableOp ) {
                Err(`Wayward 'table' operator`,
                    "A 'table' operator cannot appear to the right of another " +
                    "'table' operator; the second 'table' operator will be ignored.")
                    .localize(t.child.pos).msgTo(msgs);
                t.child = t.child.child;
            }
        }

        // if the op requires a grid to the right, but doesn't have one,
        // issue an error, and return the sibling as the new value.
        if (childMustBeGrid(t.op) == "required") {
            if (t.child instanceof TstEmpty || t.child instanceof TstGrid) {
                let emptyGrid = true;
                if (t.child instanceof TstGrid) {
                    const headerRow = (t.child as TstGrid).rows[0];
                    for (const c of headerRow.content) {
                        if(!c.cell.text.trim().startsWith('%')) {
                            emptyGrid = false;
                            break;
                        }
                    }
                }
                if (emptyGrid) {
                    Err(`'${t.op.tag}' operator requires non-empty grid`,
                        `This '${t.op.tag}' operator requires a non-empty grid to ` +
                        "the right, but none was found.")
                        .msgTo(msgs);
                    result = t.sibling;
                }
            } else {
                const content = t.child.cell.text.trim();
                Err(`'${t.op.tag}' operator requires grid, not '${content}'`,
                    `This '${t.op.tag}' operator requires a grid to the right, ` +
                    `but has another operator instead: '${content}'.`)
                    .msgTo(msgs);
                result = t.sibling;
            }
        }

        // if the op must have a sibling and doesn't, issue an error, and return empty.
        if (siblingRequired(t.op) == "required" 
                && t.sibling instanceof TstEmpty) {
            const trimmedText = t.cell.text.trim();
            const details = t.child instanceof TstEmpty ?
                            "and to the right, but both are" : "but it's";
            Err(`Missing content for '${trimmedText}'`,
                `The '${trimmedText}' operator requires content above it ` +
                `${details} empty or erroneous.`)
                .localize(t.sibling.pos).msgTo(msgs);
            result = new TstEmpty();
        }

        // all operators need something in their .child param.  if it's empty,
        // issue a warning, and return the sibling as the new value.
        if (t.child instanceof TstEmpty) {
            Warn("This will not contain any content.")
                .localize(t.pos).msgTo(msgs);
            result = t.sibling;
        }

        // if there's something in the sibling, but it's forbidden, warn about it.
        if (siblingRequired(t.op) == "forbidden"
                && !(t.sibling instanceof TstEmpty)) {
            Warn("This content does not get assigned to anything and will be ignored.")
                .localize(t.sibling.pos).msgTo(msgs)
        }

        return result.msg(msgs);
    }

}
