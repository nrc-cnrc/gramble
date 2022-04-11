import { 
    CounterStack, Grammar,
    NsGrammar, RenameGrammar
} from "../grammars";

import { IdentityTransform } from "./transforms";

export class RenameFixTransform extends IdentityTransform<void>{

    public transform(g: Grammar): Grammar {
        g.calculateTapes(new CounterStack(2));  // just in case.  since tapes are 
                                                // memoized, no harm in double-checking
        return g.accept(this, g as NsGrammar, null);
    }

    public transformRename(g: RenameGrammar, ns: NsGrammar, args: void): Grammar {

        const newChild = g.child.accept(this, ns, args);
        newChild.calculateTapes(new CounterStack(2));

        if (newChild.tapes == undefined) {
            // shouldn't happen
            throw new Error("adjusting tapes without having calculated them first");
        }

        if (g.fromTape != g.toTape && newChild.tapes.indexOf(g.toTape) != -1) {
            g.message({
                type: "error", 
                shortMsg: "Destination tape already exists",
                longMsg: `The grammar to the left already contains the tape ${g.toTape}. `
            });
            
            const errTapeName = `__ERR${g.toTape}`;
            const errChild = new RenameGrammar(newChild.cell, newChild, g.toTape, errTapeName);
            return new RenameGrammar(g.cell, errChild, g.fromTape, g.toTape);
        }

        return new RenameGrammar(g.cell, newChild, g.fromTape, g.toTape);
    }


}