import {State, ConcatState, UnionState, JoinState, SymbolTable, EmbedState, ProjectionState, LiteralState, StringDict, RenameState} from "./stateMachine";

export {State, SymbolTable, StringDict};

export function Lit(tier: string, text: string): State {
    return new LiteralState(tier, text);
}

export function Literalizer(tier: string) {
    return function(text: string) {
        return Lit(tier, text);
    }
}

export function Seq(...children: State[]): State {
    if (children.length == 0) {
        throw new Error("Sequences must have at least 1 child");
    }

    if (children.length == 1) {
        return children[0];
    }

    return new ConcatState(children[0], Seq(...children.slice(1)));
}

export function Uni(...children: State[]): State {
    return new UnionState(children);
}

export function Join(child1: State, child2: State): State {
    return new JoinState(child1, child2);
}

export function Emb(symbolName: string, symbolTable: SymbolTable): State {
    return new EmbedState(symbolName, symbolTable);
}

export function Proj(child: State, ...tiers: string[]): State {
    return new ProjectionState(child, new Set(tiers));
}

export function Rename(child: State, fromTier: string, toTier: string): State {
    return new RenameState(child, fromTier, toTier);
}