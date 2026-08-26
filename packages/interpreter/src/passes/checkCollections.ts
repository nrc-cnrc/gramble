import { Pass } from "../passes.js";
import { 
    TstAssignment,
    TstBinary,
    TstCollection,
    TstEmpty,
    TstJoin,
    TstOr,
    TstReplace,
    TST,
    TstTest,
    TstTestNot
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
                case "collection":
                    return this.handleCollection(t, env);
                case "join":
                case "or":
                case "replace":
                case "test":
                case "testnot":
                    return this.handleBinaryOp(t, env);
                default:
                    return t;
            }
        });
    }

    public handleCollection(t: TstCollection, env: PassEnv): TST {
        if (this.parent == undefined || this.parent instanceof TstAssignment) {
            // good, collections can occur here
            return t;
        }

        if (this.parent instanceof TstJoin ||
            this.parent instanceof TstOr ||
            this.parent instanceof TstReplace ||
            this.parent instanceof TstTest ||
            this.parent instanceof TstTestNot
        ) {
            if ((this.parent as TstBinary).sibling instanceof TstCollection)
                // handled elsewhere (in handleBinaryOp)
                return t;
        }

        // it's just a weird collection hanging out on its own
        throw new TstEmpty().err(`Wayward collection, operand of '${this.parent.tag}'`,
                "A collection cannot occur here; it needs to be assigned to " +
                "something in the cell to the left, and cannot be an operand of " +
                `'${this.parent.tag}' at ${this.parent.pos?.toString()}`);

    }

    public handleBinaryOp(t: TST, env: PassEnv): TST {
        const sibling = (t as TstBinary).sibling;
        if (sibling instanceof TstCollection) {
            // it's actually the operator that is likely in error, not the collection.
            const article = (t.tag == "or") ? "An" : "A";
            throw sibling.err(`Wayward '${t.tag}', '${sibling.tag}' as operand`,
                `${article} '${t.tag}' operator cannot occur here; it cannot have ` +
                `the '${sibling.tag}' operator at ${sibling.pos?.toString()} ` +
                "as an operand."
            ).localize(t.pos);
        }
        return t;
    }

}
