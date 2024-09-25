import { Pass } from "../passes";
import { 
    DotGrammar,
    EmbedGrammar,
    Grammar,
    LiteralGrammar, 
    SingleTapeGrammar
} from "../grammars";
import { Msg } from "../utils/msgs";
import { PassEnv } from "../components";

/**
 * Does some preliminary handling of single-tape environments to prepare them
 * for tape calculation.
 *  
 * Background: Some environments require single-tape grammars (e.g. regexes).
 * For regexes like `a|ab*`, this will be composed from literal content on the 
 * default tape ($T), but we also allow the programmer to define and invoke 
 * symbols like `{VOWEL}`, so long as VOWEL only has a single tape.
 * 
 * That raises the question, "What should the name of the tape be?"  Our decision
 * is that the programmer can choose, they can name it "text" or whatever; the only
 * constraint we put on them is that there can only be one tape.  (We could stipulate 
 * something, but it doesn't actually eliminate the tricky bits below, so we might 
 * as well let them have that freedom.)
 * 
 * This means, though, that it's entirely possible that a regex can invoke multiple
 * tapes *as written*, even though the programmer intends it to invoke a single tape.
 * Consider, for example, a regex like `{VOWEL}n`, where VOWEL has one tape, "text".
 * However, that `n` also only has one tape, the default tape $T.  If we sent this to
 * tape-calc as-is, we'd reject this for having two tapes, {text, $T}, which rejects
 * an entirely reasonable regex.
 * 
 * So we're not really expressing "The grammar over which this SingleTape scopes has
 * one tape", what we're actually expressing is "The grammar over which this SingleTape 
 * scopes is only made of single-tape terminals, even if those tapes happen to be named
 * different things."  This pass performs this scope adjustment.
 * 
 * We traverse the tree, and when we find a Literal or Dot inside the scope of a SingleTape
 * we just directly rename it (not make a RenameGrammar, just directly adjust the tapeName).
 * 
 * But Embeds are trickier; they pose a chicken-and-egg problem.  We need to (a) make sure
 * they only have one tape, and (b) wrap them in a Rename from whatever-their-tape-is to 
 * whatever-the-SingleTape-decrees (e.g. $i or $o).
 * 
 * We can't do (a) or (b) BEFORE CalculateTapes, because we won't know the
 * Embed's tapes yet.  But we also can't do this pass AFTER CalculateTapes,
 * because it would change the tape structure of the whole grammar too dramatically. 
 * Instead, we do what we can here, and "push" the SingleTapeGrammar (originally
 * having a wider scope) down the tree so that it only scopes over each Embed in
 * its scope.  That sets things up correctly so that tape calc can reject multi-tape
 * Embeds without rejecting reasonable regexes like `{VOWEL}n`
 */

export class HandleSingleTapes extends Pass<Grammar,Grammar> {

    constructor(
        public singleTape: SingleTapeGrammar | undefined = undefined 
    ) {
        super();
    }

    public transformAux(g: Grammar, env: PassEnv): Grammar|Msg<Grammar> {
        switch (g.tag) {
            case "singletape": return this.handleSingleTape(g, env);
            case "lit":        return this.handleLiteral(g, env);
            case "dot":        return this.handleDot(g, env);
            case "embed":      return this.handleEmbed(g, env);
            default:           return this.handleDefault(g, env);
        }
    }

    private handleDefault(g: Grammar, env: PassEnv): Msg<Grammar> {
        const newG = g.mapChildren(this, env);
        return newG; 
    }

    private handleEmbed(g: EmbedGrammar, env: PassEnv): Grammar {
        if (this.singleTape === undefined) return g;
        const wrapped = new SingleTapeGrammar(this.singleTape.tapeName, g);
        wrapped.pos = this.singleTape.pos;
        return wrapped;
    }

    private handleDot(g: DotGrammar, env: PassEnv): Grammar {
        if (this.singleTape === undefined) return g;
        return new DotGrammar(this.singleTape.tapeName);
    }

    private handleLiteral(g: LiteralGrammar, env: PassEnv): Grammar {
        if (this.singleTape === undefined) return g;
        return new LiteralGrammar(this.singleTape.tapeName, g.text);
    }

    private handleSingleTape(g: SingleTapeGrammar, env: PassEnv): Msg<Grammar> {
        const newThis = new HandleSingleTapes(g);
        return newThis.transform(g.child, env);
    }
}
