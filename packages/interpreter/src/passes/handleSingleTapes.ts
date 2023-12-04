import { Pass } from "../passes";
import { 
    DotGrammar,
    EmbedGrammar,
    EpsilonGrammar,
    Grammar,
    LiteralGrammar, 
    RenameGrammar, 
    SingleTapeGrammar
} from "../grammars";
import { DEFAULT_TAPE } from "../utils/constants";
import * as Tapes from "../tapes";
import { Msg } from "../utils/msgs";
import { PassEnv } from "../components";

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

export class HandleSingleTapes extends Pass<Grammar,Grammar> {

    constructor(
        public tapeName: string | undefined = undefined
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

    handleDefault(g: Grammar, env: PassEnv): Msg<Grammar> {
        const newG = g.mapChildren(this, env);

        if (this.tapeName === undefined) return newG; // nothing to do

        // otherwise, the tape structure has changed, recalculate it
        return newG.bind(g => {
            g.tapes = Tapes.Unknown();
            return g.tapify(env);
        });
    }

    handleEmbed(g: EmbedGrammar, env: PassEnv): Grammar {
        
        if (this.tapeName === undefined) {
            // we're not in singleTape env
            return g;
        }

        if (g.tapeNames.length == 0) {
            throw new EpsilonGrammar().tapify(env)
                .err("Embedding zero-field symbol",
                `This embedded symbol has no fields (e.g. "text"), it should have exactly one.`)
        }

        if (g.tapeNames.length > 1) {
            throw new EpsilonGrammar().tapify(env)
                .err("Embedding multi-field symbol",
                `Only grammars with one field (e.g. just "text" but not any other fields) ` +
                `can be embedded into a regex or rule context.`)
        }

        const embedTapeName = g.tapeNames[0];
        if (this.tapeName != embedTapeName) {
            return new RenameGrammar(g, embedTapeName, this.tapeName)
                        .tapify(env);
        }

        return g;
    }

    private handleDot(g: DotGrammar, env: PassEnv): Grammar {
        if (g.tapeName == DEFAULT_TAPE && this.tapeName != undefined) {
            return new DotGrammar(this.tapeName)
                        .tapify(env);
        }
        return g;
    }

    private handleLiteral(g: LiteralGrammar, env: PassEnv): Grammar {
        if (g.tapeName == DEFAULT_TAPE && this.tapeName != undefined) {
            return new LiteralGrammar(this.tapeName, g.text)
                        .tapify(env);
        }
        return g;
    }

    private handleSingleTape(g: SingleTapeGrammar, env: PassEnv): Msg<Grammar> {
        const newThis = new HandleSingleTapes(g.tapeName);
        return newThis.transform(g.child, env);
        // note that we're not returning a new SingleTapeGrammar, this pass eliminates them
    }
}
