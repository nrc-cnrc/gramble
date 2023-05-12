import { PassEnv } from "../passes";
import { Msgs, result } from "../msgs";
import { 
    TstCollection, 
    TstEmpty, 
    TstAssignment
} from "../tsts";
import { Component, CPass, CResult } from "../components";
import { CatchingPass } from "./ancestorPasses";

/**
 * Make sure that collections are reasonably placed
 */
export class CheckCollections extends CatchingPass<Component,Component> {

    constructor(
        public parent?: Component
    ) { 
        super();
    }

    public get desc(): string {
        return "Creating collections";
    }

    public transformAux(t: Component, env: PassEnv): CResult {
        const newThis = new CheckCollections(t);
        return t.mapChildren(newThis, env).bind(t => {
            switch(t.constructor) {
                case TstCollection:
                    return this.handleCollection(t as TstCollection, env);
                default: 
                    return t;
            }
        });
    }

    public handleCollection(t: TstCollection, env: PassEnv): Component {
        if (this.parent == undefined || this.parent instanceof TstAssignment) {
            // good, collections can occur here
            return t;
        }

        // it's just a weird collection hanging out on its own
        throw result(t).err("Wayward collection",
                "A collection cannot occur here; it needs " +
                "to be assigned to something in the cell to the left.")
                .bind(_ => new TstEmpty());

    }

}