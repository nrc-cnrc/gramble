import { 
    ErrorOp,
    SymbolOp,
} from "../ops";
import { Err, Msgs, result, Result, Warn } from "../msgs";
import { PassEnv } from "../passes";
import { 
    TstOp, 
    TstEmpty,
    TstGrid
} from "../tsts";
import { Component, CPass, CResult } from "../components";

/**
 * This pass goes through and make sure that TstOps have 
 * the structural parameters (i.e. .sibling and .child) that they
 * need to be interpreted, and also ensures that these are the
 * right types (e.g., that they're grids when they need to be 
 * grids, op when they need to be op, that they're not
 * assignments, etc.)
 */

export class CheckStructuralParams extends CPass {

    public get desc(): string {
        return "Checking structural params";
    }

    public transform(t: Component, env: PassEnv): CResult {
        
        if (!(t instanceof TstOp)) {
            return t.mapChildren(this, env);
        }
        
        const mapped = t.mapChildren(this, env) as Result<TstOp>;
        return mapped.bind(t => {
    
            const msgs: Msgs = [];

            // no ops allow assignments as siblings or child, so 
            // if it's going to be an assignment, create an error 
            // and replace it with its child
            if (t.sibling instanceof TstOp 
                 && t.sibling.op instanceof SymbolOp) {
                Err("Wayward assignment",
                    "This looks like an assignment, but isn't in an " +
                    " appropriate position for one and will be ignored.",
                    t.sibling.pos).msgTo(msgs);
                t.sibling = t.sibling.child;
            }
        
            if (t.child instanceof TstOp && 
                t.child.op instanceof SymbolOp) {
                Err("Wayward assignment",
                    "This looks like an assignment, but isn't in an " +
                    " appropriate position for one and will be ignored.",
                    t.child.pos).msgTo(msgs);
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

    public handleAssignment(t: TstOp): CResult {
        
        const msgs: Msgs = [];

        // siblings of assignments don't get assigned to anything
        if (!(t.sibling instanceof TstEmpty)) {
                Warn("This content does not get " +
                    "assigned to anything and will be ignored.",
                    t.sibling.pos).msgTo(msgs);
        }

        // all operators need something in their .child param.  if
        // it's empty, issue a warning, and return the sibling as the new value.
        if (t.child instanceof TstEmpty) {
            return result(t).warn("This symbol will not contain any content.").msg(msgs);
        }

        return t.msg(msgs);

    }

    public handleError(t: TstOp): CResult {
        //const op = t.op as ErrorOp;
        const replacement = !(t.sibling instanceof TstEmpty) ?
                            t.sibling :
                            t.child
        return result(t).bind(_ => replacement);      
    }

    public handleOp(t: TstOp): CResult {

        // if the op requires a grid to the right, but doesn't have one,
        // issue an error, and return the sibling as the new value.
        if (t.op.childGridReq == "required" && 
            !(t.child instanceof TstGrid)) {
            return result(t).err(`'${t.cell.text}' requires grid`,
                    "This operator requires a grid to the right, " +
                    "but has another operator instead.")
                    .bind(r => r.sibling);
        }

        // if the op must have a sibling, but has neither a sibling
        // nor a child, issue an error, and return empty.
        if (t.op.siblingReq == "required" 
                && t.sibling instanceof TstEmpty
                && t.child instanceof TstEmpty) {
            return result(t).err(`Missing args to '${t.cell.text}'`,
                            "This operator requires content above it and to the right, " +
                            "but both are empty or erroneous.")
                        .bind(r => new TstEmpty());
        }

        // if the op must have a sibling and doesn't, issue an error,
        // and return empty
        if (t.op.siblingReq == "required" && t.sibling instanceof TstEmpty) {
            return result(t).err(`Missing argument to ${t.cell.text}`,
                            "This operator requires content above it, but it's empty or erroneous.")
                        .bind(r => new TstEmpty());
        }

        // all operators need something in their .child param.  if
        // it's empty, issue a warning, and return the sibling as the new value.
        if (t.child instanceof TstEmpty) {
            return result(t).warn("This will not contain any content.")
                            .bind(r => r.sibling);
        }

        // if there's something in the sibling, but it's forbidden,
        // warn about it.
        if (t.op.siblingReq == "forbidden" &&
                !(t.sibling instanceof TstEmpty)) {
            return t.warn("This content does not get " +
                "assigned to anything and will be ignored.",
                t.sibling.pos);
        }

        return t.msg();
    }
}