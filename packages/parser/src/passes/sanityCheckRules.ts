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
    Epsilon,
    Rep,
    EpsilonGrammar
} from "../grammars";

import { DUMMY_TAPE } from "../util";
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
                case JoinRuleGrammar:
                    return this.handleJoinRule(g as JoinRuleGrammar, env);
                default:
                    return g;
            }
        });
    }

    public handleJoinRule(g: JoinRuleGrammar, env: PassEnv): GrammarResult {
        // clean up JoinRules for situations where a rule has
        // ceased to exist in handleReplace, and/or when no rules
        // are left

        const isReplace = (r: Grammar): r is ReplaceGrammar => 
                                r instanceof ReplaceGrammar;
        // it's possible for rule transformation to result in a non
        // rule (due to errors), so we filter those out
        const validRules = g.rules.filter(isReplace);

        if (validRules.length == 0) {
            return result(g)
                    .warn("This replace has no valid rules")
                    .bind(g => g.child);
        }

        g.rules = validRules;
        return g.msg();
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
            // it does happen, it's bad news because it's infinite generation.
            return g.err("Infinite 'to'",
                    `This rule will generate infinitely.`)
                    .bind(_ => Epsilon());
        }

        return g.msg(newMsgs);
    }

}