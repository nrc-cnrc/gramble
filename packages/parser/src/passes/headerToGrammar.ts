import { Pass, PassEnv } from "../passes";
import { 
    AlternationGrammar, ContainsGrammar, 
    EndsGrammar, 
    EpsilonGrammar,
    Grammar,
    GrammarResult, LiteralGrammar, 
    RuleContextGrammar, 
    SequenceGrammar, SingleTapeGrammar, StartsGrammar 
} from "../grammars";
import { result, resultList } from "../utils/msgs";
import { 
    CommentHeader, ContainsHeader, 
    EmbedHeader, EndsHeader, 
    EqualsHeader, ErrorHeader, 
    Header, OptionalHeader,
    SlashHeader, StartsHeader, 
    UniqueHeader, TapeHeader, 
    UnaryHeader, FromHeader, 
    ToHeader, RuleContextHeader 
} from "../headers";
import { INPUT_TAPE, OUTPUT_TAPE } from "../utils/constants";
import { exhaustive } from "../components";


export class HeaderToGrammar extends Pass<Header, Grammar> {
    
    constructor(
        public cellGrammar: Grammar // the grammar of the associated cell
    ) { 
        super()
    }

    public get desc(): string {
        return "Creating grammars from header/cell pairs";
    }

    public transform(h: Header, env: PassEnv): GrammarResult {
        switch(h.tag) {
            case "embed":    return this.handleEmbed(h, env);
            case "tape":     return this.handleTapeName(h, env);
            case "comment":  return this.handleComment(h, env);
            case "from":     return this.handleFrom(h, env);
            case "to":       return this.handleTo(h, env);  
            case "context":  return this.handleRuleContext(h, env);
            case "unique":   return this.handleUnique(h, env);
            case "optional": return this.handleOptional(h, env);
            case "equals":   return this.handleEquals(h, env);
            case "starts":   return this.handleStarts(h, env);
            case "ends":     return this.handleEnds(h, env);
            case "contains": return this.handleContains(h, env);
            case "slash":    return this.handleSlash(h, env);
            case "error":    return this.handleError(h, env);
            case "rename":   throw new Error("shouldn't have renames here");
            case "hide":     throw new Error("shouldn't have hides here");
            default: exhaustive(h);
        }
    }

    public handleEmbed(h: EmbedHeader, env: PassEnv): GrammarResult {
        return this.cellGrammar.msg();
    }

    public handleTapeName(h: TapeHeader, env: PassEnv): GrammarResult {
        return result(this.cellGrammar)
                    .bind(g => new SingleTapeGrammar(h.text, g))
    }

    public handleComment(h: CommentHeader, env: PassEnv): GrammarResult {
        return new EpsilonGrammar().msg();
    }

    public handleUnique(h: UniqueHeader, env: PassEnv): GrammarResult {
        return this.transform(h.child, env);
    }

    public handleFrom(h: FromHeader, env: PassEnv): GrammarResult {
        return new SingleTapeGrammar(INPUT_TAPE, this.cellGrammar).msg();
    }

    public handleTo(h: ToHeader, env: PassEnv): GrammarResult {
        return new SingleTapeGrammar(OUTPUT_TAPE, this.cellGrammar).msg();
    }

    public handleRuleContext(h: RuleContextHeader, env: PassEnv): GrammarResult {
        if (!(this.cellGrammar instanceof RuleContextGrammar)) {
            return this.cellGrammar.msg();
        }
        const newPre = new SingleTapeGrammar(INPUT_TAPE, this.cellGrammar.preContext);
        const newPost = new SingleTapeGrammar(INPUT_TAPE, this.cellGrammar.postContext);
        return new RuleContextGrammar(newPre, newPost, 
            this.cellGrammar.begins, this.cellGrammar.ends).msg();
    }
    
    public handleOptional(h: OptionalHeader, env: PassEnv): GrammarResult {
        return this.transform(h.child, env)
                .bind(c => new AlternationGrammar(
                    [c, new EpsilonGrammar()]));
    }

    public handleRegex(h: UnaryHeader, env: PassEnv): GrammarResult {
        if (!(h.child instanceof TapeHeader)) {
            // shouldn't happen, should already be taken care of, more for linting
            return new EpsilonGrammar().err("Invalid header",
                'This header can only take a plain tape name (e.g. "text").');
        }
        const tapeName = h.child.text;
        return result(this.cellGrammar)
                    .bind(g => new SingleTapeGrammar(tapeName, g))
    }

    public handleEquals(h: EqualsHeader, env: PassEnv): GrammarResult {
        return this.handleRegex(h, env);
    }

    public handleStarts(h: StartsHeader, env: PassEnv): GrammarResult {
        return this.handleRegex(h, env)
                   .bind(g => new StartsGrammar(g));
    }
    
    public handleEnds(h: EndsHeader, env: PassEnv): GrammarResult {
        return this.handleRegex(h, env)
                   .bind(g => new EndsGrammar(g));
    }

    public handleContains(h: ContainsHeader, env: PassEnv): GrammarResult {
        return this.handleRegex(h, env)
                   .bind(g => new ContainsGrammar(g));
    }

    public handleSlash(h: SlashHeader, env: PassEnv): GrammarResult {
        return resultList([h.child1, h.child2])
                 .map(c => this.transform(c, env))
                 .bind(cs => new SequenceGrammar(cs));
    }

    public handleError(h: ErrorHeader, env: PassEnv): GrammarResult {
        if (this.cellGrammar instanceof EpsilonGrammar) {
            return new EpsilonGrammar().msg();
        }

        if (this.cellGrammar instanceof LiteralGrammar && this.cellGrammar.text.length > 0) {
            return new EpsilonGrammar().msg();
        }

        return new EpsilonGrammar()
            .warn("This content is associated with an invalid header above, ignoring");
    }

}