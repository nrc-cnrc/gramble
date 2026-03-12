import { 
    SymbolOp, 
} from "../ops.js";
import { Pass } from "../passes.js";
import { 
    TstOp, TstAssignment, TST,
    TstCollection, TstHeaderPair,
    TstHeader,
    TstAutoEmbed,
    TstJoin
} from "../tsts.js";
import { PassEnv } from "../components.js";
import { Message, Msg } from "../utils/msgs.js";
import { Cell } from "../utils/cell.js";


export class RestructureJoinOps extends Pass<TST,TST> {

    constructor(
        public symbolName: string = "",
        public collection: TstCollection | undefined = undefined
    ) { 
        super();
    }

    public transform(t: TST, env: PassEnv): Msg<TST> {

        switch(t.tag) {
            case "collection": return this.handleCollection(t, env);
            case "join": return this.handleJoin(t, env);
            case "assign": return this.handleAssignment(t, env);
            default: return t.mapChildren(this, env);
        }
    }

    public handleJoin(t: TstJoin, env: PassEnv): Msg<TST> {

        const msgs: Message[] = [];
        if (t.sibling.tag !== "empty") {
            
            // make a new Assignment with a special name
            const newName = "$" + this.symbolName + "(S)";
            const assignment = new TstAssignment(t.sibling.cell, newName, t.sibling);
            
            // NB: We don't have to transform the new assignment, it
            // DOES eventually get transformed in the usual way, 
            // as a child of the collection.

            // add it to the parent collection
            if (this.collection === undefined) { // shouldn't happen
                throw new Error("Trying to add a new symbol to an undefined grammar");
            }
            this.collection.children.push(assignment);
            
            // replace the old sibling with an Embed(newName)
            t.sibling = new TstAutoEmbed(newName, t.sibling.cell);
        }

        // now transform the children, but first augment the name in 
        // yet another way, otherwise it's possible to have name clashes
        const childName = "$" + this.symbolName + "(C)";
        const newPass = new RestructureJoinOps(childName, this.collection);
        return t.mapChildren(newPass, env).msg(msgs);

    }

    public handleAssignment(t: TstAssignment, env: PassEnv): Msg<TST> {
        const newPass = new RestructureJoinOps(t.name, this.collection);
        return newPass.transform(t.child, env)
                      .bind(c => new TstAssignment(t.cell, t.name, c));
    }

    public handleCollection(t: TstCollection, env: PassEnv): Msg<TST> {
        const newPass = new RestructureJoinOps(this.symbolName, t);
        return t.mapChildren(newPass, env);
    }
}

