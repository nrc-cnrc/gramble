import {
    TstParamList, 
    TstHeadedGrid, 
    TstHeader, 
    TstParams, 
    TstHeaderPair,
    TstSequence,
    TST, 
} from "../tsts";
import { Pass } from "../passes";
import { ContentMsg, Message, Msg, Warn } from "../utils/msgs";
import { backgroundColor, fontColor, paramName } from "../headers";
import { DEFAULT_PARAM } from "../utils/constants";
import { PassEnv } from "../components";

/**
 * Before this, headers and their associated content cells aren't
 * yet associated, they're both just children/grandchildren of a 
 * [TstHeadedGrid].  This pass uses their column numbers to pair them
 * up into [TstHeaderPair]s.
 */
export class AssociateHeaders extends Pass<TST,TST> {

    public transform(t: TST, env: PassEnv): Msg<TST> {

        return t.mapChildren(this, env).bind(t => {
            
            if (!(t instanceof TstHeadedGrid)) {
                return t;
            }

            const newRows: TstParams[] = [];
            const msgs: Message[] = [];
            for (const row of t.rows) {
                const newRow = new TstParams(row.cell);
                for (const content of row.content) {
                    const header = this.findHeader(t.headers, content.pos.col);
                    if (header == undefined) {
                        if (content.text.length != 0) {
                            Warn("Cannot associate this cell with " +
                                    "any valid header above; ignoring.")
                                .localize(content.pos).msgTo(msgs);
                        }
                        continue;
                    }
                    const newCell = new TstHeaderPair(header, content.cell);
                    new ContentMsg(
                        backgroundColor(header.header),
                        fontColor(header.header)
                    ).localize(content.pos).msgTo(msgs);

                    const param = paramName(header.header);
                    if (param != DEFAULT_PARAM && param != "unique") {
                        if (param in newRow.params) {
                            Warn("Named parameters can only occur once; " +
                                "this cell will be ignored.")
                                .localize(content.pos).msgTo(msgs);
                        }
                        newRow.params[param] = newCell;
                        continue;
                    }

                    if (!(param in newRow.params)) {
                        newRow.params[param] = new TstSequence(row.cell);
                    }
                    const paramSeq = newRow.params[param] as TstSequence;
                    paramSeq.children.push(newCell);
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
