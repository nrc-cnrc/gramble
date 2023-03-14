import { Pass, PassEnv } from "../passes";
import { AlternationGrammar, DotGrammar, EmbedGrammar, EpsilonGrammar, Grammar, GrammarResult, LiteralGrammar, NegationGrammar, RepeatGrammar, SequenceGrammar } from "../grammars";
import { AlternationRegex, DotRegex, ErrorRegex, LiteralRegex, NegationRegex, PlusRegex, QuestionRegex, Regex, SequenceRegex, StarRegex, SymbolRegex } from "../regex";
import { DUMMY_REGEX_TAPE } from "../util";
import { resultList } from "../msgs";

export class RegexToGrammar extends Pass<Regex, Grammar> {
    

    public get desc(): string {
        return "Creating grammars from header/cell pairs";
    }

    public transform(r: Regex, env: PassEnv): GrammarResult {
        
        switch(r.constructor) {
            case ErrorRegex:
                return this.handleError(r as ErrorRegex, env);
            case LiteralRegex:
                return this.handleLiteral(r as LiteralRegex, env);
            case SymbolRegex:
                return this.handleSymbol(r as SymbolRegex, env);
            case DotRegex:
                return this.handleDot(r as DotRegex, env);
            case StarRegex:
                return this.handleStar(r as StarRegex, env);
            case QuestionRegex:
                return this.handleQuestion(r as QuestionRegex, env);
            case PlusRegex:
                return this.handlePlus(r as PlusRegex, env);
            case NegationRegex:
                return this.handleNegation(r as NegationRegex, env);
            case AlternationRegex:
                return this.handleAlternation(r as AlternationRegex, env);
            case SequenceRegex:
                return this.handleSequence(r as SequenceRegex, env);
            default:
                throw new Error("unhandled regex");
        }
    }

    public handleError(t: ErrorRegex, env: PassEnv): GrammarResult {
        return new EpsilonGrammar().msg()
    }

    public handleLiteral(r: LiteralRegex, env: PassEnv): GrammarResult {
        return new LiteralGrammar(DUMMY_REGEX_TAPE, r.text).msg();
    }

    public handleDot(r: DotRegex, env: PassEnv): GrammarResult {
        return new DotGrammar(DUMMY_REGEX_TAPE).msg();
    }

    public handleSymbol(r: SymbolRegex, env: PassEnv): GrammarResult {
        return new EmbedGrammar(r.text).msg();
    }
    
    public handleStar(r: StarRegex, env: PassEnv): GrammarResult {
        return this.transform(r.child, env)
                   .bind(c => new RepeatGrammar(c as Grammar));
    }
    
    public handleQuestion(r: QuestionRegex, env: PassEnv): GrammarResult {
        return this.transform(r.child, env)
                   .bind(c => new RepeatGrammar(c, 0, 1));
    }

    public handlePlus(r: PlusRegex, env: PassEnv): GrammarResult {
        return this.transform(r.child, env)
                   .bind(c => new RepeatGrammar(c, 1));
    }
    
    public handleNegation(r: NegationRegex, env: PassEnv): GrammarResult {
        return this.transform(r.child, env)
                   .bind(c => new NegationGrammar(c));
    }

    public handleAlternation(r: AlternationRegex, env: PassEnv): GrammarResult {
        return resultList([r.child1, r.child2])
                    .map(c => this.transform(c, env))
                    .bind(cs => new AlternationGrammar(cs));
    }

    public handleSequence(r: SequenceRegex, env: PassEnv): GrammarResult {
        if (r.children.length == 0) {
            return new LiteralGrammar(DUMMY_REGEX_TAPE, "").msg();
        }

        return resultList(r.children)
                    .map(c => this.transform(c, env))
                    .bind(cs => new SequenceGrammar(cs))

    }
}