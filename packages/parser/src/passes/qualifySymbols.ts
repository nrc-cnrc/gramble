import { Grammar } from "../grammars";
import { DEFAULT_SYMBOL } from "../utils/constants";
import { Dict, mapValues } from "../utils/func";

export type SymbolQualifier = { symbols: Dict<SymbolQualifier> } | "leaf";

export function qualifySymbol(
    g: Grammar, 
    symbol: string
): [string, Grammar] | undefined {
    switch (g.tag) {
        case "collection":
            const symbolPieces = symbol.split(".").filter(s => s.length > 0);
            const result = qualifySymbolAux(g.qualifier, symbolPieces);
            if (result === undefined) return undefined;
            return [result, g.symbols[result]];
        default:
            return undefined;
    }
}

export function qualifySymbolAux(
    g: SymbolQualifier,
    symbolPieces: string[], 
    nsStack: string[] = []
): string | undefined {

    if (symbolPieces.length == 0) {
        // if we're at a leaf, we found it
        if (g === "leaf") return nsStack.join(".");

        // if we're not, try searching for Default
        return qualifySymbolAux(g, [ DEFAULT_SYMBOL ], nsStack);
    }

    
    // if the name isn't empty but we're at a leaf, we didn't find it
    if (g === "leaf") return undefined;

    // try to find the first name piece locally
    const child = qualifySymbolLocal(g.symbols, symbolPieces[0]);

    // if we didn't find it locally, we didn't find it
    if (child == undefined) return undefined;

    // we found it locally, recurse there
    const [localName, referent] = child;
    const remnant = symbolPieces.slice(1);
    const newStack = [ ...nsStack, localName ];
    return qualifySymbolAux(referent, remnant, newStack);
}

function qualifySymbolLocal(
    coll: Dict<SymbolQualifier>,
    symbol: string
): [string, SymbolQualifier] | undefined {
    for (const key of Object.keys(coll)) {
        if (symbol.toLowerCase() == key.toLowerCase()) {
            const referent = coll[key];
            return [key, referent];
        }
    }
    return undefined;
}

/**
 * Creates a minimal representation of the original name structure
 * of the grammar, sufficient to qualify names.
 */
export function grammarToQualifier(g: Grammar): SymbolQualifier {
    switch (g.tag) {
        case "collection": 
            const symbols = mapValues(g.symbols, grammarToQualifier)
            return { symbols };
        default:
            return "leaf";
    }
}