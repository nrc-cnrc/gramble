import { 
    TstSequence, 
    TstComponent,
    TstFilter,
    TstHeadedCell,
    TstHeader,
    TstHide,
    TstRename, 
    TstResult, 
    TstTransform 
} from "../tsts";
import {
    ContainsHeader,
    EndsHeader,
    EqualsHeader,
    HideHeader,
    RenameHeader,
    StartsHeader
} from "../headers";

import { Err, Msgs, Result } from "../msgs";
import { TransEnv } from "../transforms";

export class RescopeLeftBinders extends TstTransform {

    public get desc(): string {
        return "Rescoping left-binding headers";
    }

    public transform(t: TstComponent, env: TransEnv): TstResult {

        switch(t.constructor) {
            case TstSequence:
                return this.transformCellSequence(t as TstSequence, env);
            default: 
                return t.mapChildren(this, env);
        }
    }
    
    transformCellSequence(t: TstSequence, env: TransEnv): TstResult {
        
        const [result, msgs] = t.mapChildren(this, env)
                                .destructure() as [TstSequence, Msgs];

        const newChildren: TstComponent[] = [];
        for (const child of result.children) {

            if (!(child instanceof TstHeadedCell)) {
                newChildren.push(child);
                continue;
            }

            if (child.header.header instanceof RenameHeader) {
                const prevChild = newChildren.pop();
                if (prevChild == undefined) {
                    msgs.push(Err("Wayward renaming",
                        "There is nothing to the left to rename"));
                    continue;
                }
                const newTstHeader = new TstHeader(child.header.cell, child.header.header.child);
                const newChild = new TstRename(prevChild, newTstHeader, child.cell);
                newChildren.push(newChild);
                continue;
            }

            if (child.header.header instanceof HideHeader) {
                const prevChild = newChildren.pop();
                if (prevChild == undefined) {
                    msgs.push(Err("Wayward renaming",
                        "There is nothing to the left to rename"));
                    continue;
                }
                const newChild = new TstHide(prevChild, child.cell);
                newChildren.push(newChild);
                continue;
            }

            if (child.header.header instanceof EqualsHeader ||
                    child.header instanceof StartsHeader ||
                    child.header instanceof EndsHeader ||
                    child.header instanceof ContainsHeader) {
                const prevChild = newChildren.pop();
                if (prevChild == undefined) {
                    msgs.push(Err("Wayward filtering",
                        "There is nothing to the left to filter"));
                    continue;
                }
                const newChild = new TstFilter(prevChild, child.header, child.cell);
                newChildren.push(newChild);
                continue;
            }

            newChildren.push(child);
        }

        return new TstSequence(result.cell, newChildren).msg(msgs);
    }
}
