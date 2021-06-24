import { 
    CounterStack, 
    State, 
    LiteralState, 
    BrzConcat, 
    BrzUnion, 
    NegationState, 
    BrzEpsilon, 
    BrzNull, 
    INamespace, 
    EmbedState, 
    IntersectionState,
    AnyCharState,
    BrzStar
} from "./stateMachine";
import { TapeCollection } from "./tapes";
import { flatten, Gen, setDifference, StringDict } from "./util";

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


class AstError {

    constructor(
        public sheet: string,
        public row: number,
        public column: number,
        public severity: "error" | "warning",
        public shortMsg: string,
        public longMsg: string
    ) { }

}

/**
 * Abstract syntax tree (AST) components are responsible for the following
 * operations:
 * 
 *   * qualifying and resolving symbol names (e.g., figuring out that
 *     a particular reference to VERB refers to, say, the VERB symbol in the
 *     IntransitiveVerbs namespace, and qualifying that reference so that it
 *     uniquely identifies that symbol (e.g. "IntransitiveVerb.VERB")
 * 
 *   * working out what tapes a particular component refers to.  This is 
 *     necessary for some complex operations (like "startswith embed:X"); 
 *     it's too early to infer tapes when the sheet is parsed (X might refer
 *     to a symbol that hasn't been parsed at all yet), but it still has to 
 *     done before expressions are generated because otherwise we don't 
 *     always know what expressions to generate.
 * 
 *   * sanity-checking and generating certain errors/warnings, like 
 *     whether a symbol X actually has a defined referent, whether a 
 *     filter refers to tapes that the component it's filtering doesn't, etc.
 * 
 *   * finally, generating the Brzezowski expression corresponding to each 
 *     component.
 */

export abstract class AstComponent {

    public tapes: Set<string> | undefined = undefined;

    public abstract getChildren(): AstComponent[];

    public abstract getBrzExpr(ns: Root): State;
    
    public allSymbols(): Map<string, AstComponent> {
        const results: Map<string, AstComponent> = new Map();
        for (const child of this.getChildren()) {
            for (const [name, component] of child.allSymbols()) {
                if (results.has(name)) {
                    // shouldn't be possible due to alpha conversion, but check
                    throw new Error(`Name ${name} is defined twice`);
                }
                results.set(name, component);
            }
        }
        return results;
    }

    public calculateTapes(stack: CounterStack): Set<string> {
        if (this.tapes == undefined) {
            const childTapes = this.getChildren().map(
                                s => s.calculateTapes(stack));
            this.tapes = new Set(flatten(childTapes));
        }
        return this.tapes;
    }

    public qualifyNames(nsStack: AstNamespace[] = []): void {
        for (const child of this.getChildren()) {
            child.qualifyNames(nsStack);
        }
    }

    public sanityCheck(): AstError[] { 
        return flatten(this.getChildren().map(s => s.sanityCheck()));
    }

    public compile(): Root {
        const root = new Root();
        this.qualifyNames();
        const stack = new CounterStack(2);
        const tapes = this.calculateTapes(stack);
        this.sanityCheck();
        const expr = this.getBrzExpr(root);
        root.addSymbol("__MAIN__", expr);
        root.addTapes("__MAIN__", tapes);
        return root;
    }

}

abstract class AstAtomic extends AstComponent {

    public getChildren(): AstComponent[] { return []; }

}

class AstEpsilon extends AstAtomic {

    public calculateTapes(stack: CounterStack): Set<string> {
        if (this.tapes == undefined) {
            this.tapes = new Set();
        }
        return this.tapes;
    }

    public getBrzExpr(ns: Root): State {
        return new BrzEpsilon();
    }
}

class AstLiteral extends AstAtomic {

    constructor(
        public tape: string,
        public value: string
    ) {
        super();
    }

    public calculateTapes(stack: CounterStack): Set<string> {
        if (this.tapes == undefined) {
            this.tapes = new Set([this.tape]);
        }
        return this.tapes;
    }

    public getBrzExpr(ns: Root): State {
        return new LiteralState(this.tape, this.value);
    }
}

abstract class AstNAry extends AstComponent {

    constructor(
        public children: AstComponent[]
    ) {
        super();
    }
    
    public getChildren(): AstComponent[] { 
        return this.children; 
    }

}

class AstSequence extends AstNAry {

    public getBrzExpr(ns: Root): State {
        const childSymbols = this.children.map(s => s.getBrzExpr(ns));
        return makeListExpr(childSymbols, BrzConcat, new BrzEpsilon());
    }
}

class AstAlternation extends AstNAry {

    public getBrzExpr(ns: Root): State {
        const childSymbols = this.children.map(s => s.getBrzExpr(ns));
        return makeListExpr(childSymbols, BrzUnion, new BrzNull());
    }
}

abstract class AstBinary extends AstComponent {

    constructor(
        public child1: AstComponent,
        public child2: AstComponent
    ) {
        super();
    }
    
    public getChildren(): AstComponent[] { 
        return [this.child1, this.child2];
    }
}


class AstIntersection extends AstBinary {

    public getBrzExpr(ns: Root): State {
        const left = this.child1.getBrzExpr(ns);
        const right = this.child2.getBrzExpr(ns);
        return new IntersectionState(left, right);
    }
}

function fillOutWithDotStar(state: State, tapes: Set<string>) {
    for (const tape of tapes) {
        const dot = new AnyCharState(tape);
        const dotStar = new BrzStar(dot);
        state = new BrzConcat(state, dotStar);
    } 
    return state;
}

class AstJoin extends AstBinary {

    public getBrzExpr(ns: Root): State {
        if (this.child1.tapes == undefined || this.child2.tapes == undefined) {
            throw new Error("Getting Brz expression with undefined tapes");
        }

        const child1OnlyTapes = setDifference(this.child1.tapes, this.child2.tapes);
        const child2OnlyTapes = setDifference(this.child2.tapes, this.child1.tapes);

        const child1 = this.child1.getBrzExpr(ns);
        const child1Etc = fillOutWithDotStar(child1, child2OnlyTapes);
        const child2 = this.child2.getBrzExpr(ns);
        const child2Etc = fillOutWithDotStar(child2, child1OnlyTapes);
        return new IntersectionState(child1Etc, child2Etc);
    }

}

class AstFilter extends AstBinary {

    public getBrzExpr(ns: Root): State {
        if (this.child1.tapes == undefined || this.child2.tapes == undefined) {
            throw new Error("Getting Brz expression with undefined tapes");
        }

        const child1OnlyTapes = setDifference(this.child1.tapes, this.child2.tapes);

        const child1 = this.child1.getBrzExpr(ns);
        const child2 = this.child2.getBrzExpr(ns);
        const child2Etc = fillOutWithDotStar(child2, child1OnlyTapes);
        return new IntersectionState(child1, child2Etc);
    }
}

abstract class AstUnary extends AstComponent {

    constructor(
        public child: AstComponent
    ) {
        super();
    }

    public getChildren(): AstComponent[] { 
        return [this.child]; 
    }
}

class AstNegation extends AstUnary {

    public getBrzExpr(ns: Root): State {
        const expr = this.child.getBrzExpr(ns);
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

    public allSymbols(): Map<string, AstComponent> {
        const results: Map<string, AstComponent> = new Map();
        for (const [name, component] of this.symbols) {
            const newName = [this.name, name].join(".");
            results.set(newName, component);
        }

        for (const child of this.getChildren()) {
            for (const [name, component] of child.allSymbols()) {
                if (results.has(name)) {
                    // shouldn't be possible but check
                    throw new Error(
                        `Name ${name} is defined twice in namespace ${this.name}`);
                }
                const newName = [this.name, name].join(".");
                results.set(newName, component);
            }
        }
        return results;
    }

    public addSymbol(symbolName: string, component: AstComponent) {

        if (symbolName.indexOf(".") != -1) {
            throw new Error(`Symbol names cannot have . in them`);
        }

        const symbol = this.symbols.get(symbolName);
        if (symbol != undefined) {
            throw new Error(`Symbol ${symbolName} already defined.`);
        }
        this.symbols.set(symbolName, component);
    }

    public getChildren(): AstComponent[] { 
        return [...this.symbols.values()]; 
    }

    public calculateQualifiedName(name: string, nsStack: AstNamespace[]) {
        const namePrefixes = nsStack.map(n => n.name);
        return [...namePrefixes, name].join(".");
    }
    
    public qualifyNames(nsStack: AstNamespace[] = []): void {
        const newStack = [ ...nsStack, this ];
        for (const [symbolName, referent] of this.symbols) {
            const newName = this.calculateQualifiedName(symbolName, newStack);
            this.qualifiedNames.set(symbolName, newName);
            referent.qualifyNames(newStack);
        }
    }

    public resolveName(
        symbolName: string, 
        nsStack: AstNamespace[]
    ): [string, AstComponent] | undefined {

        // split into (potentially) namespace prefix(es) and symbol name
        const namePieces = symbolName.split(".");

        // it's got no namespace prefix, it's a symbol name
        if (namePieces.length == 1) {

            const referent = this.symbols.get(symbolName);

            if (referent == undefined) {
                // it's not a symbol assigned in this namespace
                return undefined;
            }
            
            // it IS a symbol defined in this namespace,
            // so get the fully-qualified name.  we can't just grab this
            // from this.qualifiedNames because that may not have been
            // filled out yet
            const newName = this.calculateQualifiedName(symbolName, nsStack);
            return [newName, referent];
        }

        // it's got a namespace prefix
        const child = this.symbols.get(namePieces[0]);
        if (child == undefined || !(child instanceof AstNamespace)) {
            // but it's not a child of this namespace
            return undefined;
        }

        // this namespace has a child of the correct name
        const remnant = namePieces.slice(1).join(".");
        const newStack = [ ...nsStack, child ];
        return child.resolveName(remnant, newStack);  // try the child
    }

    /**
     * Although an AstNamespace contains many children,
     * upon evaluation it acts as if it's its last-defined
     * symbol -- so its tapes are the tapes of the last symbol,
     * rather than the union of its children's tapes.
     */
    public calculateTapes(stack: CounterStack): Set<string> {
        if (this.tapes == undefined) {
            this.tapes = new Set();
            for (const [name, referent] of this.symbols) {
                const tapes = referent.calculateTapes(stack);
                this.tapes = tapes;
            }
        }
        return this.tapes;
    }

    /**
     * The Brz expression for a Namespace object is that of 
     * its last-defined child.  (Note that JS Maps are ordered;
     * you can rely on the last-entered entry to be the last
     * entry when you iterate.)
     */
    public getBrzExpr(ns: Root): State {

        let expr: State = new BrzEpsilon();

        for (const [name, referent] of this.symbols) {
            const qualifiedName = this.qualifiedNames.get(name);
            if (qualifiedName == undefined) {
                throw new Error("Getting Brz expressions without having qualified names yet");
            }
            if (referent.tapes == undefined) {
                throw new Error("Getting Brz expressions without having calculated tapes");
            }
            expr = referent.getBrzExpr(ns);
            ns.addSymbol(qualifiedName, expr);
            ns.addTapes(qualifiedName, referent.tapes);
        }
        return expr;
    }
}

class AstEmbed extends AstAtomic {

    public qualifiedName: string;
    public referent: AstComponent = Epsilon();

    constructor(
        public name: string
    ) {
        super();
        this.qualifiedName = name;
    }
        
    public qualifyNames(nsStack: AstNamespace[] = []): void {
        for (let i = nsStack.length-1; i >=0; i--) {
            // we go down the stack asking each to resolve it
            const subStack = nsStack.slice(0, i+1);
            const resolution = nsStack[i].resolveName(this.name, subStack);
            if (resolution == undefined) {
                continue;
            }
            const [qualifiedName, referent] = resolution;
            this.qualifiedName = qualifiedName;
            this.referent = referent;
        }
    }

    public calculateTapes(stack: CounterStack): Set<string> {
        if (this.tapes == undefined) {
            if (stack.exceedsMax(this.qualifiedName)) {
                this.tapes = new Set();
            } else {
                const newStack = stack.add(this.qualifiedName);
                this.tapes = this.referent.calculateTapes(newStack);
            }
        }
        return this.tapes;
    }

    public getBrzExpr(ns: Root): State {
        return new EmbedState(this.qualifiedName, ns);
    }
}

class Root implements INamespace {

    constructor(
        public symbols: Map<string, State> = new Map(),
        public tapes: Map<string, Set<string>> = new Map()
    ) { }

    public addSymbol(name: string, state: State): void {
        if (this.symbols.has(name)) {
            // shouldn't happen due to alpha conversion, but check
            throw new Error(`Redefining symbol ${name}`);
        }
        this.symbols.set(name, state);
    }
    
    public addTapes(name: string, tapes: Set<string>): void {
        this.tapes.set(name, tapes);
    }

    public register(symbolName: string): void { }

    public getSymbol(
        name: string, 
        stack: CounterStack | undefined = undefined
    ): State | undefined {
        return this.symbols.get(name);
    }
    
    public allSymbols(): string[] {
        return [...this.symbols.keys()];
    }

    public getTapes(
        name: string
    ): Set<string> {
        const tapes = this.tapes.get(name);
        if (tapes == undefined) {
            return new Set();
        }
        return tapes;
    }

    public compileSymbol(
        name: string, 
        allTapes: TapeCollection, 
        stack: CounterStack,
        compileLevel: number
    ): void { }

    public *generate(
        symbolName: string = "__MAIN__",
        random: boolean = false,
        maxRecursion: number = 4, 
        maxChars: number = 1000
    ): Gen<StringDict> {
        const expr = this.getSymbol(symbolName);
        if (expr == undefined) {
            throw new Error(`Cannot generate from undefined symbol ${symbolName}`);
        }
        expr.generate(random, maxRecursion, maxChars);
    }

}

export function Seq(...children: AstComponent[]): AstSequence {
    return new AstSequence(children);
}

export function Uni(...children: AstComponent[]): AstAlternation {
    return new AstAlternation(children);
}

export function Lit(tape: string, text: string): AstLiteral {
    return new AstLiteral(tape, text);
}

export function Intersect(child1: AstComponent, child2: AstComponent): AstIntersection {
    return new AstIntersection(child1, child2);
}

export function Filter(child1: AstComponent, child2: AstComponent): AstFilter {
    return new AstFilter(child1, child2);
}

export function Join(child1: AstComponent, child2: AstComponent): AstJoin {
    return new AstJoin(child1, child2);
}

export function Epsilon(): AstEpsilon {
    return new AstEpsilon();
}

export function Embed(name: string): AstEmbed {
    return new AstEmbed(name);
}

export function Ns(
    name: string, 
    symbols: {[name: string]: AstComponent} = {}
): AstNamespace {
    const result = new AstNamespace(name);
    for (const [symbolName, component] of Object.entries(symbols)) {
        result.addSymbol(symbolName, component);
    }
    return result;
}