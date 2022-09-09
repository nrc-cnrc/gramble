import { Errs, HIDDEN_TAPE_PREFIX } from "../util";
import { 
    CounterStack, Grammar,
    HideGrammar,
    NsGrammar, RenameGrammar
} from "../grammars";

import { IdentityTransform } from "./transforms";

/**
 * This transformation finds erroneous renames/hides and fixes them.
 * 
 * This is important for the ultimate correctness of the program:
 * If the programmar messes up the tape structure (by renaming
 * a tape to a tape name that already exists), the resulting grammar will not be
 * able to execute to completion.  There will be material in the grammar 
 * that is inaccessible to delta/deriv and thus never gets delta'd away, leading
 * to a simplification violation.
 * 
 * This transform fixes that by hiding the existing tape(s), so that the grammar
 * is well-formed again and does not lead to exceptions to otherwise invariant 
 * properties of the algorithm.
 */
export class RenameFixTransform extends IdentityTransform {

    public get desc(): string {
        return "Validating tape-rename structure";
    }

    public transformHide(g: HideGrammar): [Grammar, Errs] {

        const [newChild, errs] = g.child.accept(this);
        newChild.calculateTapes(new CounterStack(2));

        if (newChild.tapes.indexOf(g.tapeName) == -1) {   
            g.message({
                type: "error", 
                shortMsg: "Hiding missing tape",
                longMsg: `The grammar to the left does not contain the tape ${g.tapeName}. ` +
                    ` Available tapes: [${[...newChild.tapes]}]`
            });
            return [newChild, errs];
        }

        const result = new HideGrammar(g.cell, newChild, g.tapeName, g.name);
        return [result, errs];
    }

    public transformRename(g: RenameGrammar): [Grammar, Errs] {

        const [newChild, errs] = g.child.accept(this);
        newChild.calculateTapes(new CounterStack(2));

        if (newChild.tapes.indexOf(g.fromTape) == -1) {   
            g.message({
                type: "error", 
                shortMsg: "Renaming missing tape",
                longMsg: `The grammar to the left does not contain the tape ${g.fromTape}. ` +
                    ` Available tapes: [${[...newChild.tapes]}]`
            });
            return [newChild, errs];
        }

        if (g.fromTape != g.toTape && newChild.tapes.indexOf(g.toTape) != -1) {
            g.message({
                type: "error", 
                shortMsg: "Destination tape already exists",
                longMsg: `The grammar to the left already contains the tape ${g.toTape}. `
            });
            
            const errTapeName = `${HIDDEN_TAPE_PREFIX}ERR${g.toTape}`;
            const errChild = new RenameGrammar(newChild.cell, newChild, g.toTape, errTapeName);
            const result = new RenameGrammar(g.cell, errChild, g.fromTape, g.toTape);
            return [result, errs];
        }

        const result = new RenameGrammar(g.cell, newChild, g.fromTape, g.toTape);
        return [result, errs];
    }


}