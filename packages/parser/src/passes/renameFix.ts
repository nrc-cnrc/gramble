import { DUMMY_TAPE, HIDDEN_TAPE_PREFIX } from "../util";
import { 
    CounterStack, 
    Grammar, 
    GrammarPass, 
    GrammarResult,
    HideGrammar, 
    RenameGrammar, 
    EpsilonGrammar
} from "../grammars";
import { result } from "../msgs";
import { PassEnv } from "../passes";

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
export class RenameFix extends GrammarPass {

    public get desc(): string {
        return "Validating tape-rename structure";
    }

    public transform(g: Grammar, env: PassEnv): GrammarResult {
        const result = g.mapChildren(this, env) as GrammarResult;
        return result.bind(g => {
            switch (g.constructor) {
                case HideGrammar:
                    return this.handleHide(g as HideGrammar, env);
                case RenameGrammar:
                    return this.handleRename(g as RenameGrammar, env);
                default:
                    return g;
            }
        });
    }

    public handleHide(g: HideGrammar, env: PassEnv): GrammarResult {
        g.calculateTapes(new CounterStack(2), env);
        if (g.child.tapes.indexOf(g.tapeName) == -1) {  
            return result(g).err("Hiding missing tape",
                            `The grammar to the left does not contain the tape ${g.tapeName}. ` +
                            ` Available tapes: [${[...g.child.tapes]}`)
                         .bind(c => c.child);
        }
        return g.msg();
    }

    public handleRename(g: RenameGrammar, env: PassEnv): GrammarResult {
        g.calculateTapes(new CounterStack(2), env);
        if (g.child.tapes.indexOf(g.fromTape) == -1) { 

            if (g.child.tapes.length == 1 && g.child.tapes[0] == DUMMY_TAPE) {
                return result(g.child);
            }

            return result(g).err("Renaming missing tape",
                            `The ${g.child.constructor.name} to undergo renaming does not contain the tape ${g.fromTape}. ` +
                            `Available tapes: [${[...g.child.tapes]}]`)
                         .bind(c => c.child);
        }

        if (g.fromTape != g.toTape && g.child.tapes.indexOf(g.toTape) != -1) {
            const errTapeName = `${HIDDEN_TAPE_PREFIX}ERR${g.toTape}`;
            return result(g).err("Destination tape already exists",
                            `Trying to rename ${g.fromTape}->${g.toTape} but the grammar ` +
                            `to the left already contains the tape ${g.toTape}. `)
                        .bind(c => new RenameGrammar(c.child, g.toTape, errTapeName))
                        .bind(c => new RenameGrammar(c, g.fromTape, g.toTape));
        }

        return g.msg();
    }


}