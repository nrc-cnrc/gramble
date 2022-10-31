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
import { DEFAULT_SYMBOL_NAME, Dict } from "../util";

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
                const newName = calculateQualifiedName(k, this.nameStack);
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
            resolution = resolveName(subNsStack[i], g.name, subNameStack);
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

function resolveNameLocal(
    coll: CollectionGrammar,
    name: string
): [string, Grammar] | undefined {
    for (const symbolName of Object.keys(coll.symbols)) {
        if (name.toLowerCase() == symbolName.toLowerCase()) {
            const referent = coll.symbols[symbolName];
            if (referent == undefined) { return undefined; } // can't happen, just for linting
            return [symbolName, referent];
        }
    }
    return undefined;
}

function resolveName(
    coll: CollectionGrammar,
    unqualifiedName: string, 
    nsStack: string[]
): [string, Grammar] | undefined {

    // split into (potentially) collection prefix(es) and symbol name
    const namePieces = unqualifiedName.split(".");

    // it's got no collection prefix, it's a symbol name
    if (namePieces.length == 1) {

        const localResult = resolveNameLocal(coll, unqualifiedName);

        if (localResult == undefined) {
            // it's not a symbol assigned in this namespace
            return undefined;
        }
        
        // it IS a symbol defined in this collection ,
        // so get the fully-qualified name.
        const [localName, referent] = localResult;
        const newName = calculateQualifiedName(localName, nsStack);
        return [newName, referent];
    }

    // it's got a collection prefix
    const child = resolveNameLocal(coll, namePieces[0]);
    if (child == undefined) {
        // but it's not a child of this collection
        return undefined;
    }

    const [localName, referent] = child;
    if (!(referent instanceof CollectionGrammar)) {
        // if symbol X isn't a collection, "X.Y" can't refer to anything real
        return undefined;
    }

    // this collection has a child of the correct name
    const remnant = namePieces.slice(1).join(".");
    const newStack = [ ...nsStack, localName ];
    return resolveName(referent, remnant, newStack);  // try the child
}

function calculateQualifiedName(name: string, nsStack: string[]): string {
    const pieces = [...nsStack, name]
                   .filter(s => s.length > 0 &&
                           s.toLowerCase() != DEFAULT_SYMBOL_NAME.toLowerCase());
    return pieces.join(".");
}