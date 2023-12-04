import { Msg, MissingSymbolError, Message } from "../utils/msgs";
import { 
    EmbedGrammar,
    EpsilonGrammar,
    Grammar,
    CollectionGrammar
} from "../grammars";
import { Pass, PassEnv } from "../passes";
import { SymbolQualifier, grammarToQualifier, qualifySymbolAux } from "./qualifySymbols";

/**
 * Goes through the tree and 
 * 
 * (1) Flattens the collection structure, replacing the 
 * potentially complex tree of collections with a single 
 * one at the root
 * 
 * (2) Replaces unqualified symbol references (like "VERB") to 
 * fully-qualified names (like "MainSheet.VERB")
 * 
 * (3) Leaves the CollectionGrammar at the root with a "qualifier",
 * which is a condensed representation of the original project structure
 * necessary for resolving user queries.  (Even though we've qualified 
 * all the names in the original grammar, the client could potentially
 * use a variant, like "x.y" to refer to "x.y.Default".  When we didn't
 * keep around a representation of the original structure and used a 
 * different algorithm to determine its referent, there was a risk we
 * actually got a different result.
 */
export class FlattenCollections extends Pass<Grammar,Grammar> {

    constructor(
        public nameStack: string[] = [],
        public qualifierStack: SymbolQualifier[] = []
    ) {
        super();
    }

    public transformAux(g: Grammar, env: PassEnv): Grammar|Msg<Grammar> {
        switch(g.tag) {
            case "collection": return this.transformCollection(g, env);
            case "embed":      return this.transformEmbed(g, env);
            default:           return g.mapChildren(this, env);
        }
    }

    public transformCollection(g: CollectionGrammar, env: PassEnv): Msg<Grammar> {
        const msgs: Message[] = [];
        const qualifier = grammarToQualifier(g);
        const newCollectionStack: SymbolQualifier[] = [ ...this.qualifierStack, qualifier];
        for (const [k, v] of Object.entries(g.symbols)) {
            const newNameStack = [ ...this.nameStack, k ];
            const newThis = new FlattenCollections(newNameStack, newCollectionStack);
            const newV = newThis.transform(v, env)
                                .msgTo(msgs);

            if (v instanceof CollectionGrammar) {
                // if it's a nested CollectionGrammar, just discard it, 
                // we don't need it for anything.  its symbols are in env.
                continue;
            }

            const newName = newNameStack.join(".");
            env.symbolNS[newName] = newV;
        }

        return new CollectionGrammar(env.symbolNS, g.selectedSymbol, qualifier)
                    .msg(msgs);
    }

    public transformEmbed(g: EmbedGrammar, env: PassEnv): Grammar|Msg<Grammar> {
        const symbolPieces = g.symbol.split(".");
        for (let i = this.qualifierStack.length; i >=1; i--) {
            // we go down the stack asking each to try to find it
            const subNsStack = this.qualifierStack.slice(0, i);
            const subNameStack = this.nameStack.slice(0, i-1); 
            const resolution = qualifySymbolAux(subNsStack[i-1], symbolPieces, subNameStack);
            if (resolution !== undefined) {
                return new EmbedGrammar(resolution);
            }
        }

        // didn't find it
        const msg = new MissingSymbolError(g.symbol).localize(g.pos);
        return new EpsilonGrammar().msg(msg);
    }

}