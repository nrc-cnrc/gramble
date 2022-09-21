import { 
    CounterStack,
    Grammar, GrammarResult, HideGrammar,
    JoinGrammar, JoinRuleGrammar, 
    RenameGrammar, ReplaceGrammar
} from "../grammars";

import { IdentityTransform } from "./transforms";
import { REPLACE_INPUT_TAPE, REPLACE_OUTPUT_TAPE } from "../util";

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

    public transformJoinRule(g: JoinRuleGrammar): GrammarResult {

        let relevantTape = g.inputTape;
        let [child, childMsgs] = g.child.accept(this).destructure();

        if (g.child.tapes.indexOf(g.inputTape) == -1) {
            // trying to replace on a tape that doesn't exist in the grammar
            // leads to infinite generation.  This is correct but not what anyone
            // actually wants, so mark an error
            return child.msg(childMsgs)
                        .err(`Replacing on non-existent tape'`,
                            `The grammar above does not have a tape ` +
                            `${g.inputTape} to replace on`);
        }

        if (g.rules.length == 0) {
            return child.msg(childMsgs);
        }

        const [rules, ruleMsgs] = this.mapTo(g.rules).destructure();

        let result = child;
        for (const rule of rules) {
            // first, rename the relevant tape of the child to ".input"
            result = new RenameGrammar(result, relevantTape, REPLACE_INPUT_TAPE);
            // now the relevant tape is "output"
            relevantTape = REPLACE_OUTPUT_TAPE;
            // join it with the rule
            result = new JoinGrammar(result, rule);
            // hide the input tape
            result = new HideGrammar(result, REPLACE_INPUT_TAPE);
        }

        result = new RenameGrammar(result, REPLACE_OUTPUT_TAPE, g.inputTape);
        result.calculateTapes(new CounterStack(2));
        return result.msg(childMsgs).msg(ruleMsgs);
    }

}
