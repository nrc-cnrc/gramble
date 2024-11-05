import { 
    TstEmpty, 
    TstHeadedGrid, 
    TstHeader, TstGrid, TST
} from "../tsts.js";
import { Pass } from "../passes.js";
import { HeaderMsg, Message, Msg } from "../utils/msgs.js";
import { 
    DEFAULT_VALUE, ErrorHeader, 
    backgroundColor, parseHeaderCell 
} from "../headers.js";
import { PassEnv } from "../components.js";

/**
 * 
 */
export class CreateHeaders extends Pass<TST,TST> {

    public transform(t: TST, env: PassEnv): Msg<TST> {

        return t.mapChildren(this, env).bind(t => {
            
            if (!(t instanceof TstGrid)) {
                return t;
            }
            
            if (t.rows.length == 0) {
                return new TstEmpty(); 
            }

            const msgs: Message[] = [];
            const headers: TstHeader[] = [];
            for (const c of t.rows[0].content) {
                const h = parseHeaderCell(c.text)
                                .localize(c.pos)
                                .msgTo(msgs);
                new HeaderMsg( 
                    backgroundColor(h, 0.14, DEFAULT_VALUE)
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
