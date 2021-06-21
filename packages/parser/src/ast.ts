import { CounterStack, Uni, State, Lit, Emb, Seq, Epsilon, Namespace, Maybe, Not, Join, Filter, BrzEpsilon, LiteralState, Rename, RenameState, Hide, Rep, Any, Reveal, BrzConcat, BrzUnion, StrictJoinState, StrictFilterState, NegationState, EmbedState } from "./stateMachine";
import { bigUnion, setUnion } from "./util";

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

    public qualifyNames(namespaceStack: AstNamespace[]) { }
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

    public qualifyNames(namespaceStack: AstNamespace[]): void {
        for (const child of this.children) {
            child.qualifyNames(namespaceStack);
        }
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

abstract class AstBinary extends AstComponent {

    constructor(
        public child1: AstComponent,
        public child2: AstComponent
    ) {
        super();
    }
    
    public qualifyNames(namespaceStack: AstNamespace[]): void {
        this.child1.qualifyNames(namespaceStack);
        this.child2.qualifyNames(namespaceStack);
    }

    public getTapes(stack: CounterStack): Set<string> {
        if (this._tapes == undefined) {
            this._tapes = setUnion(this.child1.getTapes(stack),
                                   this.child2.getTapes(stack));
        }
        return this._tapes;
    }
}


class AstJoin extends AstBinary {

    public getBrzExpr(): State {
        const left = this.child1.getBrzExpr();
        const right = this.child2.getBrzExpr();
        return new StrictJoinState(left, right);
    }
}

class AstFilter extends AstBinary {

    public getBrzExpr(): State {
        const left = this.child1.getBrzExpr();
        const right = this.child2.getBrzExpr();
        return new StrictJoinState(left, right);
    }

}

abstract class AstUnary extends AstComponent {

    constructor(
        public child: AstComponent
    ) {
        super();
    }

    public qualifyNames(namespaceStack: AstNamespace[]): void {
        this.child.qualifyNames(namespaceStack);
    }

    public getTapes(stack: CounterStack): Set<string> {
        if (this._tapes == undefined) {
            this._tapes = this.child.getTapes(stack);
        }
        return this._tapes;
    }
}

class AstNegation extends AstUnary {

    public getBrzExpr(): State {
        const expr = this.child.getBrzExpr();
        return new NegationState(expr);
    }
}

class AstNamespace extends AstComponent {

    constructor(
        public name: string
    ) {
        super();
    }

    public qualifiedNames: Map<string, string> = new Map();
    public symbols: Map<string, AstComponent> = new Map();
    
    public qualifyNames(namespaceStack: AstNamespace[]): void {
        
        const namePrefix = namespaceStack.map(n => n.name).join(".");
        for (const symbolName of this.qualifiedNames.keys()) {
            this.qualifiedNames.set(symbolName, `${namePrefix}.${symbolName}`);
        }
        
        const newStack = [ this, ...namespaceStack ];
        for (const symbol of this.symbols.values()) {
            symbol.qualifyNames(namespaceStack);
        }
    }

    public getQualifiedName(symbolName: string): string | undefined {
        return this.qualifiedNames.get(symbolName);
    }

    /**
     * Although an AstNamespace contains many children,
     * upon evaluation it acts as if it's its last-defined
     * symbol -- so its tapes are the tapes of the last symbol.
     */
    public getTapes(stack: CounterStack): Set<string> {
        if (this._tapes == undefined) {
            const [lastChild] = [...this.symbols.values()].slice(-1);
            this._tapes = lastChild.getTapes(stack);
        }
        return this._tapes;
    }

    /**
     * The Brz expression for a Namespace object is that of 
     * its last-defined child.  (Note that JS Maps are ordered;
     * you can rely on the last-entered entry to be the last
     * entry when you iterate.)
     */
    public getBrzExpr(): State {
        const [lastChild] = [...this.symbols.values()].slice(-1);
        return lastChild.getBrzExpr();
    }

}

class AstEmbed extends AstComponent {

    public qualifiedName: string | undefined = undefined;
    
    constructor(
        public name: string
    ) {
        super();
    }
        
    public qualifyNames(namespaceStack: AstNamespace[]): void {
        for (const namespace of namespaceStack) {
            this.qualifiedName = namespace.getQualifiedName(this.name);
            if (this.qualifiedName != undefined) {
                return;
            }
        }
    }

    public getTapes(stack: CounterStack): Set<string> {
        throw new Error("not yet implemented");
    }

    public getBrzExpr(): State {
        throw new Error("not yet implemented");
    }
}
