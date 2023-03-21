import { 
    TstSequence, 
    TstFilter,
    TstHeaderContentPair,
    TstHeader,
    TstHide,
    TstRename,
} from "../tsts";
import {
    ContainsHeader,
    EndsHeader,
    EqualsHeader,
    HideHeader,
    RenameHeader,
    StartsHeader
} from "../headers";
import { Component, CPass, CResult } from "../components";

import { Err, Msgs } from "../msgs";
import { PassEnv } from "../passes";


export class RescopeLeftBinders extends CPass {

    public get desc(): string {
        return "Rescoping left-binding headers";
    }

    public transform(t: Component, env: PassEnv): CResult {

        return t.mapChildren(this, env).bind(t => {

            switch(t.constructor) {
                case TstSequence:
                    return this.handleCellSequence(t as TstSequence);
                default: 
                    return t;
            }

        });
    }
    
    handleCellSequence(t: TstSequence): CResult {
        
        const msgs: Msgs = [];

        const newChildren: Component[] = [];
        for (const child of t.children) {

            if (!(child instanceof TstHeaderContentPair)) {
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
                child.header.header instanceof StartsHeader ||
                child.header.header instanceof EndsHeader ||
                child.header.header instanceof ContainsHeader) {
                
                const prevChild = newChildren.pop();
                if (prevChild == undefined) {
                    Err("Wayward condition",
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
