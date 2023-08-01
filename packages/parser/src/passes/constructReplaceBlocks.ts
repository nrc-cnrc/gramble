import { 
    CounterStack,
    PreTapeGrammar,
    Grammar, HideGrammar,
    JoinGrammar, ReplaceBlockGrammar, 
    RenameGrammar,
} from "../grammars";

import { REPLACE_INPUT_TAPE, REPLACE_OUTPUT_TAPE } from "../util";
import { PassEnv } from "../passes";
import { PostPass } from "./ancestorPasses";

/**
 * This pass handles the transformation of replacement rule blocks 
 * into the appropriate sequence of joins/renames/etc.
 */
export class ConstructReplaceBlocks extends PostPass<Grammar> {

    public replaceIndex: number = 0;

    public get desc(): string {
        return "Transforming replace blocks";
    }
    
    public postTransform(g: Grammar, env: PassEnv): Grammar {
        switch (g.tag) {
            case "replaceblock": return this.handleReplaceBlock(g, env);
            default:         return g;
        }
    }

    public handleReplaceBlock(g: ReplaceBlockGrammar, env: PassEnv): Grammar {

        g.child.calculateTapes(new CounterStack(2), env);
        if (g.child.tapes.indexOf(g.inputTape) == -1) {
            // trying to replace on a tape that doesn't exist in the grammar
            // leads to infinite generation.  This is correct but not what anyone
            // actually wants, so mark an error

            throw g.child.err("Replacing non-existent tape",
                        `The grammar above does not have a tape ` +
                        `${g.inputTape} to replace on`);
        }
        
        let relevantTape = g.inputTape;
        let newG = g.child;
        for (const rule of g.rules) {
            // first, rename the relevant tape of the child to ".input"
            newG = new RenameGrammar(newG, relevantTape, REPLACE_INPUT_TAPE);
            // now the relevant tape is "output"
            relevantTape = REPLACE_OUTPUT_TAPE;
            // join it with the rule
            newG = new JoinGrammar(newG, rule);
            // hide the input tape
            newG = new HideGrammar(newG, REPLACE_INPUT_TAPE, rule.hiddenTapeName);
            // set priority
            newG = new PreTapeGrammar(rule.hiddenTapeName, REPLACE_OUTPUT_TAPE, newG);
        }

        return new RenameGrammar(newG, REPLACE_OUTPUT_TAPE, g.inputTape);
    }

}