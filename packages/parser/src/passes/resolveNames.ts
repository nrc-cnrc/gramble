import { Grammar } from "../grammars";
import { DEFAULT_SYMBOL_NAME } from "../utils/constants";
import { Dict, mapValues } from "../utils/func";

export type NameResolver = { symbols: Dict<NameResolver> } | "leaf";


export function resolveName(
    g: Grammar, 
    symbol: string
): [string, Grammar] | undefined {
    switch (g.tag) {
        case "locator": 
            return resolveName(g.child, symbol);
        case "collection":
            const namePieces = symbol.split(".").filter(s => s.length > 0);
            const result = resolveNameAux(g.resolver, namePieces);
            if (result === undefined) return undefined;
            return [result, g.symbols[result]];
        default:
            return undefined;
    }
}

export function resolveNameAux(
    g: NameResolver,
    namePieces: string[], 
    nsStack: string[] = []
): string | undefined {

    if (namePieces.length == 0) {
        // if we're at a leaf, we found it
        if (g === "leaf") return nsStack.join(".");

        // if we're not, try searching for Default
        return resolveNameAux(g, [ DEFAULT_SYMBOL_NAME ], nsStack);
    }

    
    // if the name isn't empty but we're at a leaf, we didn't find it
    if (g === "leaf") return undefined;

    // try to find the first name piece locally
    const child = resolveNameLocal(g.symbols, namePieces[0]);

    // if we didn't find it locally, we didn't find it
    if (child == undefined) return undefined;

    // we found it locally, recurse there
    const [localName, referent] = child;
    const remnant = namePieces.slice(1);
    const newStack = [ ...nsStack, localName ];
    return resolveNameAux(referent, remnant, newStack);
}

function resolveNameLocal(
    coll: Dict<NameResolver>,
    namePiece: string
): [string, NameResolver] | undefined {
    for (const symbolName of Object.keys(coll)) {
        if (namePiece.toLowerCase() == symbolName.toLowerCase()) {
            const referent = coll[symbolName];
            return [symbolName, referent];
        }
    }
    return undefined;
}

/**
 * Creates a minimal representation of the original name structure
 * of the grammar, sufficient to qualify names.
 */
export function grammarToResolver(g: Grammar): NameResolver {
    switch (g.tag) {
        case "locator": 
            return grammarToResolver(g.child);
        case "collection": 
            const symbols = mapValues(g.symbols, grammarToResolver)
            return { symbols };
        default:
            return "leaf";
    }
}