import { 
    TstHeader, 
    TstOp, TstHeadedGrid, TST 
} from "../tsts";
import { Pass, PassEnv } from "../passes";
import { Err, Msgs, Result } from "../msgs";
import { Header, UniqueHeader, TapeHeader } from "../headers";
import { paramsMustBeLiteral } from "../ops";
import { PostPass } from "./ancestorPasses";

/**
 * This pass checks whether named parameters in headers
 * (e.g. `from text`) are appropriately licensed by the operator that
 * encloses them.
 * 
 * If the named parameter is invalid, it creates an error message, and
 * tries to fix the header.  If the header is a TagHeader and the operator
 * allows unnamed params, then the fix is to remove that TagHeader in favor 
 * of its child.  Otherwise, the fix is to remove the header entirely.
 */
export class CheckTestLiterals extends PostPass<TST> {

    public get desc(): string {
        return "Checking that all test content is literal";
    }

    public postTransform(t: TST, env: PassEnv): TST {
        switch(t.tag) {
            case "op": return this.handleOp(t);
            default:   return t;
        }
    }

    public handleOp(t: TstOp): TST {

        const msgs: Msgs = [];
        if (paramsMustBeLiteral(t.op) && t.child instanceof TstHeadedGrid) {
            const newHeaders: TstHeader[] = []
            for (const header of t.child.headers) {
                if (!this.isLiteral(header.header)) {
                    Err("Non-literal test content",
                        "Tests can only contain plain literal content " +
                        "(e.g. no embeds, no special headers, etc.)")
                        .localize(header.pos).msgTo(msgs);
                } else {
                    newHeaders.push(header);
                }
            }
            t.child.headers = newHeaders;
        }
        if (msgs) throw t.msg(msgs);
        return t;
    }

    public isLiteral(t: Header): boolean {
        if (t instanceof TapeHeader) {
            return true;
        }
        if (t instanceof UniqueHeader) {
            return this.isLiteral(t.child);
        }
        return false;
    }
}
