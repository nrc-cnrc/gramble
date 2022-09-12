import { 
    CounterStack,
    Grammar, HideGrammar,
    JoinGrammar, JoinRuleGrammar, 
    NsGrammar, RenameGrammar, ReplaceGrammar
} from "../grammars";

import { IdentityTransform } from "./transforms";
import { DummyCell, Errs, foldRight, REPLACE_INPUT_TAPE, REPLACE_OUTPUT_TAPE } from "../util";

let RULE_HIDE_INDEX = 0;

/**
 * This Transform handles the construction of implicit-tape replacement rules
 * (where you just say "from"/"to" rather than "from text"/"to text") and
 * cascades of them.
 */
export class RuleReplaceTransform2 extends IdentityTransform {

    public replaceIndex: number = 0;

    public get desc(): string {
        return "Constructing new-style replacement rules (2nd version)";
    }

    public transformJoinRule(g: JoinRuleGrammar): [Grammar, Errs] {

        let [newChild, childErrs] = g.child.accept(this);

        if (g.child.tapes.indexOf(g.inputTape) == -1) {
            // trying to replace on a tape that doesn't exist in the grammar
            // leads to infinite generation.  This is correct but not what anyone
            // actually wants, so mark an error
            const newErrs = [...childErrs, {
                type: "error",
                shortMsg: `Replacing on non-existent tape'`,
                longMsg: `The grammar above does not have a tape ${g.inputTape} to replace on`
            }];
            return [newChild, newErrs];
        }

        if (g.rules.length == 0) {
            return [newChild, childErrs];
        }

        const [newRules, ruleErrs] = this.mapTo(g.rules);
        const errs = [...childErrs, ...ruleErrs];

        const renamedGrammar = renameGrammar(newChild, g.inputTape, REPLACE_INPUT_TAPE);
        const composedRule = foldRight(newRules, composeRules);
        const grammarComposedWithRules = new JoinGrammar(new DummyCell(), renamedGrammar, composedRule);
        const newTapeName = `.RULE${RULE_HIDE_INDEX++}`
        const hiddenComposition = renameGrammar(grammarComposedWithRules, REPLACE_INPUT_TAPE, newTapeName);
        const renamedComposition = renameGrammar(hiddenComposition, REPLACE_OUTPUT_TAPE, g.inputTape);
        renamedComposition.calculateTapes(new CounterStack(2));
        return [renamedComposition, errs];
    }
}

function composeRules(r1: Grammar, r2: Grammar): Grammar {
    const newTapeName = `.RULE${RULE_HIDE_INDEX++}`
    const renamedR1 = renameGrammar(r1, REPLACE_OUTPUT_TAPE, newTapeName);
    const renamedR2 = renameGrammar(r2, REPLACE_INPUT_TAPE, newTapeName);
    return new JoinGrammar(new DummyCell(), renamedR1, renamedR2);
}

function renameGrammar(g: Grammar, fromTape: string, toTape: string): Grammar {
    if (fromTape == toTape) {
        return g;
    }
    return new RenameGrammar(new DummyCell(), g, fromTape, toTape);
}