import { Pass, PassEnv } from "../passes";
import { 
    AlternationGrammar, ContainsGrammar, 
    EmbedGrammar, EndsGrammar, 
    EpsilonGrammar, Grammar, 
    GrammarResult, RenameGrammar, 
    SequenceGrammar, StartsGrammar 
} from "../grammars";
import { DUMMY_REGEX_TAPE } from "../util";
import { resultList } from "../msgs";
import { 
    CommentHeader, ContainsHeader, 
    EmbedHeader, EndsHeader, 
    EqualsHeader, ErrorHeader, 
    Header, OptionalHeader, 
    RegexHeader, RegexTagHeader, 
    SlashHeader, StartsHeader, 
    TagHeader, TapeNameHeader 
} from "../headers";
import { REGEX_PASSES } from "./allPasses";
import { parsePlaintext, parseRegex, Regex } from "../regex";

export class HeaderToGrammar extends Pass<Header, Grammar> {
    
    constructor(
        public text: string
    ) { 
        super()
    }
    public get desc(): string {
        return "Creating grammars from header/cell pairs";
    }

    public transform(r: Regex, env: PassEnv): GrammarResult {
        
        switch(r.constructor) {
            case EmbedHeader:
                return this.handleEmbed(r as EmbedHeader, env);
            case TapeNameHeader:
                return this.handleTapeName(r as TapeNameHeader, env);
            case CommentHeader:
                return this.handleComment(r as CommentHeader, env);
            case TagHeader:
                return this.handleTag(r as TagHeader, env);
            case OptionalHeader:
                return this.handleOptional(r as OptionalHeader, env);
            case RegexTagHeader:
                return this.handleRegexTag(r as RegexTagHeader, env);
            case EqualsHeader:
                return this.handleEquals(r as EqualsHeader, env);
            case StartsHeader:
                return this.handleStarts(r as StartsHeader, env);
            case EndsHeader:
                return this.handleEnds(r as EndsHeader, env);
            case ContainsHeader:
                return this.handleContains(r as ContainsHeader, env);
            case SlashHeader:
                return this.handleSlash(r as SlashHeader, env);
            case ErrorHeader:
                return this.handleError(r as ErrorHeader, env);
            default:
                throw new Error("unhandled header");
        }
    }

    public handleEmbed(h: EmbedHeader, env: PassEnv): GrammarResult {
        return new EmbedGrammar(this.text).msg();
    }

    public handleTapeName(h: TapeNameHeader, env: PassEnv): GrammarResult {
        const tapeName = h.text;
        return parsePlaintext(this.text)
                    .bind(r => REGEX_PASSES.transform(r, env))
                    .bind(g => new RenameGrammar(g, 
                                DUMMY_REGEX_TAPE, tapeName))
    }

    public handleComment(h: CommentHeader, env: PassEnv): GrammarResult {
        return new EpsilonGrammar().msg();
    }

    public handleTag(h: TagHeader, env: PassEnv): GrammarResult {
        return this.transform(h.child, env);
    }
    
    public handleOptional(h: OptionalHeader, env: PassEnv): GrammarResult {
        return this.transform(h.child, env)
                .bind(c => new AlternationGrammar(
                    [c, new EpsilonGrammar()]));
    }

    
    public handleRegex(h: RegexHeader, env: PassEnv): GrammarResult {
        if (!(h.child instanceof TapeNameHeader)) {
            // shouldn't happen, should already be taken care of, more for linting
            return new EpsilonGrammar().err("Invalid header",
                `A header "${h.name} X" can only have a plain tape name as its X, like "${h.name} text".`);
        }
        const tapeName = h.child.text;
        return parseRegex(this.text)
                    .bind(r => REGEX_PASSES.transform(r, env))
                    .bind(g => new RenameGrammar(g, 
                            DUMMY_REGEX_TAPE, tapeName))
    }
    
    public handleRegexTag(h: RegexTagHeader, env: PassEnv): GrammarResult {
        return this.handleRegex(h, env);
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
        if (this.text.length != 0) {
            return new EpsilonGrammar().msg()
                .warn("This content is associated with an invalid header above, ignoring");
        }
        return new EpsilonGrammar().msg();
    }

}