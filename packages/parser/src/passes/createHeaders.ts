import { 
    TstEmpty, 
    TstHeadedGrid, 
    TstHeader, TstGrid
} from "../tsts";
import { PassEnv } from "../passes";
import { HeaderMsg, Msgs } from "../msgs";
import { DEFAULT_VALUE, ErrorHeader, parseHeaderCell } from "../headers";
import { Component, CPass, CResult } from "../components";

/**
 * 
 */
export class CreateHeaders extends CPass {

    public get desc(): string {
        return "Parsing headers";
    }

    public transform(t: Component, env: PassEnv): CResult {

        return t.mapChildren(this, env).bind(t => {
            
            if (!(t instanceof TstGrid)) {
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
