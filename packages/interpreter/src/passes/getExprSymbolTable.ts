import { children } from "../components.js";
import { Expr, SelectionExpr } from "../exprs.js";
import { Dict } from "../utils/func.js";

export function getExprSymbolTable(
    e: Expr
): Dict<Expr> | undefined {
    switch (e.tag) {
        case "SelectionExpr":
            return getExprSymbolTableSelection(e as SelectionExpr);
                    // Expr is an ancestor class, not a type union, so we have
                    // to hint the type here
        default: 
            return getExprSymbolTableDefault(e);
    }
}


function getExprSymbolTableDefault(e: Expr): Dict<Expr> | undefined {
    for (const c of children(e)) {
        const symbols = getExprSymbolTable(c);
        if (symbols !== undefined) {
            return symbols;
        }
    }
    return undefined;
}

function getExprSymbolTableSelection(e: SelectionExpr): Dict<Expr> | undefined {
    return e.symbols;
}

export function setExprSymbolTable(
    e: Expr,
    symbols: Dict<Expr>
): void {
    switch (e.tag) {
        case "SelectionExpr":
            return setExprSymbolTableSelection(e as SelectionExpr, symbols);
        default: 
            return setExprSymbolTableDefault(e, symbols);
    }
}


function setExprSymbolTableDefault(
    e: Expr,
    symbols: Dict<Expr>
): void {
    for (const c of children(e)) {
        setExprSymbolTable(c, symbols);
    }
}

function setExprSymbolTableSelection(
    e: SelectionExpr,
    symbols: Dict<Expr>
): void {
    e.symbols = symbols;
}

