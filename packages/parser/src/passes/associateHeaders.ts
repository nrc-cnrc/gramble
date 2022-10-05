import {
    TstParamList, 
    TstHeadedGrid, 
    TstHeader, 
    TstParams, 
    TstHeaderContentPair,
    TstSequence, 
} from "../tsts";
import { Component, CPass, CResult } from "../components";
import { PassEnv } from "../passes";
import { ContentMsg, Msgs, Warn } from "../msgs";

/**
 * 
 */
export class AssociateHeaders extends CPass {

    public get desc(): string {
        return "Parsing headers";
    }

    public transform(t: Component, env: PassEnv): CResult {

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
                    ).localize(content.pos).msgTo(msgs);

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
