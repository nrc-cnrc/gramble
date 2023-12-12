import * as Tapes from "../tapes";
import { CursorGrammar, Grammar } from "../grammars";
import { Pass } from "../passes";
import { Msg } from "../utils/msgs";
import { VocabDict } from "../vocab";
import * as Vocab from "../vocab";
import { PassEnv } from "../components";

/**
 * This pass doesn't currently do anything but check 
 * whether vocabs have resolved, it's only for error checking
 * and we won't need it once these refactorings complete
 */
export class ResolveVocab extends Pass<Grammar,Grammar> {

    constructor(
        public knownVocab: VocabDict = {}
    ) {
        super();
    }

    public transformAux(g: Grammar, env: PassEnv): Grammar|Msg<Grammar> {
        switch (g.tag) {
            case "cursor": return this.handleCursor(g, env);
            default:       return this.handleDefault(g, env);
        }
    }
    
    handleCursor(g: CursorGrammar, env: PassEnv): Msg<Grammar> {
        const newVocab = Object.create(this.knownVocab);
        Object.assign(newVocab, this.knownVocab);
        if (g.tapes.tag !== Tapes.Tag.Lit)
            throw new Error(`Resolving vocab when tapes are unresolved: ${Tapes.toStr(g.tapes)}`);
        const vocab = g.tapes.vocabMap[g.tapeName];
        if (vocab === undefined)
            throw new Error(`Resolving vocab of unknown tape: ${g.tapeName}`);
        
        // add your tape to the known vocab and use that for
        // resolution in this scope
        //console.log(`adding ${g.tapeName} = ${Vocab.toStr(vocab)} to env`);
        newVocab[g.tapeName] = vocab;
        const newThis = new ResolveVocab(newVocab);

        const newG = g.mapChildren(newThis, env) as Msg<CursorGrammar>;
        return newG.bind(g => {
            if (g.tapes.tag !== Tapes.Tag.Lit)
                throw new Error(`Resolving vocab of unresolved tape: ${Tapes.toStr(g.tapes)}`);
            
            const vocab = g.tapes.vocabMap[g.tapeName];
            if (vocab === undefined)
                    throw new Error(`Resolving vocab of unknown tape: ${g.tapeName}`);
                
            if (vocab.tag !== Vocab.Tag.Lit)
                throw new Error(`Unresolved vocab: ${Vocab.toStr(vocab)}`);

            //console.log(`resolving ${g.tapeName} = ${Vocab.toStr(vocab)}, using ${Object.keys(newVocab)}`);
            const env: Vocab.VocabEnv = new Vocab.VocabEnv(newVocab, new Set(g.tapeName));
            //const resolved = Vocab.resolve(vocab, env);
            //console.log(`resolved to ${Vocab.toStr(resolved)}`);
            //g.tapes.vocabMap[g.tapeName] = resolved;
            return g;
        });
    }
    
    handleDefault(g: Grammar, env: PassEnv): Msg<Grammar> {
        // currently trivial but may not be in future
        return g.mapChildren(this, env);
    }
}


