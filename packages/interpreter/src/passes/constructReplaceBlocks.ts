import { 
    CounterStack,
    PreTapeGrammar,
    Grammar, HideGrammar,
    JoinGrammar, ReplaceBlockGrammar, 
    RenameGrammar,
    EpsilonGrammar,
    ReplaceGrammar,
    SequenceGrammar,
} from "../grammars";

import { INPUT_TAPE, OUTPUT_TAPE } from "../utils/constants";
import { PassEnv, AutoPass } from "../passes";
import { lengthRange } from "./infinityProtection";
import { Result } from "../utils/msgs";

/**
 * This pass handles the transformation of replacement rule blocks 
 * into the appropriate sequence of joins/renames/etc.
 */
export class ConstructReplaceBlocks extends AutoPass<Grammar> {

    public replaceIndex: number = 0;

    public get desc(): string {
        return "Transforming replace blocks";
    }
    
    public postTransform(g: Grammar, env: PassEnv): Grammar {
        switch (g.tag) {
            case "replaceblock": return this.handleReplaceBlock(g, env);
            case "replace":      return this.handleReplace(g, env);
            default:             return g;
        }
    }

    public handleReplaceBlock(g: ReplaceBlockGrammar, env: PassEnv): Grammar {

        const isReplace = (r: Grammar): r is ReplaceGrammar => 
                                r instanceof ReplaceGrammar;
        // it's possible for rule transformation to result in a non
        // rule (due to errors), so we filter those out
        const validRules = g.rules.filter(isReplace);

        if (validRules.length == 0) {
            throw g.child.warn("This replace has no valid rules");
        }

        g.rules = validRules;
        
        let relevantTape = g.inputTape;
        let newG = g.child;
        for (const rule of g.rules) {
            // first, rename the relevant tape of the child to "$i"
            newG = new RenameGrammar(newG, relevantTape, INPUT_TAPE);
            // now the relevant tape is "$o"
            relevantTape = OUTPUT_TAPE;
            // join it with the rule
            newG = new JoinGrammar(newG, rule);
            // hide the input tape
            newG = new HideGrammar(newG, INPUT_TAPE, rule.hiddenTapeName);
            // set priority
            newG = new PreTapeGrammar(rule.hiddenTapeName, OUTPUT_TAPE, newG);
        }

        return new RenameGrammar(newG, OUTPUT_TAPE, g.inputTape).tapify(env);
    }

    public handleReplace(g: ReplaceGrammar, env: PassEnv): Grammar {

        const stack = new CounterStack(2);

        // first handle the "from" material (i.e. pre/from/post)
        const fromMaterial = new SequenceGrammar([g.preContext, g.fromGrammar, g.postContext]).tapify(env);
        if (fromMaterial.tapes.length != 1) {
            // I don't think this is actually possible with 
            // new-style rules, but just in case
            throw new EpsilonGrammar()
                        .tapify(env)
                        .err( "Multitape rule", 
                            "This rule has the wrong number of tapes " +
                              ` in "pre/from/post": ${fromMaterial.tapes}`);
        }

        const fromTape = fromMaterial.tapes[0];
        const fromLength = lengthRange(fromMaterial, fromTape, stack, env);
        if (fromLength.null == false && fromLength.min == 0 && 
                    !g.optional && !g.beginsWith && !g.endsWith) {
            throw new EpsilonGrammar().err(
                        "Unconditional insertion",
                        "This rule can execute unconditionally " +
                        "(i.e. can trigger on an empty input).");
        }

        const toTape = g.toGrammar.tapes[0];
        const toLength = lengthRange(g.toGrammar, toTape, stack, env);
        if (toLength.null == false && toLength.max == Infinity) {
            // this shouldn't be syntactically possible to express in sheets, but if
            // it does happen, it's bad news because it's infinite generation.
            throw new EpsilonGrammar()
                        .tapify(env)
                        .err("Infinite 'to'",
                            "This rule will generate infinitely.");
        }

        return g;
    }

}