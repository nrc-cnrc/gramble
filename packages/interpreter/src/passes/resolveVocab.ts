import { AutoPass, Pass } from "../passes";
import { 
    GreedyCursorGrammar, 
    Grammar,
    CursorGrammar, 
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

        if (g.vocab.tag === Vocabs.Tag.Lit) {
            // we're done already
            return g;
        }

        const vocab = Vocabs.getFromVocabDict(env.vocabs, g.vocab.key);
        return update(g, {vocab});
    }

}