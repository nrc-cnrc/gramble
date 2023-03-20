import { Pass, PassEnv } from "../passes";
import { 
    AlternationGrammar, ContainsGrammar, 
    EndsGrammar, 
    EpsilonGrammar,
    Grammar,
    GrammarResult, LiteralGrammar, 
    SequenceGrammar, SingleTapeGrammar, StartsGrammar 
} from "../grammars";
import { resultList } from "../msgs";
import { 
    CommentHeader, ContainsHeader, 
    EmbedHeader, EndsHeader, 
    EqualsHeader, ErrorHeader, 
    Header, OptionalHeader,
    SlashHeader, StartsHeader, 
    ParamNameHeader, TapeNameHeader, UnaryHeader 
} from "../headers";


export class HeaderToGrammar extends Pass<Header, Grammar> {
    
    constructor(
        public regexGrammar: Grammar
    ) { 
        super()
    }

    public get desc(): string {
        return "Creating grammars from header/cell pairs";
    }

    public transform(h: Header, env: PassEnv): GrammarResult {
        
        switch(h.constructor) {
            case EmbedHeader:
                return this.handleEmbed(h as EmbedHeader, env);
            case TapeNameHeader:
                return this.handleTapeName(h as TapeNameHeader, env);
            case CommentHeader:
                return this.handleComment(h as CommentHeader, env);
            case ParamNameHeader:
                return this.handleTag(h as ParamNameHeader, env);
            case OptionalHeader:
                return this.handleOptional(h as OptionalHeader, env);
            case EqualsHeader:
                return this.handleEquals(h as EqualsHeader, env);
            case StartsHeader:
                return this.handleStarts(h as StartsHeader, env);
            case EndsHeader:
                return this.handleEnds(h as EndsHeader, env);
            case ContainsHeader:
                return this.handleContains(h as ContainsHeader, env);
            case SlashHeader:
                return this.handleSlash(h as SlashHeader, env);
            case ErrorHeader:
                return this.handleError(h as ErrorHeader, env);
            default:
                throw new Error("unhandled header");
        }
    }

    public handleEmbed(h: EmbedHeader, env: PassEnv): GrammarResult {
        return this.regexGrammar.msg();
    }

    public handleTapeName(h: TapeNameHeader, env: PassEnv): GrammarResult {
        const tapeName = h.text;
        return this.regexGrammar.msg()
                    .bind(g => new SingleTapeGrammar(tapeName, g))
    }

    public handleComment(h: CommentHeader, env: PassEnv): GrammarResult {
        return new EpsilonGrammar().msg();
    }

    public handleTag(h: ParamNameHeader, env: PassEnv): GrammarResult {
        return this.transform(h.child, env);
    }
    
    public handleOptional(h: OptionalHeader, env: PassEnv): GrammarResult {
        return this.transform(h.child, env)
                .bind(c => new AlternationGrammar(
                    [c, new EpsilonGrammar()]));
    }

    public handleRegex(h: UnaryHeader, env: PassEnv): GrammarResult {
        if (!(h.child instanceof TapeNameHeader)) {
            // shouldn't happen, should already be taken care of, more for linting
            return new EpsilonGrammar().err("Invalid header",
                `A header "${h.name} X" can only have a plain tape name as its X, like "${h.name} text".`);
        }
        const tapeName = h.child.text;
        return this.regexGrammar.msg()
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
        if (!(this.regexGrammar instanceof EpsilonGrammar) || 
            (this.regexGrammar instanceof LiteralGrammar && this.regexGrammar.text.length > 0)) {
            return new EpsilonGrammar().msg()
                .warn("This content is associated with an invalid header above, ignoring");
        }
        return new EpsilonGrammar().msg();
    }

}