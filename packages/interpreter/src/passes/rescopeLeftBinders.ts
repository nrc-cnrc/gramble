import { 
    TstSequence, 
    TstFilter,
    TstHeaderPair,
    TstHeader,
    TstHide,
    TstRename,
    TST,
    TstMerge,
} from "../tsts.js";
import {
    ContainsHeader,
    EndsHeader,
    EqualsHeader,
    HideHeader,
    RenameHeader,
    StartsHeader
} from "../headers.js";

import { Err, Message } from "../utils/msgs.js";
import { AutoPass } from "../passes.js";
import { PassEnv } from "../components.js";

/**
 * This pass creates TstRenames, TstHides, and TstFilters, and associates
 * them properly with the material they scope over.
 * 
 * At this point, a row like [A B C D] looks like (((A B) C) D) due to the
 * way we build TstMerges left-to-right.  This is fine for concatenations, but
 * renames, hides, and filters scope over ONLY the element to their immediate
 * left in the sequence.  So if D were a rename, it would scope over C but NOT
 * over A and B, so we have to fix up the structure so that the nesting is 
 * ((A B) (C D))
 */
export class RescopeLeftBinders extends AutoPass<TST> {

    public postTransform(t: TST, env: PassEnv): TST {

        // this only applies to merges.  also the right child should be a headerpair.
        // (NB: this should always be true at this stage, but won't necessarily be true of merges in general.)
        if (t.tag !== "TstMerge") {
            return t;
        }

        if (t.child2.tag !== "headerpair") {
            throw new Error(`Right child of merge at ${t.cell.pos} is not a headerpair`);
        }

        switch(t.child2.header.header.tag) {
            case "rename":      return this.rescopeRename(t.child1, t.child2, t.child2.header.header); 
            case "hide":        return this.rescopeHide(t.child1, t.child2);
            case "equals": 
            case "starts":
            case "ends":
            case "contains":    return this.rescopeFilter(t.child1, t.child2);
            default:            return this.rescopeDefault(t.child1, t.child2);
        }
    }

    rescopeDefault(child1: TST, child2: TstHeaderPair): TST {

        if (child1.tag !== "TstMerge") {
            //nothing to do
            return new TstMerge(child2.cell, child1, child2);
        }

        const newChild2 = new TstMerge(child2.cell, child1.child2, child2);
        return new TstMerge(child2.cell, child1.child1, newChild2);
    }

    rescopeRename(child1: TST, child2: TstHeaderPair, header: RenameHeader): TST {
        const newTstHeader = new TstHeader(child2.header.cell, header.child);

        if (child1.tag !== "TstMerge") {
            // easy case, we don't need to change the scope
            return new TstRename(child1, newTstHeader, child2.cell);
        }

        // more difficult case, the target of the renaming is the right child of the left child
        const newRename = new TstRename(child1.child2, newTstHeader, child2.cell);
        return new TstMerge(child2.cell, child1.child1, newRename);
    }

    rescopeHide(child1: TST, child2: TstHeaderPair): TST {
        if (child1.tag !== "TstMerge") {
            // easy case, we don't need to change the scope
            return new TstHide(child1, child2.cell);
        }
        
        // more difficult case, the target of the hiding is the right child of the left child
        const newHide = new TstHide(child1.child2, child2.cell);
        return new TstMerge(child2.cell, child1.child1, newHide);

    }

    rescopeFilter(
        child1: TST, 
        child2: TstHeaderPair, 
    ): TST {

        if (child1.tag !== "TstMerge") {
            // easy case, we don't need to change the scope
            return new TstFilter(child1, child2.header, child2.cell); 
        }

        // more difficult case, the target of the filter is the right child of the left child
        const newFilter = new TstFilter(child1.child2, child2.header, child2.cell);
        return new TstMerge(child2.cell, child1.child1, newFilter);
    }
    
}
