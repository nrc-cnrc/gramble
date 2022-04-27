import { 
    CounterStack, Grammar,
    NsGrammar, RenameGrammar
} from "../grammars";

import { IdentityTransform } from "./transforms";

/**
 * If the programmar messes up the tape structure of the program (by renaming
 * a tape to a tape name that already exists), the resulting grammar will not be
 * able to execute to completion.  There will be material in the grammar 
 * that is inaccessible to delta/deriv and thus never gets delta'd away, leading
 * to a simplification violation.
 * 
 * This transform fixes that by hiding the existing tape(s), so that the grammar
 * is well-formed again and does not lead to exceptions to otherwise invariant 
 * properties of the algorithm.
 */
export class RenameFixTransform extends IdentityTransform<void>{

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