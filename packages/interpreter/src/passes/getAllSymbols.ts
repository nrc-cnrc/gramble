import { Grammar, QualifiedGrammar, SelectionGrammar } from "../grammars.js";

export function getAllSymbols(
    g: Grammar
): string[] {
    switch (g.tag) {
        case "qualified": 
        case "selection":
            return getAllSymbolsQualified(g);
        default: 
            throw new Error(`Cannot get symbols from a ${g.tag}`);
    }
}

function getAllSymbolsQualified(
    g: QualifiedGrammar | SelectionGrammar
): string[] {
    return Object.keys(g.symbols)
                 .filter(s => !s.startsWith("$"));
}