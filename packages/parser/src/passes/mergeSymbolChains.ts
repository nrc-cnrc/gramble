import { Pass, PassEnv } from "../passes";
import { AlternationGrammar, DotGrammar, EmbedGrammar, EpsilonGrammar, Grammar, GrammarResult, LiteralGrammar, NegationGrammar, RepeatGrammar, SequenceGrammar } from "../grammars";
import { AlternationRegex, DotRegex, ErrorRegex, LiteralRegex, NegationRegex, PlusRegex, QuestionRegex, Regex, SequenceRegex, StarRegex, SymbolChainRegex, SymbolRegex } from "../regex";
import { DUMMY_REGEX_TAPE } from "../util";
import { Result, resultList } from "../msgs";

export class MergeSymbolChains extends Pass<Regex, Regex> {

    public get desc(): string {
        return "Creating grammars from header/cell pairs";
    }

    public transform(r: Regex, env: PassEnv): Result<Regex> {
        
        const result = r.mapChildren(this, env) as Result<Regex>;
        return result.bind(r => {
            switch(r.constructor) {
                case SymbolChainRegex:
                    return this.handleSymbolChain(r as SymbolChainRegex);
                default:
                    return r;
            }
        });
    }

    public handleSymbolChain(r: SymbolChainRegex): Regex {
        if (!(r.child1 instanceof SymbolRegex) || !(r.child2 instanceof SymbolRegex)) {
            throw new Error("symbol chains must be made of symbols at this stage");
        }

        const text = r.child1.text + "." + r.child2.text;
        return new SymbolRegex(text);
    }

}