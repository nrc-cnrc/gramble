import { HIDDEN_TAPE_PREFIX } from "../util";
import { 
    CounterStack, 
    GrammarResult,
    HideGrammar, RenameGrammar
} from "../grammars";

import { IdentityTransform } from "./transforms";
import { Result } from "../msgs";

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

    public transformHide(g: HideGrammar): GrammarResult {

        const result = super.transformHide(g) as Result<HideGrammar>;
        
        const [newG, _] = result.destructure();
        newG.calculateTapes(new CounterStack(2));
        if (newG.child.tapes.indexOf(g.tapeName) == -1) {  
            return result.err("Hiding missing tape",
                            `The grammar to the left does not contain the tape ${g.tapeName}. ` +
                            ` Available tapes: [${[...newG.child.tapes]}`)
                         .bind(c => c.child);
        }

        return result;
    }

    public transformRename(g: RenameGrammar): GrammarResult {

        const result = super.transformRename(g) as Result<RenameGrammar>;
        
        const [newG, _] = result.destructure();
        newG.calculateTapes(new CounterStack(2));
        if (newG.child.tapes.indexOf(g.fromTape) == -1) { 
            return result.err("Renaming missing tape",
                            `The grammar to the left does not contain the tape ${g.fromTape}. ` +
                            `Available tapes: [${[...newG.child.tapes]}]`)
                         .bind(c => c.child);
        }

        if (newG.fromTape != newG.toTape && newG.child.tapes.indexOf(newG.toTape) != -1) {
            const errTapeName = `${HIDDEN_TAPE_PREFIX}ERR${newG.toTape}`;
            return result.err("Destination tape already exists",
                            `Trying to rename ${g.fromTape}->${g.toTape} but the grammar ` +
                            `to the left ${g.child.id} already contains the tape ${g.toTape}. `)
                        .bind(c => new RenameGrammar(c.child, g.toTape, errTapeName))
                        .bind(c => new RenameGrammar(c, g.fromTape, g.toTape));
        }

        return result;
    }


}