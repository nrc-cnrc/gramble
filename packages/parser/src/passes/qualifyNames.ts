import { MissingSymbolError, Msgs } from "../utils/msgs";
import { 
    EmbedGrammar,
    EpsilonGrammar,
    Grammar,
    GrammarResult,
    CollectionGrammar,
    LocatorGrammar
} from "../grammars";
import { Pass, PassEnv } from "../passes";
import { NameResolver, grammarToResolver, resolveNameAux } from "./resolveNames";

/**
 * Goes through the tree and 
 * 
 * (1) flattens the collection structure, replacing the 
 * potentially complex tree of collections with a single 
 * one at the root
 * 
 * (2) replaces unqualified symbol references (like "VERB") to 
 * fully-qualified names (like "MainSheet.VERB")
 * 
 * (3) Leaves the CollectionGrammar at the root with a "resolver",
 * which is a condensed representation of the original project structure
 * necessary for resolving user queries.  (Even though we've qualified 
 * all the names in the original grammar, the client could potentially
 * use a variant, like "x.y" to refer to "x.y.Default".  When we didn't
 * keep around a representation of the original structure and used a 
 * different algorithm to determine its referent, there was a risk we
 * actually got a different result.
 */
export class QualifyNames extends Pass<Grammar,Grammar> {

    constructor(
        public nameStack: string[] = [],
        public resolverStack: NameResolver[] = []
    ) {
        super();
    }

    public transform(g: Grammar, env: PassEnv): GrammarResult {
        switch(g.tag) {
            case "collection": return this.transformCollection(g, env);
            case "embed":      return this.transformEmbed(g, env);
            default:           return g.mapChildren(this, env) as GrammarResult;
        }
    }
    
    public get desc(): string {
        return "Qualifying names";
    }

    public transformCollection(g: CollectionGrammar, env: PassEnv): GrammarResult {
        const msgs: Msgs = [];
        const resolver = grammarToResolver(g);
        const newCollectionStack: NameResolver[] = [ ...this.resolverStack, resolver];
        for (const [k, v] of Object.entries(g.symbols)) {
            const newNameStack = [ ...this.nameStack, k ];
            const newThis = new QualifyNames(newNameStack, newCollectionStack);
            const newV = newThis.transform(v, env)
                                .msgTo(msgs);

            if (v instanceof CollectionGrammar || 
                    v instanceof LocatorGrammar && v.child instanceof CollectionGrammar) {
                // if it's a nested CollectionGrammar, just discard it, we don't need it 
                // for anything.  its symbols are in env.
                continue;
            }

            const newName = newNameStack.join(".");
            env.symbolNS.set(newName, newV);
        }

        return new CollectionGrammar(env.symbolNS.entries, 
                         g.selectedSymbol, resolver).msg(msgs);
    }

    public transformEmbed(g: EmbedGrammar, env: PassEnv): GrammarResult {
        const namePieces = g.name.split(".");
        for (let i = this.resolverStack.length; i >=1; i--) {
            // we go down the stack asking each to resolve it
            const subNsStack = this.resolverStack.slice(0, i);
            const subNameStack = this.nameStack.slice(0, i-1); 
            const resolution = resolveNameAux(subNsStack[i-1], namePieces, subNameStack);
            if (resolution !== undefined) {
                return new EmbedGrammar(resolution).msg();
            }
        }

        // didn't find it
        const msg = new MissingSymbolError(g.name);
        return new EpsilonGrammar().msg(msg);
    }

}