import { 
    TstComponent, TstEmpty, 
    TstParamList, 
    TstHeadedGrid, 
    TstHeader, TstResult, 
    TstParams, 
    TstPass,
    TstHeaderContentPair,
    TstSequence, 
} from "../tsts";
import { PassEnv } from "../passes";
import { ContentMsg, Msgs, Warn } from "../msgs";

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

            const newRows: TstParams[] = [];
            const msgs: Msgs = [];
            for (const row of t.rows) {
                const newRow = new TstParams(row.cell);
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
                    const newCell = new TstHeaderContentPair(header, content.cell);
                    new ContentMsg(
                        header.getBackgroundColor(),
                        header.getFontColor()
                    ).msgTo(msgs);

                    const tag = header.header.getParamName();
                    if (!(tag in newRow.params)) {
                        newRow.params[tag] = new TstSequence(row.cell);
                    }
                    newRow.params[tag].children.push(newCell);
                }
                newRows.push(newRow);
            }

            return new TstParamList(t.cell, newRows).msg(msgs);

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
