import { 
    TstAssignment, TstBinary, TstComponent, 
    TstResult, TstTransform 
} from "../tsts";
import { Err, Msgs } from "../msgs";
import { TransEnv } from "../transforms";

export class WaywardAssigmentCheck extends TstTransform {

    public get desc(): string {
        return "Checking for wayward assignments";
    }

    public transform(t: TstComponent, env: TransEnv): TstResult {

        return t.mapChildren(this, env).bind(c => {

            const msgs: Msgs = [];

            if (c instanceof TstBinary && 
                    c.sibling instanceof TstAssignment) {
                Err("Wayward assignment",
                    "This looks like an assignment, but isn't in an " +
                    " appropriate position for one and will be ignored.",
                    c.sibling.pos).msgTo(msgs);
                c.sibling = c.sibling.child;
            }

            if (c instanceof TstBinary && 
                    c.child instanceof TstAssignment) {
                Err("Wayward assignment",
                     "This looks like an assignment, but isn't in an " +
                    " appropriate position for one and will be ignored.",
                    c.child.pos).msgTo(msgs);
                c.child = c.child.child;
            }

            return c.msg(msgs);
        });
    }
}
