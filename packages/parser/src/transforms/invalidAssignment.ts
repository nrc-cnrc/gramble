import { 
    TstAssignment, TstBinary, TstComponent, 
    TstNamespace, TstResult, 
    TstTransform 
} from "../tsts";
import { Err, result, Result } from "../msgs";
import { RESERVED_WORDS } from "../headers";
import { TransEnv } from "../transforms";

export class InvalidAssignmentTransform extends TstTransform {

    constructor(
        public underNamespace: boolean = false
    ) { 
        super();
    }

    public get desc(): string {
        return "Handling invalid assignments";
    }

    public transform(t: TstComponent, env: TransEnv): TstResult {

        return t.mapChildren(this, env).bind(c => {

            if (c instanceof TstBinary && 
                    c.sibling instanceof TstAssignment) {
                const err = Err("Wayward assignment",
                                "This looks like an assignment, but isn't in an " +
                                " appropriate position for one and will be ignored.",
                                c.sibling.pos);
                c.sibling = c.sibling.child;
                return c.msg(err);
            }

            if (c instanceof TstBinary && 
                    c.child instanceof TstAssignment) {
                const err = Err("Wayward assignment",
                                "This looks like an assignment, but isn't in an " +
                                " appropriate position for one and will be ignored.",
                                c.child.pos);
                c.child = c.child.child;
                return c.msg(err);
            }

            return c;
        });
    }
}
