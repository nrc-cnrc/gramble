import { 
    TstHeader, 
    TstOp, TstHeadedGrid, TST 
} from "../tsts.js";
import { AutoPass } from "../passes.js";
import { Err, Message, Msg } from "../utils/msgs.js";
import { Header, UniqueHeader, TapeHeader } from "../headers.js";
import { paramsMustBeLiteral } from "../ops.js";
import { PassEnv } from "../components.js";

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
export class CheckTestLiterals extends AutoPass<TST> {

    public postTransform(t: TST, env: PassEnv): TST {
        switch(t.tag) {
            case "op": return this.handleOp(t);
            default:   return t;
        }
    }

    public handleOp(t: TstOp): TST {

        const msgs: Message[] = [];
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
