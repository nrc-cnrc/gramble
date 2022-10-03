import { 
    CounterStack,
    Grammar, 
    GrammarResult, 
    JoinGrammar, 
    JoinRuleGrammar, 
    RenameGrammar
} from "../grammars";

import { IdentityPass } from "./identityPass";
import { foldRight, REPLACE_INPUT_TAPE, REPLACE_OUTPUT_TAPE } from "../util";
import { Result } from "../msgs";
import { PassEnv } from "../passes";

let RULE_HIDE_INDEX = 0;

/**
 * This pass handles the construction of implicit-tape replacement rules
 * (where you just say "from"/"to" rather than "from text"/"to text") and
 * cascades of them.
 */
export class RuleReplacePass2 extends IdentityPass {

    public replaceIndex: number = 0;

    public get desc(): string {
        return "Constructing new-style replacement rules (2nd version)";
    }

    public transformJoinRule(g: JoinRuleGrammar, env: PassEnv): GrammarResult {

        const result = super.transformJoinRule(g, env) as Result<JoinRuleGrammar>;
        const [newG, msgs] = result.destructure();

        newG.calculateTapes(new CounterStack(2));
        if (newG.child.tapes.indexOf(g.inputTape) == -1) {
            // trying to replace on a tape that doesn't exist in the grammar
            // leads to infinite generation.  This is correct but not what anyone
            // actually wants, so mark an error
            return result.err(`Replacing on non-existent tape'`,
                            `The grammar above does not have a tape ${newG.inputTape} to replace on`)
                         .bind(r => r.child);
        }

        if (newG.rules.length == 0) {
            return result.bind(r => r.child);
        }

        const renamedGrammar = renameGrammar(newG.child, g.inputTape, REPLACE_INPUT_TAPE);
        const composedRule = foldRight(newG.rules, composeRules);
        const grammarComposedWithRules = new JoinGrammar(renamedGrammar, composedRule);
        const newTapeName = `.RULE${RULE_HIDE_INDEX++}`
        const hiddenComposition = renameGrammar(grammarComposedWithRules, REPLACE_INPUT_TAPE, newTapeName);
        const renamedComposition = renameGrammar(hiddenComposition, REPLACE_OUTPUT_TAPE, g.inputTape);
        renamedComposition.calculateTapes(new CounterStack(2));
        return renamedComposition.msg(msgs);
    }
}

function composeRules(r1: Grammar, r2: Grammar): Grammar {
    const newTapeName = `.RULE${RULE_HIDE_INDEX++}`
    const renamedR1 = renameGrammar(r1, REPLACE_OUTPUT_TAPE, newTapeName);
    const renamedR2 = renameGrammar(r2, REPLACE_INPUT_TAPE, newTapeName);
    return new JoinGrammar(renamedR1, renamedR2);
}

function renameGrammar(g: Grammar, fromTape: string, toTape: string): Grammar {
    if (fromTape == toTape) {
        return g;
    }
    return new RenameGrammar(g, fromTape, toTape);
}