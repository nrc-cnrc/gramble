import { 
    CounterStack,
    PreTapeGrammar,
    Grammar,
    GrammarPass,
    GrammarResult, HideGrammar,
    JoinGrammar, JoinRuleGrammar, 
    RenameGrammar,
    ReplaceGrammar,
    SequenceGrammar,
    Epsilon
} from "../grammars";

import { DUMMY_TAPE, REPLACE_INPUT_TAPE, REPLACE_OUTPUT_TAPE } from "../util";
import { Msgs, Warn, result } from "../msgs";
import { PassEnv } from "../passes";

/**
 * There are a few sanity checks we want to do for replacement rules.
 * 
 * We want to throw errors when:
 * 
 *   * The rule invokes too many/few tapes
 * 
 * We want to warn when:
 * 
 *   * Make sure that, in obligatory rules, the from-tape material (pre-from-post)
 *     isn't nullable.
 * 
 *   * Make sure that the to-tape material isn't infinite.
 * 
 * We can't know these with 100% certainty, so both of these is a warning
 * rather than an error.
 */
export class SanityCheckRules extends GrammarPass {

    public get desc(): string {
        return "Sanity-checking rules";
    }
    
    public transform(g: Grammar, env: PassEnv): GrammarResult {
        const result = g.mapChildren(this, env);
        
        return result.bind(g => {
            switch (g.constructor) {
                case ReplaceGrammar:
                    return this.handleReplace(g as ReplaceGrammar, env);
                default:
                    return g;
            }
        });
    }

    public handleReplace(g: ReplaceGrammar, env: PassEnv): GrammarResult {

        const newMsgs: Msgs = [];
        const stack = new CounterStack(2);
        g.calculateTapes(stack, env);

        // first handle the "from" material (i.e. pre/from/post)
        const fromMaterial = new SequenceGrammar([g.preContext, g.fromGrammar, g.postContext]);
        fromMaterial.calculateTapes(stack, env);
        const nonDummyFromTapes = fromMaterial.tapes.filter(t => t != DUMMY_TAPE);
        if (nonDummyFromTapes.length != 1) {
            // I don't think this is actually possible with 
            // new-style rules, but just in case
            return g.err("Multitape rule",
                    `This rule has the wrong number of tapes in "pre/from/post": ${nonDummyFromTapes}`)
                    .bind(_ => Epsilon());
        }
        const fromTape = nonDummyFromTapes[0];
        const fromLength = fromMaterial.estimateLength(fromTape, stack, env);
        if (fromLength.null == false && fromLength.min == 0 && g.optional == false) {
            newMsgs.push(Warn("This rule can execute unconditionally (i.e. can " +
                    "trigger on an empty input) and should be marked as optional."));
        }

        // then handle the "to" material
        const nonDummyToTapes = g.toGrammar.tapes.filter(t => t != DUMMY_TAPE);
        if (nonDummyToTapes.length != 1) {
            // I don't think this is actually possible with 
            // new-style rules, but just in case
            return g.err("Multitape rule",
                    `This rule has the wrong number of tapes in "to": ${g.toGrammar.tapes}`)
                    .bind(_ => Epsilon());
        }
        const toTape = nonDummyToTapes[0];
        const toLength = g.toGrammar.estimateLength(toTape, stack, env);
        if (toLength.null == false && toLength.max == Infinity) {
            // this shouldn't be syntactically possible to express in sheets, but if
            // it does happen, it's bad news because it's infinite generaation.
            return g.err("Infinite 'to'",
                    `This rule will generate infinitely.`)
                    .bind(_ => Epsilon());
        }

        return g.msg(newMsgs);
    }

}