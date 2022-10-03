import { 
    TstComponent, TstEmpty, 
    TstHeader, 
    TstResult, TstGrid, 
    TstTransform, TstOp 
} from "../tsts";
import { TransEnv } from "../transforms";
import { Err, Msgs, Result, result, Warn } from "../msgs";
import { Header, TagHeader, TapeNameHeader } from "../headers";
import { BLANK_PARAM } from "../ops";

/**
 * This transformation checks whether named parameters in headers
 * (e.g. `from text`) are appropriately licensed by the operator that
 * encloses them.
 * 
 * If the named parameter is invalid, it creates an error message, and
 * tries to fix the header.  If the header is a TagHeader and the operator
 * allows unnamed params, then the fix is to remove that TagHeader in favor 
 * of its child.  Otherwise, the fix is to remove the header entirely.
 */
export class CheckTestLiterals extends TstTransform {

    public get desc(): string {
        return "Checking that all test content is literal";
    }

    public transform(t: TstComponent, env: TransEnv): TstResult {

        return t.mapChildren(this, env).bind(t => {
            switch(t.constructor) {
                case TstOp:
                    return this.transformOp(t as TstOp);
                default:  // everything else is default
                    return t;
            }
        });
    }

    public transformOp(t: TstOp): TstResult {

        const msgs: Msgs = [];
        if (t.op.requireLiteralParams && t.child instanceof TstGrid) {
            const newHeaders: TstHeader[] = []
            for (const header of t.child.headers) {
                if (!this.isLiteral(header.header) || header.header.isRegex) {
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
        if (t instanceof TapeNameHeader) {
            return true;
        }
        if (t instanceof TagHeader) {
            return this.isLiteral(t.child);
        }
        return false;
    }
}
