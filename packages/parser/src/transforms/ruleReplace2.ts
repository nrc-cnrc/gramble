import { 
    CounterStack,
    Grammar, HideGrammar,
    JoinGrammar, JoinRuleGrammar, 
    NsGrammar, RenameGrammar, ReplaceGrammar
} from "../grammars";

import { IdentityTransform } from "./transforms";
import { DummyCell, foldRight, REPLACE_INPUT_TAPE, REPLACE_OUTPUT_TAPE } from "../util";

/**
 * This Transform handles the construction of implicit-tape replacement rules
 * (where you just say "from"/"to" rather than "from text"/"to text") and
 * cascades of them.
 */
export class RuleReplaceTransform2 extends IdentityTransform<void>{

    public replaceIndex: number = 0;

    public get desc(): string {
        return "Constructing new-style replacement rules (2nd version)";
    }

    public transformJoinRule(
        g: JoinRuleGrammar, 
        ns: NsGrammar, 
        args: void
    ): Grammar {

        let relevantTape = g.inputTape;
        let result = g.child.accept(this, ns, args);

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

        const newRules: Grammar[] = g.rules.map(r => r.accept(this, ns, args));

        const composedRule = foldRight(newRules, composeRules);
        const renamedGrammar = new RenameGrammar(new DummyCell(), result, g.inputTape, REPLACE_INPUT_TAPE);
        const grammarComposedWithRules = new JoinGrammar(new DummyCell(), renamedGrammar, composedRule);
        const renamedComposition = new RenameGrammar(new DummyCell(), grammarComposedWithRules, REPLACE_OUTPUT_TAPE, g.inputTape);
        renamedComposition.calculateTapes(new CounterStack(2));
        return renamedComposition;
    }
}

let RULE_HIDE_INDEX = 0;
function composeRules(r1: Grammar, r2: Grammar): Grammar {
    const newTapeName = `.RULE${RULE_HIDE_INDEX++}`
    const renamedR1 = new RenameGrammar(new DummyCell(), r1, REPLACE_OUTPUT_TAPE, newTapeName);
    const renamedR2 = new RenameGrammar(new DummyCell(), r2, REPLACE_INPUT_TAPE, newTapeName);
    return new JoinGrammar(new DummyCell(), renamedR1, renamedR2);
}
