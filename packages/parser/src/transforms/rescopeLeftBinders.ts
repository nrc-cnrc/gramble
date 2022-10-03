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

        return t.mapChildren(this, env).bind(t => {

            switch(t.constructor) {
                case TstSequence:
                    return this.transformCellSequence(t as TstSequence);
                default: 
                    return t;
            }

        });
    }
    
    transformCellSequence(t: TstSequence): TstResult {
        
        const msgs: Msgs = [];

        const newChildren: TstComponent[] = [];
        for (const child of t.children) {

            if (!(child instanceof TstHeadedCell)) {
                newChildren.push(child);
                continue;
            }

            if (child.header.header instanceof RenameHeader) {
                const prevChild = newChildren.pop();
                if (prevChild == undefined) {
                    Err("Wayward renaming",
                        "There is nothing to the left to rename").msgTo(msgs);
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
                    Err("Wayward renaming",
                        "There is nothing to the left to rename").msgTo(msgs);
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
                    Err("Wayward filtering",
                        "There is nothing to the left to filter").msgTo(msgs);
                    continue;
                }
                const newChild = new TstFilter(prevChild, child.header, child.cell);
                newChildren.push(newChild);
                continue;
            }

            newChildren.push(child);
        }

        return new TstSequence(t.cell, newChildren).msg(msgs);
    }
}
