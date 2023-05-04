import { MissingSymbolError, Msgs } from "../msgs";
import { 
    EmbedGrammar,
    EpsilonGrammar,
    Grammar,
    GrammarResult,
    CollectionGrammar,
    LocatorGrammar
} from "../grammars";
import { Pass, PassEnv } from "../passes";
import { DEFAULT_SYMBOL_NAME } from "../util";

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

    public transformRoot(g: Grammar, env: PassEnv): GrammarResult {

        // we keep a stack of the old collections, in which we'll
        // attempt to find the referents of embedded symbols
        const names: string[] = [];
        const grammars: CollectionGrammar[] = [];
        const newThis = new QualifyNames(names, grammars);

        return newThis.transform(g, env).bind(g => {
            const newColl = new CollectionGrammar(env.symbolNS.entries);
            newColl.symbols[""] = g;
            return newColl;
        });

    }

    public transform(g: Grammar, env: PassEnv): GrammarResult {
        switch(g.constructor) {
            case CollectionGrammar:
                return this.transformCollection(g as CollectionGrammar, env);
            case EmbedGrammar:
                return this.transformEmbed(g as EmbedGrammar, env);
            default: 
                return g.mapChildren(this, env);
        }
    }
    
    public get desc(): string {
        return "Qualifying names";
    }

    public transformCollection(g: CollectionGrammar, env: PassEnv): GrammarResult {
        //const newSymbols: Dict<Grammar> = {};
        const msgs: Msgs = [];
        let defaultReferent: Grammar = new EpsilonGrammar();

        const newCollectionStack = [ ...this.collectionStack, g ];

        for (const [k, v] of Object.entries(g.symbols)) {
            const newNameStack = [ ...this.nameStack, k ];
            const newThis = new QualifyNames(newNameStack, newCollectionStack);
            const newV = newThis.transform(v, env)
                                .msgTo(msgs);

            if (k.toLowerCase() == DEFAULT_SYMBOL_NAME.toLowerCase()) {
                defaultReferent = newV;
            }

            const newName = newNameStack.join(".");
            env.symbolNS.set(newName, newV);
            //newSymbols[k] = newV;
        }
        
        return defaultReferent.msg(msgs);
    }

    public transformEmbed(g: EmbedGrammar, env: PassEnv): GrammarResult {
        const namePieces = g.name.split(".");
        for (let i = this.collectionStack.length; i >=1; i--) {
            // we go down the stack asking each to resolve it
            const subNsStack = this.collectionStack.slice(0, i);
            const subNameStack = this.nameStack.slice(0, i-1);
            const resolutionResult = resolveName(subNsStack[i-1], namePieces, subNameStack);
            if (resolutionResult.name != undefined) {     
                if (resolutionResult.error.length > 0) {
                    return new EpsilonGrammar().err(
                        "Reference to collection",
                        resolutionResult.error);
                }
                return new EmbedGrammar(resolutionResult.name).msg();
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

type ResolutionResult = {
    name: string | undefined,
    error: string
}

export function resolveName(
    g: Grammar,
    namePieces: string[], 
    nsStack: string[] = []
): ResolutionResult {

    if (namePieces.length == 0) {
        // an empty name means we've arrived, this is the
        // grammar we're looking for

        if (g instanceof CollectionGrammar) {
            const newStack = [ ...nsStack, DEFAULT_SYMBOL_NAME ];
            const result = resolveName(g, [ DEFAULT_SYMBOL_NAME ], newStack)
            if (result.name == undefined) {
                return { 
                    name: namePieces.join("."), 
                    error: `${namePieces.join(".")} appears to refer to a sheet or collection,
                        but the sheet/collection has no Default symbol defined.`
                }
            }
        }

        if (g instanceof LocatorGrammar && g.child instanceof CollectionGrammar) {
            const newStack = [ ...nsStack, DEFAULT_SYMBOL_NAME ];
            const result = resolveName(g.child, [ DEFAULT_SYMBOL_NAME ], newStack);
            if (result.name == undefined) {
                return { 
                    name: namePieces.join("."), 
                    error: `${namePieces.join(".")} appears to refer to a sheet or collection,
                        but the sheet/collection has no Default symbol defined.`
                }
            }
        }

        return { name: nsStack.join("."), error: ""}
    }

    if (g instanceof LocatorGrammar) {
        return resolveName(g.child, namePieces, nsStack);
    }

    if (!(g instanceof CollectionGrammar)) {
        // the name we're looking for isn't empty... but this 
        // isn't a collection, we're not going to find anything!
        return { name: undefined, error: "" };
    }

    const child = resolveNameLocal(g, namePieces[0]);
    if (child == undefined) {
        return { name: undefined, error: "" };
    }

    const [localName, referent] = child;
    const remnant = namePieces.slice(1);
    const newStack = [ ...nsStack, localName ];
    return resolveName(referent, remnant, newStack);
}