import { CounterStack, Uni, State, Lit, Emb, Seq, Epsilon, Namespace, Maybe, Not, Join, Filter, BrzEpsilon, LiteralState, Rename, RenameState, Hide, Rep, Any, Reveal, BrzConcat, BrzUnion } from "./stateMachine";
import { bigUnion } from "./util";

/* CONVENIENCE FUNCTIONS */

function makeListExpr(
    children: State[], 
    constr: new (c1: State, c2: State) => State,
    nullResult: State, 
): State {
    if (children.length == 0) {
        return nullResult;
    }
    if (children.length == 1) {
        return children[0];
    }
    const head = children[0];
    const tail = makeListExpr(children.slice(1), constr, nullResult);
    return new constr(head, tail);
}


abstract class AstComponent {

    protected _tapes: Set<string> | undefined = new Set();

    public get tapes(): Set<string> {
        if (this._tapes == undefined) {
            const stack = new CounterStack(2);
            this._tapes = this.getTapes(stack);
        }
        return this._tapes;
    }

    public abstract getTapes(stack: CounterStack): Set<string>;

    public abstract getBrzExpr(): State;

}

abstract class AstNAry extends AstComponent {

    constructor(
        public children: AstComponent[]
    ) {
        super();
    }
    
    public getTapes(stack: CounterStack): Set<string> {
        if (this._tapes == undefined) {
            this._tapes = bigUnion(this.children.map(s => s.getTapes(stack)));
        }
        return this._tapes;
    }
}

class AstSequence extends AstNAry {

    public getBrzExpr(): State {
        const childSymbols = this.children.map(s => s.getBrzExpr());
        return makeListExpr(childSymbols, BrzConcat, Epsilon());
    }
}

class AstAlternation extends AstNAry {

    public getBrzExpr(): State {
        const childSymbols = this.children.map(s => s.getBrzExpr());
        return makeListExpr(childSymbols, BrzUnion, Epsilon());
    }
}

class AstLiteral extends AstComponent {

    constructor(
        public tape: string,
        public value: string
    ) {
        super();
    }

    public getTapes(stack: CounterStack): Set<string> {
        if (this._tapes == undefined) {
            this._tapes = new Set([this.tape]);
        }
        return this._tapes;
    }

    public getBrzExpr(): State {
        return new LiteralState(this.tape, this.value);
    }
}