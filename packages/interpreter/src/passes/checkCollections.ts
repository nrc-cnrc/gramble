import { Pass } from "../passes.js";
import { 
    TstCollection, 
    TstEmpty, 
    TstAssignment,
    TST
} from "../tsts.js";
import { Component, PassEnv } from "../components.js";
import { Msg } from "../utils/msgs.js";

/**
 * Make sure that collections are reasonably placed
 */
export class CheckCollections extends Pass<TST,TST> {

    constructor(
        public parent?: Component
    ) { 
        super();
    }

    public transformAux(t: TST, env: PassEnv): Msg<TST> {
        const newThis = new CheckCollections(t);
        return t.mapChildren(newThis, env).bind(t => {
            switch(t.tag) {
                case "collection": return this.handleCollection(t, env);
                default:           return t;
            }
        });
    }

    public handleCollection(t: TstCollection, env: PassEnv): TST {
        if (this.parent == undefined || this.parent instanceof TstAssignment) {
            // good, collections can occur here
            return t;
        }

        // it's just a weird collection hanging out on its own
        throw new TstEmpty().err("Wayward collection",
                "A collection cannot occur here; it needs " +
                "to be assigned to something in the cell to the left.");

    }

}
