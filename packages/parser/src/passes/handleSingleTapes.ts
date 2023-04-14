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
import { DUMMY_REGEX_TAPE } from "../util";

/**
 * Some environments require the grammar inside to only reveal 
 * a single tape.  (E.g. grammars expressed in cells, like regexes.)
 * 
 * Originally we had intended to do something special with multi-tape
 * grammars inside (e.g. hide the other tapes), but this leads to some
 * tricky situations that will require a lot of work to handle, so 
 * for now we're simply forbidding multi-tape embeddings here
 * and issuing an error.
 */

export class HandleSingleTapes extends GrammarPass {

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

        if (g.tapes.length > 1) {
            return g.err("Embedding multi-field symbol",
                `Only grammars with one field (e.g. just "text" but not any other fields) ` +
                `can be embedded into a regex.`)
                .bind(_ => new EpsilonGrammar());
        }

        /*
        let result: Grammar = g;
        for (const tape of g.tapes) {
            if (tape == this.tapeName) continue;
            if (tape.startsWith(HIDDEN_TAPE_PREFIX)) continue;
            const hiddenTapeName = `${HIDDEN_TAPE_PREFIX}H${this.replaceIndex++}`;
            //console.log(`hiding ${g.name}.${tape} as ${hiddenTapeName}`);
            result = new HideGrammar(result, tape, hiddenTapeName);
        }
        */

        return g.msg();
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
        // note that we're not returning a new SingleTapeGrammar, this pass eliminates them
    }
}
