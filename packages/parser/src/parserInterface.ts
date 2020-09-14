import {State, ConcatState, UnionState, JoinState, SymbolTable, EmbedState, ProjectionState, LiteralState, StringDict, RenameState, AnyCharState, RepetitionState, TrivialState, NegationState} from "./stateMachine";
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

export function Not(child: State): State {
    return new NegationState(child);
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

export function Any(tier: string): State {
    return new AnyCharState(tier);
}

export function Rep(child: State, minReps=0, maxReps=Infinity) {
    return new RepetitionState(new TrivialState(), minReps, maxReps, 0, child);
}

/*
export const text = Literalizer("text");
export const unrelated = Literalizer("unrelated");
export const t1 = Literalizer("t1");
export const t2 = Literalizer("t2");
export const t3 = Literalizer("t3");


const symbolTable = { "hi2bye" : Join(t1("hi"), Seq(t1("hi"), t2("bye"))) };
    const grammar = Seq(Emb("hi2bye", symbolTable), t2("world")); 
    const outputs = [...grammar.run()];

    */