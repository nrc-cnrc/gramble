import { Pass, SymbolEnv } from "../passes.js";
import { 
    CountGrammar, 
    GreedyCursorGrammar, 
    Grammar, 
    CursorGrammar,
} from "../grammars.js";
import { Count } from "../grammarConvenience.js";
import { update } from "../utils/func.js";
import { Msg } from "../utils/msgs.js";
import { CounterStack } from "../utils/counter.js";
import { Options } from "../utils/options.js";
import { DEFAULT_MAX_CHARS } from "../utils/constants.js";
import { getTapeSize } from "./tapeSize.js";

export class InfinityProtection extends Pass<Grammar,Grammar> {

    public getEnv(opt: Partial<Options>): SymbolEnv {
        return new SymbolEnv(opt);
    }

    public transform(g: Grammar, env: SymbolEnv): Msg<Grammar> {

        if (env.opt.maxChars == Infinity) return g.msg();

        const newEnv = env.update(g);
        const mapped = g.mapChildren(this, newEnv);
        return mapped.bind(g => {
            switch (g.tag) {
                case "cursor":
                case "greedyCursor":   return this.transformCursor(g, env);

                default:               return g;
            }
        });
    }

    public transformCursor(
        g: CursorGrammar | GreedyCursorGrammar, 
        env: SymbolEnv
    ): Grammar {
        const stack = new CounterStack(2);
        const len = getTapeSize(g.child, g.tapeName, stack, env);

        // it's null, it doesn't matter
        if (len.cardinality == 0) return g;
        
        // if it's not potentially infinite, replace with a greedy cursor
        if (len.maxLength !== Infinity) {
            return new GreedyCursorGrammar(g.tapeName, g.child, g.vocab)
                                        .tapify(env);
        }

        // it's potentially infinite, add a Count for protection
        let maxChars: number;
        if (typeof env.opt.maxChars === 'number')
            maxChars = env.opt.maxChars;
        else if (g.tapeName in env.opt.maxChars)
            maxChars = env.opt.maxChars[g.tapeName];
        else
            maxChars = DEFAULT_MAX_CHARS;
        const child = new CountGrammar(g.child, g.tapeName, maxChars, false, false);
        return update(g, {child}).tapify(env);
    }
}

export function infinityProtection(
    grammar: Grammar,
    tapes: string[],
    env: SymbolEnv
): Grammar {

    let foundInfinite = false;
    const maxCharsDict: {[tape: string]: number} = {};
    const stack = new CounterStack(2);

    for (const tape of tapes) {
        const len = getTapeSize(grammar, tape, stack, env);
        if (len.cardinality == 0) continue;
        if (len.maxLength == Infinity && env.opt.maxChars != Infinity) {
            if (typeof env.opt.maxChars === 'number')
                maxCharsDict[tape] = env.opt.maxChars;
            else if (tape in maxCharsDict)
                maxCharsDict[tape] = env.opt.maxChars[tape];
            foundInfinite = true;
        }
    }

    if (!foundInfinite) return grammar;
    return Count(maxCharsDict, grammar);
}
