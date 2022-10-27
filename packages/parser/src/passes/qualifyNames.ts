import { Err, MissingSymbolError, Msgs, Result, resultDict, resultList } from "../msgs";
import { 
    CounterStack,
    EmbedGrammar,
    EpsilonGrammar,
    Grammar,
    GrammarPass,
    GrammarResult,
    Collection,
    CollectionGrammar
} from "../grammars";
import { Pass, PassEnv } from "../passes";
import { Dict } from "../util";

/**
 * Goes through the tree and 
 * 
 * (1) flattens the collection structure, replacing the 
 * potentially complex tree of collections with a single 
 * one at the root
 * 
 * (2) replaces unqualified symbol references (like "VERB") to 
 * fully-qualified names (like "MainSheet.VERB")
 */
export class QualifyNames extends Pass<Grammar,Grammar> {

    constructor(
        public nameStack: string[] = [],
        public collectionStack: CollectionGrammar[] = []
    ) {
        super();
    }

    public transformRoot(g: Grammar, env: PassEnv): Result<Grammar> {

        if (!(g instanceof CollectionGrammar)) {
            throw new Error("QualifyNames requires an NsGrammar root");
        }

        // we keep a stack of the old collections, in which we'll
        // attempt to find the referents of embedded symbols
        const names: string[] = [""];
        const grammars: CollectionGrammar[] = [g];
        const newThis = new QualifyNames(names, grammars);

        return newThis.transform(g, env)
            .bind(_ => new CollectionGrammar(env.symbolNS.entries));

    }

    public transform(g: Grammar, env: PassEnv): GrammarResult {
        switch(g.constructor) {
            case CollectionGrammar:
                return this.transformCollection(g as CollectionGrammar, env);
            case EmbedGrammar:
                return this.transformEmbed(g as EmbedGrammar, env);
            default: 
                return g.mapChildren(this, env) as GrammarResult;
        }
    }
    
    public get desc(): string {
        return "Qualifying names";
    }

    public transformCollection(g: CollectionGrammar, env: PassEnv): GrammarResult {
        const newSymbols: Dict<Grammar> = {};
        const msgs: Msgs = [];

        const entries = Object.entries(g.symbols);
        for (let i = 0; i < entries.length; i++) {
            const [k, v] = entries[i];

            let newV: Grammar;
            if (v instanceof CollectionGrammar) {
                const newNameStack = [ ...this.nameStack, k ];
                const newCollectionStack = [ ...this.collectionStack, v ];
                const newThis = new QualifyNames(newNameStack, newCollectionStack);
                newV = newThis.transform(v, env)
                                 .msgTo(msgs);
            } else {
                const newName = g.calculateQualifiedName(k, this.nameStack);
                const oldReference = env.symbolNS.attemptGet(newName);
                if (oldReference != undefined) {
                    Err("Symbol name collision",
                        "This symbol name that will refer to this grammar, " +
                        `${newName}, already refers to a different grammar.`).msgTo(msgs);
                    continue;
                }
                
                newV = this.transform(v, env)
                                 .msgTo(msgs);
                env.symbolNS.set(newName, newV);
            }

            newSymbols[k] = newV;
        }
        
        const r = new CollectionGrammar(newSymbols);
        return r.msg(msgs);
    }

    public transformEmbed(g: EmbedGrammar, env: PassEnv): GrammarResult {
        let resolution: [string, Grammar] | undefined = undefined;
        for (let i = this.collectionStack.length-1; i >=0; i--) {
            // we go down the stack asking each to resolve it
            const subNsStack = this.collectionStack.slice(0, i+1);
            const subNameStack = this.nameStack.slice(0, i+1);
            resolution = subNsStack[i].resolveName(g.name, subNameStack);
            if (resolution != undefined) {         
                const [qualifiedName, _] = resolution;
                const result = new EmbedGrammar(qualifiedName);
                return result.msg();
            }
        }

        // didn't find it
        const msg = new MissingSymbolError(g.name);
        return new EpsilonGrammar().msg(msg);
    }

}
