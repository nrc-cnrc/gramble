import { 
    TstSequence, 
    TstFilter,
    TstHeaderPair,
    TstHeader,
    TstHide,
    TstRename,
    TST,
} from "../tsts";
import {
    ContainsHeader,
    EndsHeader,
    EqualsHeader,
    HideHeader,
    RenameHeader,
    StartsHeader
} from "../headers";

import { Err, Msgs } from "../utils/msgs";
import { PassEnv } from "../passes";
import { PostPass } from "./ancestorPasses";


export class RescopeLeftBinders extends PostPass<TST> {

    public get desc(): string {
        return "Rescoping left-binding headers";
    }

    public postTransform(t: TST, env: PassEnv): TST {
        switch(t.tag) {
            case "seq": return this.handleCellSequence(t);
            default:    return t;
        }
    }
    
    handleCellSequence(t: TstSequence): TST {
        
        const msgs: Msgs = [];

        const newChildren: TST[] = [];
        for (const child of t.children) {

            if (!(child instanceof TstHeaderPair)) {
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

        const result = new TstSequence(t.cell, newChildren);
        if (msgs) throw result.msg(msgs);
        return result;
    }
}
