import { PassEnv } from "../passes";
import { Msgs, result } from "../msgs";
import { 
    TstNamespace, 
    TstOp, TstEmpty, 
    TstEnclosure,
    TstAssignment
} from "../tsts";
import { NamespaceOp, SymbolOp } from "../ops";
import { Component, CPass, CResult } from "../components";

/**
 * Make sure that namespaces are reasonably placed
 */
export class CheckNamespaces extends CPass {

    constructor(
        public parent?: Component
    ) { 
        super();
    }

    public get desc(): string {
        return "Creating namespaces";
    }

    public transform(t: Component, env: PassEnv): CResult {
        const newThis = new CheckNamespaces(t);
        return t.mapChildren(newThis, env).bind(t => {
            switch(t.constructor) {
                case TstNamespace:
                    return this.handleNamespace(t as TstNamespace, env);
                default: 
                    return t;
            }
        });
    }

    public handleNamespace(t: TstNamespace, env: PassEnv): CResult {
        if (this.parent == undefined || this.parent instanceof TstAssignment) {
            // good, namespaces can occur here
            return t.msg();
        }

        // it's just a weird namespace hanging out on its own
        return result(t).err("Wayward namespace",
                "A namespace cannot occur here; it needs " +
                "to be assigned to something in the cell to the left.")
                .bind(_ => new TstEmpty());

    }

}