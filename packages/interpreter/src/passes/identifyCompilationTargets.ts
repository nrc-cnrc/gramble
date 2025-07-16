import { 
    Grammar, 
    JoinGrammar, 
    EmbedGrammar,
    QualifiedGrammar,
} from "../grammars.js";

import { AutoPass, Pass, SymbolEnv } from "../passes.js";
import { CounterStack } from "../utils/counter.js";
import { Options } from "../utils/options.js";
import { Dict, listIntersection } from "../utils/func.js";
import { getTapeSize } from "./tapeSize.js";
import { toStr } from "./toStr.js";
import { Message, Msg, MsgList } from "../utils/msgs.js";

/**
 * This pass handles the transformation of replacement rule blocks 
 * into the appropriate sequence of joins/renames/etc.
 */
export class IdentifyCompilationTargets extends Pass<Grammar,Grammar> {

    /* constructor(
        public symbols: Dict<Grammar>
    ) */

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

        const [newG, msgs] = g.mapChildren(this, env).destructure();
        const newJoin = newG as JoinGrammar;

        const sharedTapes = listIntersection(newJoin.child1.tapeNames, newJoin.child2.tapeNames);
        if (sharedTapes.length != 1) {
            // we only want to compile joins with single tapes
            return g;
        }

        const sharedTape = sharedTapes[0]
        const sharedTapeSize = getTapeSize(newJoin, sharedTape, new CounterStack, env);

        if (sharedTapeSize.cardinality > 1) {
            // we're only interested here in joins that are relatively trivial
            return newJoin.msg(msgs);
        }

        if (g.child1.tag != "embed") {
            // compiling joined embeds is our priority
            return newJoin.msg(msgs);
        }

        const newEmbedName = "$" + g.child1.symbol + "_" + sharedTape;
        console.log(`found one: ${newEmbedName}`);

        env.symbolNS[newEmbedName] = g;

        const newEmbed = new EmbedGrammar(newEmbedName);
        return newEmbed;
    }

}