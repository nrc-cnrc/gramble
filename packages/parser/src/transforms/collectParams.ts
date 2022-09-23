import { ParamRow, TstAssignment, TstComponent, TstEmpty, TstHeadedCell, TstNamespace, TstProject, TstResult, TstRow, TstTransform, TstUnitTest } from "../tsts";
import { Msgs, Result } from "../msgs";
import { RESERVED_WORDS } from "../headers";
import { TransEnv } from "../transforms";

export class CollectParamsTransform extends TstTransform {

    public get desc(): string {
        return "Collecting params";
    }

    public transform(t: TstComponent, env: TransEnv): TstResult {

        switch(t.constructor) {
            case TstRow:
                return this.transformTstRow(t as TstRow, env);
            default:
                return t.transform(this, env);
        }
    }
    
    public transformTstRow(t: TstRow, env: TransEnv): TstResult {

        const [newTst, msgs] = t.transform(this, env)
                                .destructure() as [TstRow, Msgs];

        // this is silly, but temporarily necessary.  We're taking 
        // the awkward nested structure of TstHeadedCells, 
        // linearizing it, then rebuilding the nested structure.
        const cells: TstHeadedCell[] = [];
        let currentCell = newTst.lastCell;
        while (currentCell instanceof TstHeadedCell) {
            cells.push(currentCell);
            currentCell = currentCell.prev;
        }
        cells.reverse();
        const params: {[s: string]: TstRow} = {};
        for (const cell of cells) {
            const tag = cell.header.header.getParamName();
            if (!(tag in params)) {
                params[tag] = new TstRow(newTst.cell, new TstEmpty());
            }
            cell.prev = params[tag].lastCell;
            params[tag] = new TstRow(newTst.cell, cell);
        }
        return new ParamRow(newTst.cell, params).msg(msgs);
    }
}
