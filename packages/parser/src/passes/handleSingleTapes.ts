import { PassEnv } from "../passes";
import { 
    DotGrammar,
    EmbedGrammar,
    EpsilonGrammar,
    Grammar,
    GrammarPass,
    GrammarResult, 
    HideGrammar, 
    LiteralGrammar, 
    SingleTapeGrammar
} from "../grammars";
import { DUMMY_REGEX_TAPE, HIDDEN_TAPE_PREFIX } from "../util";

/**
 * Some environments require the grammar inside to only reveal 
 * a single tape.  (E.g. grammars expressed in cells, like regexes.)
 * 
 * One tricky thing here is that regexes can contain arbitrary 
 * symbols like "equals text: (q|x){HighVowel}", and HighVowel 
 * itself might refer to multiple tapes.  We can't just ignore
 * or throw away the irrelevant tapes, though; they have to be 
 * hidden instead.
 * 
 * At the time that we construct this header/regex pair, though,
 * we don't know what HighVowel refers to or what tapes it refers
 * to.  We have to wrap everything in a grammar that just says 
 * "This whole thing can refer to only one non-hidden tape: text",
 * and then wait until we have the information.
 * 
 * This is the pass that occurs once we have that information.  We 
 * go through the tree and:
 * 
 *   (1) If we encounter a SingleTapeGrammar, remember its tapeName.
 * 
 *   (2) If we reach a literal .T:X, replace that with text:X (or
 *       whatever the relevant tape is)
 * 
 *   (3) If we reach a symbol embedding, hide all of the tapes 
 *       that aren't the relevant tape.
 */

export class HandleSingleTapes extends GrammarPass {
    
    public replaceIndex = 0;

    constructor(
        public tapeName: string | undefined = undefined
    ) {
        super();
    }

    public get desc(): string {
        return "Handling single-tape environments";
    }

    public transform(g: Grammar, env: PassEnv): GrammarResult {

        switch (g.constructor) {

            case SingleTapeGrammar:
                return this.handleSingleTape(g as SingleTapeGrammar, env);
            case LiteralGrammar:
                return this.handleLiteral(g as LiteralGrammar, env);
            case DotGrammar:
                return this.handleDot(g as DotGrammar, env);
            case EmbedGrammar:
                return this.handleEmbed(g as EmbedGrammar, env);
            default:
                return g.mapChildren(this, env);
        }
    }

    handleEmbed(g: EmbedGrammar, env: PassEnv): GrammarResult {
        if (this.tapeName == undefined) {
            // we're not in singleTape env
            return g.mapChildren(this, env);
        }

        if (g.tapes.indexOf(this.tapeName) == -1) {
            // oops, the programmer embedded a symbol that doesn't
            // reference the desided tape
            return g.err("Symbol missing field",
                `This regex references the symbol ${g.name}, ` +
                `but that symbol doesn't have any ${this.tapeName} field`)
                .bind(_ => new EpsilonGrammar());
        }

        let result: Grammar = g;
        for (const tape of g.tapes) {
            if (tape == this.tapeName) continue;
            const hiddenTapeName = `${HIDDEN_TAPE_PREFIX}H${this.replaceIndex}_${tape}`
            //console.log(`hiding ${tape} as ${hiddenTapeName}`);
            result = new HideGrammar(result, tape, hiddenTapeName);
        }
        return result.msg();
    }

    private handleDot(g: DotGrammar, env: PassEnv): GrammarResult {
        if (g.tapeName == DUMMY_REGEX_TAPE && this.tapeName != undefined) {
            return new DotGrammar(this.tapeName).msg();
        }
        return g.msg();
    }

    private handleLiteral(g: LiteralGrammar, env: PassEnv): GrammarResult {
        if (g.tapeName == DUMMY_REGEX_TAPE && this.tapeName != undefined) {
            return new LiteralGrammar(this.tapeName, g.text).msg();
        }
        return g.msg();
    }

    private handleSingleTape(g: SingleTapeGrammar, env: PassEnv): GrammarResult {
        const newThis = new HandleSingleTapes(g.tapeName);
        return newThis.transform(g.child, env);
    }
}
