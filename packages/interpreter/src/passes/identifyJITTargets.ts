import { 
    Grammar, 
    JoinGrammar, 
    EmbedGrammar,
    QualifiedGrammar,
} from "../grammars.js";

import { Pass, SymbolEnv } from "../passes.js";
import { CounterStack } from "../utils/counter.js";
import { Options } from "../utils/options.js";
import { listIntersection } from "../utils/func.js";
import { getTapeSize } from "./tapeSize.js";
import { toStr } from "./toStr.js";
import { Message, Msg } from "../utils/msgs.js";

/**
 * This pass handles the transformation of replacement rule blocks 
 * into the appropriate sequence of joins/renames/etc.
 */
export class IdentifyJITTargets extends Pass<Grammar,Grammar> {

    public getEnv(opt: Partial<Options>): SymbolEnv {
        return new SymbolEnv(opt);
    }

    public transformAux(g: Grammar, env: SymbolEnv): Grammar | Msg<Grammar> {
        switch (g.tag) {
            case "qualified":   return this.handleQualified(g, env);
            case "join":        return this.handleJoin(g, env);
            default:            return g.mapChildren(this, env);
        }
    }

    public handleQualified(g: QualifiedGrammar, env: SymbolEnv) {

        const newEnv = env.update(g);
        const msgs: Message[] = [];
        
        for (const [k,v] of Object.entries(newEnv.symbolNS)) {
            const newV = this.transform(v, newEnv).msgTo(msgs);
            newEnv.symbolNS[k] = newV;
        }

        // it would actually suffice to return g here, because all the
        // references to the symbol table happen to refer to the selfsame object,
        // but that feels brittle -- what if things change and they don't?
        // so I'm constructing a new Qualified just in case.
        return new QualifiedGrammar(newEnv.symbolNS, g.qualifier).msg(msgs);
    }
    
    public handleJoin(g: JoinGrammar, env: SymbolEnv): Grammar | Msg<Grammar> {

        const [newG, msgs] = g.mapChildren(this, env).destructure() as [JoinGrammar, Message[]];

        const sharedTapes = listIntersection(newG.child1.tapeNames, newG.child2.tapeNames);

        console.log(`sharedTapes = ${sharedTapes}`);
        
        if (sharedTapes.length != 1) {
            // we only want to compile joins with single tapes
            return newG.msg(msgs);
        }

        const sharedTape = sharedTapes[0]
        const sharedTapeSize = getTapeSize(newG, sharedTape, new CounterStack, env);

        if (sharedTapeSize.cardinality > 1) {
            // we're only interested here in joins that are relatively trivial
            return newG.msg(msgs);
        }

        if (newG.child1.tag != "embed") {
            // compiling joined embeds is our priority
            return newG.msg(msgs);
        }

        // we need a name that uniquely identifies this grammar wherever it occurs.  this
        // join might happen many times in a grammar, and we don't want a different name each 
        // time; that would defeat the purpose of JIT compilation.  the toStr representation 
        // suffices, at least for the simple grammars that will be picked out by the above 
        // constraints.  it's not a valid identifier but at this point in compilation that's 
        // fine; the identifier rules are only constraints on programmers.
        const newEmbedName = '$' + toStr(newG);
        
        console.log(`found a JIT candidate: ${newEmbedName}`)
        env.symbolNS[newEmbedName] = newG;

        const newEmbed = new EmbedGrammar(newEmbedName);
        newEmbed.tapes = newG.tapes; // can't use tapify here, 
                        // due to env issues, but we already know the answer

        return newEmbed.msg(msgs);
    }

}