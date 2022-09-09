import { 
    CounterStack,
    Grammar, HideGrammar,
    JoinGrammar, JoinRuleGrammar, 
    NsGrammar, RenameGrammar, ReplaceGrammar
} from "../grammars";

import { IdentityTransform } from "./transforms";
import { DummyCell, REPLACE_INPUT_TAPE, REPLACE_OUTPUT_TAPE } from "../util";

/**
 * This Transform handles the construction of implicit-tape replacement rules
 * (where you just say "from"/"to" rather than "from text"/"to text") and
 * cascades of them.
 */
export class RuleReplaceTransform extends IdentityTransform {

    public replaceIndex: number = 0;

    public get desc(): string {
        return "Constructing new-style replacement rules";
    }

    public transformJoinRule(g: JoinRuleGrammar): Grammar {

        let relevantTape = g.inputTape;
        let result = g.child.accept(this);

        if (g.child.tapes.indexOf(g.inputTape) == -1) {
            // trying to replace on a tape that doesn't exist in the grammar
            // leads to infinite generation.  This is correct but not what anyone
            // actually wants, so mark an error
            g.cell.message({
                type: "error",
                shortMsg: `Replacing on non-existent tape'`,
                longMsg: `The grammar above does not have a tape ${g.inputTape} to replace on`
            });
            return result;
        }

        if (g.rules.length == 0) {
            return result;
        }

        const newRules = g.rules.map(r => r.accept(this));

        for (const rule of newRules) {
            // first, rename the relevant tape of the child to ".input"
            result = new RenameGrammar(new DummyCell(), result, relevantTape, REPLACE_INPUT_TAPE);
            // now the relevant tape is "output"
            relevantTape = REPLACE_OUTPUT_TAPE;
            // join it with the rule
            result = new JoinGrammar(g.cell, result, rule);
            // hide the input tape
            result = new HideGrammar(new DummyCell(), result, REPLACE_INPUT_TAPE);
        }

        result = new RenameGrammar(new DummyCell(), result, REPLACE_OUTPUT_TAPE, g.inputTape);
        result.calculateTapes(new CounterStack(2));
        return result;
    }

}
