import { AutoPass, Pass } from "../passes";
import { 
    GreedyCursorGrammar, 
    Grammar,
    CursorGrammar,
    QualifiedGrammar, 
} from "../grammars";
import { update } from "../utils/func";
import { Msg } from "../utils/msgs";
import { Env, Options } from "../utils/options";
import { VocabDict } from "../vocab";
import * as Tapes from "../tapes";
import * as Vocabs from "../vocab";


export class ResolveVocabEnv extends Env<Grammar> {

    constructor(
        opt: Partial<Options>,
        public vocabs: VocabDict = {}
    ) { 
        super(opt);
    }
}

export class ResolveVocab extends Pass<Grammar, Grammar> {

    public getEnv(opt: Partial<Options>): ResolveVocabEnv {
        return new ResolveVocabEnv(opt);
    }

    public transform(g: Grammar, env: ResolveVocabEnv): Msg<Grammar> {

        if (g.tapes.tag !== Tapes.Tag.Lit) {
            throw new Error("Unresolved tapes at vocab resolution");
        }

        console.log(`resolving tapes for ${g.tag}`);
        console.log(`vocab map is ${Vocabs.vocabDictToStr(g.tapes.vocabMap)}`);
        const newEnv = new ResolveVocabEnv(env.opt, g.tapes.vocabMap);
        const child = new ResolveVocabAux();
        return child.transform(g, newEnv);
    }

}


export class ResolveVocabAux extends AutoPass<Grammar> {

    public postTransform(g: Grammar, env: ResolveVocabEnv): Grammar {
        switch (g.tag) {
            case "cursor": 
            case "greedyCursor": return this.transformCursor(g, env);
            
            default: return g;
        }
    }

    public transformCursor(
        g: CursorGrammar | GreedyCursorGrammar, 
        env: ResolveVocabEnv): Grammar {

        console.log(`resolving vocab for cursor ${g.tapeName}`);

        if (g.vocab.tag === Vocabs.Tag.Lit) {
            // we're done already
            return g;
        }

        const vocab = Vocabs.getFromVocabDict(env.vocabs, g.vocab.key);
        if (vocab == undefined) {
            throw new Error(`resolved vocab for ${g.tapeName}, key = ${g.vocab.key}, is undefined! map is ${Vocabs.vocabDictToStr(env.vocabs)}`);
        } else {
            console.log(`resolved vocab for ${g.tapeName},  key = ${g.vocab.key}, is ${Vocabs.toStr(vocab)}. map is ${Vocabs.vocabDictToStr(env.vocabs)}`);
        }
        return update(g, {vocab});
    }

}