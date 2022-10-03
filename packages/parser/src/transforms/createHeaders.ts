import { 
    TstComponent, TstEmpty, 
    TstHeadedGrid, 
    TstHeader, TstPreGrid, TstResult,
    TstPass,
} from "../tsts";
import { PassEnv } from "../passes";
import { HeaderMsg, Msgs } from "../msgs";
import { DEFAULT_VALUE, ErrorHeader, parseHeaderCell } from "../headers";

/**
 * 
 */
export class CreateHeaders extends TstPass {

    public get desc(): string {
        return "Parsing headers";
    }

    public transform(t: TstComponent, env: PassEnv): TstResult {

        return t.mapChildren(this, env).bind(t => {
            
            if (!(t instanceof TstPreGrid)) {
                return t;
            }
            
            if (t.rows.length == 0) {
                return new TstEmpty(); 
            }

            const msgs: Msgs = [];
            const headers: TstHeader[] = [];
            for (const c of t.rows[0].content) {
                const h = parseHeaderCell(c.text).msgTo(msgs, c.pos);
                new HeaderMsg( 
                    h.getBackgroundColor(0.14, DEFAULT_VALUE)
                ).msgTo(msgs, c.cell.pos);
                if (h instanceof ErrorHeader) {
                    continue;
                } 
                headers.push(new TstHeader(c.cell, h));
            }
        
            return new TstHeadedGrid(t.cell, t.sibling, t.rows.slice(1), headers)
                                .msg(msgs);
        });
    }

}
