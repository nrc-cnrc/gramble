import { 
    ErrorOp,
    SymbolOp,
    childMustBeGrid,
    siblingRequired,
} from "../ops";
import { Err, Message, Msg, Warn } from "../utils/msgs";
import { Pass, PassEnv } from "../passes";
import { 
    TstOp, 
    TstEmpty,
    TstGrid,
    TST
} from "../tsts";

/**
 * This pass goes through and make sure that TstOps have 
 * the structural parameters (i.e. .sibling and .child) that they
 * need to be interpreted, and also ensures that these are the
 * right types (e.g., that they're grids when they need to be 
 * grids, op when they need to be op, that they're not
 * assignments, etc.)
 */

export class CheckStructuralParams extends Pass<TST,TST> {

    public get desc(): string {
        return "Checking structural params";
    }

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
                Err("Wayward assignment",
                    "This looks like an assignment, but isn't in an " +
                    " appropriate position for one and will be ignored.")
                    .localize(t.sibling.pos).msgTo(msgs);
                t.sibling = t.sibling.child;
            }
        
            if (t.child instanceof TstOp && 
                t.child.op instanceof SymbolOp) {
                Err("Wayward assignment",
                    "This looks like an assignment, but isn't in an " +
                    " appropriate position for one and will be ignored.")
                    .localize(t.child.pos).msgTo(msgs);
                t.child = t.child.child;
            }

            // don't bother doing structural param checks on ErrorOps
            if (t.op instanceof ErrorOp) {
                return this.handleError(t).msg(msgs);
            }

            // assignments have some special behavior, like that they
            // don't disappear if they don't have a child
            if (t.op instanceof SymbolOp) {
                return this.handleAssignment(t).msg(msgs);
            }

            return this.handleOp(t).msg(msgs);
        });
    }

    public handleAssignment(t: TstOp): Msg<TST> {
        
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

    public handleError(t: TstOp): TST {
        return (t.sibling instanceof TstEmpty) 
                        ? t.child
                        : t.sibling   
    }

    public handleOp(t: TstOp): TST {

        // if the op requires a grid to the right, but doesn't have one,
        // issue an error, and return the sibling as the new value.
        if (childMustBeGrid(t.op) == "required" && 
            !(t.child instanceof TstGrid)) {
            throw t.sibling.err(`'${t.op.tag}' requires grid`,
                    `This ${t.op.tag} operator requires a grid to the right, ` +
                    "but has another operator instead.");
        }

        // if the op must have a sibling, but has neither a sibling
        // nor a child, issue an error, and return empty.
        if (siblingRequired(t.op) == "required" 
                && t.sibling instanceof TstEmpty
                && t.child instanceof TstEmpty) {
            throw new TstEmpty().err(`Missing args to '${t.cell.text}'`,
                            "This operator requires content above it and to the right, " +
                            "but both are empty or erroneous.")
        }

        // if the op must have a sibling and doesn't, issue an error,
        // and return empty
        if (siblingRequired(t.op) == "required" && t.sibling instanceof TstEmpty) {
            throw new TstEmpty().err(`Missing argument to ${t.cell.text}`,
                            "This operator requires content above it, but it's empty or erroneous.");
        }

        // all operators need something in their .child param.  if
        // it's empty, issue a warning, and return the sibling as the new value.
        if (t.child instanceof TstEmpty) {
            throw t.sibling.warn("This will not contain any content.")
                            .localize(t.pos);
        }

        // if there's something in the sibling, but it's forbidden,
        // warn about it.
        if (siblingRequired(t.op) == "forbidden" &&
                !(t.sibling instanceof TstEmpty)) {
            throw t.warn("This content does not get " +
                "assigned to anything and will be ignored.")
                .localize(t.sibling.pos);
        }

        return t;
    }
}