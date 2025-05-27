import { 
    PreTapeGrammar,
    Grammar, HideGrammar,
    JoinGrammar, ReplaceBlockGrammar, 
    RenameGrammar,
    EpsilonGrammar,
    SequenceGrammar,
    ReplaceGrammar,
} from "../grammars.js";

import { INPUT_TAPE, OUTPUT_TAPE } from "../utils/constants.js";
import { AutoPass, SymbolEnv } from "../passes.js";
import { CounterStack } from "../utils/counter.js";
import { Options } from "../utils/options.js";
import { getTapeSize } from "./tapeSize.js";

/**
 * This pass handles the transformation of replacement rule blocks 
 * into the appropriate sequence of joins/renames/etc.
 */
export class ConstructReplaceBlocks extends AutoPass<Grammar> {

    public replaceIndex: number = 0;
    
    public getEnv(opt: Partial<Options>): SymbolEnv {
        return new SymbolEnv(opt);
    }
    
    public postTransform(g: Grammar, env: SymbolEnv): Grammar {
        switch (g.tag) {
            case "replaceblock": return this.handleReplaceBlock(g, env);
            case "replace":      return this.handleReplace(g, env);
            default:             return g;
        }
    }

    public handleReplaceBlock(g: ReplaceBlockGrammar, env: SymbolEnv): Grammar {

        // it's possible for rule transformation to result in a non
        // rule (due to errors), so we filter those out
        const isReplace = (r: Grammar): r is ReplaceGrammar => 
                                r instanceof ReplaceGrammar;
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

    public handleReplace(g: ReplaceGrammar, env: SymbolEnv): Grammar {

        const stack = new CounterStack(2);

        // first handle the "from" material (i.e. pre/from/post)
        const inputMaterial = new SequenceGrammar([g.preChild, g.inputChild, g.postChild]).tapify(env);
        if (inputMaterial.tapeNames.length != 1) {
            // I don't think this is actually possible with 
            // new-style rules, but just in case
            throw new EpsilonGrammar()
                        .tapify(env)
                        .err( "Non-single-tape rule", 
                              "This rule has the wrong number of tapes " +
                              `in "pre/from/post": ${inputMaterial.tapeNames}`);
        }

        const outputTape = g.outputChild.tapeNames[0];
        const outputSize = getTapeSize(g.outputChild, outputTape, stack, env);
        if (outputSize.cardinality > 0 && outputSize.maxLength == Infinity) {
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
