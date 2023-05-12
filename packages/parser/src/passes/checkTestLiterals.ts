import { 
    TstHeader, 
    TstOp, TstHeadedGrid 
} from "../tsts";
import { PassEnv } from "../passes";
import { Err, Msgs } from "../msgs";
import { Header, UniqueHeader, TapeHeader } from "../headers";
import { Component, CPass, CResult } from "../components";
import { paramsMustBeLiteral } from "../ops";

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
export class CheckTestLiterals extends CPass {

    public get desc(): string {
        return "Checking that all test content is literal";
    }

    public transform(t: Component, env: PassEnv): CResult {

        return t.mapChildren(this, env).bind(t => {
            switch(t.constructor) {
                case TstOp:
                    return this.handleOp(t as TstOp);
                default:  // everything else is default
                    return t;
            }
        });
    }

    public handleOp(t: TstOp): CResult {

        const msgs: Msgs = [];
        if (paramsMustBeLiteral(t.op) && t.child instanceof TstHeadedGrid) {
            const newHeaders: TstHeader[] = []
            for (const header of t.child.headers) {
                if (!this.isLiteral(header.header)) {
                    Err("Non-literal test content",
                        "Tests can only contain plain literal content " +
                        "(e.g. no embeds, no special headers, etc.)",
                        header.pos).msgTo(msgs);
                } else {
                    newHeaders.push(header);
                }
            }
            t.child.headers = newHeaders;
        }
        return t.msg(msgs);
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
