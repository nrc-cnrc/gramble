import { HIDDEN_PREFIX } from "../util";
import { 
    CounterStack, 
    Grammar,
    HideGrammar, 
    RenameGrammar, 
} from "../grammars";
import { PassEnv } from "../passes";
import { PostPass } from "./ancestorPasses";

/**
 * This pass finds erroneous renames/hides and fixes them.
 * 
 * This is important for the ultimate correctness of the program:
 * If the programmar messes up the tape structure (by renaming
 * a tape to a tape name that already exists), the resulting grammar will not be
 * able to execute to completion.  There will be material in the grammar 
 * that is inaccessible to delta/deriv and thus never gets delta'd away, leading
 * to a simplification violation.
 * 
 * This pass fixes that by hiding the existing tape(s), so that the grammar
 * is well-formed again and does not lead to exceptions to otherwise invariant 
 * properties of the algorithm.
 */
export class RenameFix extends PostPass<Grammar> {

    public get desc(): string {
        return "Validating tape-rename structure";
    }

    public postTransform(g: Grammar, env: PassEnv): Grammar {
        switch (g.tag) {
            case "hide":   return this.handleHide(g, env);
            case "rename": return this.handleRename(g, env);
            default:       return g;
        }
    }

    public handleHide(g: HideGrammar, env: PassEnv): Grammar {
        g.calculateTapes(new CounterStack(2), env);
        if (g.child.tapes.indexOf(g.tapeName) == -1) { 
            throw g.child.err("Hiding missing tape",
                        `The grammar being hidden does not contain the tape ${g.tapeName}. ` +
                        ` Available tapes: [${[...g.child.tapes]}]`);
        }
        return g;
    }

    public handleRename(g: RenameGrammar, env: PassEnv): Grammar {
        g.calculateTapes(new CounterStack(2), env);
        if (g.child.tapes.indexOf(g.fromTape) == -1) { 

            throw g.child.err("Renaming missing tape",
                        `The ${g.child.constructor.name} to undergo renaming does not contain the tape ${g.fromTape}. ` +
                        `Available tapes: [${[...g.child.tapes]}]`);
        }

        if (g.fromTape != g.toTape && g.child.tapes.indexOf(g.toTape) != -1) {
            const errTapeName = `${HIDDEN_PREFIX}ERR${g.toTape}`;
            let repair = new RenameGrammar(g.child, g.toTape, errTapeName);
            repair = new RenameGrammar(repair, g.fromTape, g.toTape)
            throw repair.err("Destination tape already exists",
                        `Trying to rename ${g.fromTape}->${g.toTape} but the grammar ` +
                        `to the left already contains the tape ${g.toTape}. `)
        }

        return g;
    }


}