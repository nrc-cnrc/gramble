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
import { backgroundColor, fontColor, paramName } from "../headers";
import { PLAIN_PARAM } from "../util";

/**
 * Before this, headers and their associated content cells aren't
 * yet associated, they're both just children/grandchildren of a 
 * [TstHeadedGrid].  This pass uses their column numbers to pair them
 * up into [TstHeaderContentPair]s.
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
                        backgroundColor(header.header),
                        fontColor(header.header)
                    ).localize(content.pos).msgTo(msgs);

                    const param = paramName(header.header);
                    if (param != PLAIN_PARAM && param != "unique") {
                        if (param in newRow.params) {
                            Warn("Named parameters can only occur once; " +
                                "this cell will be ignored.",
                                content.pos).msgTo(msgs);
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
