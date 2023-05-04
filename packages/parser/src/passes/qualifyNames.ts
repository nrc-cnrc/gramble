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
        return this.transform(g, env).bind(_ => 
            new CollectionGrammar(env.symbolNS.entries));

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
        const msgs: Msgs = [];
        const newCollectionStack = [ ...this.collectionStack, g ];

        for (const [k, v] of Object.entries(g.symbols)) {
            const newNameStack = [ ...this.nameStack, k ];
            const newThis = new QualifyNames(newNameStack, newCollectionStack);
            const newV = newThis.transform(v, env)
                                .msgTo(msgs);

            if (v instanceof CollectionGrammar || 
                    v instanceof LocatorGrammar && v.child instanceof CollectionGrammar) {
                continue;
            }

            const newName = newNameStack.join(".");
            env.symbolNS.set(newName, newV);
        }

        return new CollectionGrammar().msg(msgs);
    }

    public transformEmbed(g: EmbedGrammar, env: PassEnv): GrammarResult {
        const namePieces = g.name.split(".");
        for (let i = this.collectionStack.length; i >=1; i--) {
            // we go down the stack asking each to resolve it
            const subNsStack = this.collectionStack.slice(0, i);
            const subNameStack = this.nameStack.slice(0, i-1);
            const resolution = resolveName(subNsStack[i-1], namePieces, subNameStack);
            if (resolution.error.length > 0) {
                return new EpsilonGrammar().err(
                    "Reference to collection",
                    resolution.error);
            }
            if (resolution.name != undefined) {         
                return new EmbedGrammar(resolution.name).msg();
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

export type ResolutionResult = {
    name: string | undefined,
    error: string
}

export function resolveName(
    g: Grammar,
    namePieces: string[], 
    nsStack: string[] = []
): ResolutionResult {

    if (namePieces.length == 0) {
        // an empty name means we've found the reference, but it may
        // or may not denote a grammar.  if it's a collection grammar
        // but doesn't have a default, we don't resolve it and have a special
        // error status.
        if (g instanceof CollectionGrammar) {
            const result = resolveName(g, [ DEFAULT_SYMBOL_NAME ], nsStack)
            if (result.name == undefined) {
                return { 
                    name: undefined, 
                    error: `${namePieces.join(".")} appears to refer to a sheet or collection,
                        but the sheet/collection has no Default symbol defined.`
                }
            }
            return result;
        }

        if (g instanceof LocatorGrammar && g.child instanceof CollectionGrammar) {
            const result = resolveName(g.child, [ DEFAULT_SYMBOL_NAME ], nsStack);
            if (result.name == undefined) {
                return { 
                    name: namePieces.join("."), 
                    error: `${namePieces.join(".")} appears to refer to a sheet or collection, ` +
                        `but the sheet/collection has no Default symbol defined.`
                }
            }
            return result;
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