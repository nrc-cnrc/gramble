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

// we don't want interfaces to be able to see internal variables,
// which have identifiers beginning with $.  (Note, we also have to
// catch identifiers like X.$Y, hence the more complicated regex.)
const symbolExcluderRegex = /^\$|\.\$/; 

function getAllSymbolsQualified(
    g: QualifiedGrammar | SelectionGrammar
): string[] {
    return Object.keys(g.symbols)
                 .filter(s => !symbolExcluderRegex.test(s));
}