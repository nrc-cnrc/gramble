import { 
    TstComponent, TstEmpty, 
    TstGrid, 
    TstHeadedGrid, 
    TstHeader, TstResult, 
    TstRow, 
    TstPass, 
} from "../tsts";
import { PassEnv } from "../passes";
import { Msgs, Warn } from "../msgs";

/**
 * 
 */
export class AssociateHeaders extends TstPass {

    public get desc(): string {
        return "Parsing headers";
    }

    public transform(t: TstComponent, env: PassEnv): TstResult {

        return t.mapChildren(this, env).bind(t => {
            
            if (!(t instanceof TstHeadedGrid)) {
                return t;
            }

            const newRows: TstRow[] = [];
            const msgs: Msgs = [];
            for (const row of t.rows) {
                const newRow = new TstRow(row.cell);
                for (const content of row.content) {
                    const header = this.findHeader(t.headers, content.pos.col);
                    if (header == undefined) {
                        if (content.text.length != 0) {
                            Warn("Cannot associate this cell with " +
                                    "any valid header above; ignoring.",
                                content.pos).msgTo(msgs);
                        }
                        continue;
                    }
                    newRow.addContent(header, content.cell);
                }
                newRows.push(newRow);
            }

            return new TstGrid(t.cell, t.sibling, new TstEmpty(),
                            t.headers, newRows).msg(msgs);

        });
    }

    public findHeader(headers: TstHeader[], col: number): TstHeader | undefined {
        for (const header of headers) {
            if (header.pos.col == col) {
                return header;
            }
        }
        return undefined;
    }

}
