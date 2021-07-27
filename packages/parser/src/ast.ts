import { 
    CounterStack, 
    Expr, 
    EPSILON,
    INamespace, 
    constructRepeat,
    constructSequence,
    constructAlternation,
    constructBinaryConcat,
    constructIntersection,
    constructStar,
    constructLiteral,
    constructDot,
    constructEmbed,
    constructRename,
    constructNegation,
    NULL,
    constructMemo
} from "./derivs";
import { parseCells } from "./sheetParser";
import { RenamedTape, StringTape, Tape, TapeCollection } from "./tapes";
import { CellPosition, flatten, Gen, setDifference, StringDict } from "./util";

export { CounterStack, Expr };

class AstError {

    constructor(
        public pos: CellPosition,
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
 *   * finally, generating the Brzozowski expression corresponding to each 
 *     component.
 */

export abstract class AstComponent {

    public pos: CellPosition = new CellPosition();

    public tapes: Set<string> | undefined = undefined;

    public abstract getChildren(): AstComponent[];

    public abstract constructExpr(ns: Root): Expr;

    
    /**
     * Collects all explicitly mentioned characters in the grammar for all tapes.
     * 
     * @param tapes A TapeCollection for holding found characters
     * @param stack What symbols we've already collected from, to prevent inappropriate recursion
     * @returns vocab 
     */
    public collectVocab(tapes: Tape, stack: string[] = []): void { 
        for (const child of this.getChildren()) {
            child.collectVocab(tapes, stack);
        }
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

    public getRoot(): Root {
        const root = new Root();
        this.qualifyNames();
        const stack = new CounterStack(2);
        const tapes = this.calculateTapes(stack);
        const expr = this.constructExpr(root);
        root.addComponent("__MAIN__", this);
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

    public constructExpr(ns: Root): Expr {
        return EPSILON;
    }
}

class AstNull extends AstAtomic {

    public calculateTapes(stack: CounterStack): Set<string> {
        if (this.tapes == undefined) {
            this.tapes = new Set();
        }
        return this.tapes;
    }

    public constructExpr(ns: Root): Expr {
        return NULL;
    }
}


export class AstLiteral extends AstAtomic {

    constructor(
        public tape: string,
        public text: string
    ) {
        super();
    }

    public collectVocab(tapes: Tape, stack: string[] = []): void {
        tapes.tokenize(this.tape, this.text);
    }

    public calculateTapes(stack: CounterStack): Set<string> {
        if (this.tapes == undefined) {
            this.tapes = new Set([this.tape]);
        }
        return this.tapes;
    }

    public constructExpr(ns: Root): Expr {
        return constructLiteral(this.tape, this.text);
    }
}

class AstDot extends AstAtomic {

    constructor(
        public tape: string
    ) {
        super();
    }

    public collectVocab(tapes: Tape, stack: string[] = []): void {
        tapes.tokenize(this.tape, "");
    }

    public calculateTapes(stack: CounterStack): Set<string> {
        if (this.tapes == undefined) {
            this.tapes = new Set([this.tape]);
        }
        return this.tapes;
    }

    public constructExpr(ns: Root): Expr {
        return constructDot(this.tape);
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

export class AstSequence extends AstNAry {

    public constructExpr(ns: Root): Expr {
        const childExprs = this.children.map(s => s.constructExpr(ns));
        return constructSequence(...childExprs);
    }

    public append(newChild: AstComponent): AstComponent {
        return Seq(...this.children, newChild);
    }

    public finalChild(): AstComponent {
        if (this.children.length == 0) {
            // shouldn't be possible so long as client used constructX methods,
            // but just in case
            return Epsilon();
        }
        return this.children[this.children.length-1];
    }

    public nonFinalChildren(): AstComponent[] {
        if (this.children.length <= 1) {
            return [];
        }
        return this.children.slice(0, this.children.length-1);
    }
}

class AstAlternation extends AstNAry {

    public constructExpr(ns: Root): Expr {
        const childExprs = this.children.map(s => s.constructExpr(ns));
        return constructAlternation(...childExprs);
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

    public constructExpr(ns: Root): Expr {
        const left = this.child1.constructExpr(ns);
        const right = this.child2.constructExpr(ns);
        return constructIntersection(left, right);
    }
}

function fillOutWithDotStar(state: Expr, tapes: Set<string>) {
    for (const tape of tapes) {
        const dot = constructDot(tape);
        const dotStar = constructStar(dot);
        state = constructBinaryConcat(state, dotStar);
    } 
    return state;
}

class AstJoin extends AstBinary {

    public constructExpr(ns: Root): Expr {
        if (this.child1.tapes == undefined || this.child2.tapes == undefined) {
            throw new Error("Getting Brz expression with undefined tapes");
        }

        const child1OnlyTapes = setDifference(this.child1.tapes, this.child2.tapes);
        const child2OnlyTapes = setDifference(this.child2.tapes, this.child1.tapes);

        const child1 = this.child1.constructExpr(ns);
        const child1Etc = fillOutWithDotStar(child1, child2OnlyTapes);
        const child2 = this.child2.constructExpr(ns);
        const child2Etc = fillOutWithDotStar(child2, child1OnlyTapes);
        return constructIntersection(child1Etc, child2Etc);
    }

}

class AstFilter extends AstBinary {

    public constructExpr(ns: Root): Expr {
        if (this.child1.tapes == undefined || this.child2.tapes == undefined) {
            throw new Error("Getting Brz expression with undefined tapes");
        }

        const child1OnlyTapes = setDifference(this.child1.tapes, this.child2.tapes);

        const child1 = this.child1.constructExpr(ns);
        const child2 = this.child2.constructExpr(ns);
        const child2Etc = fillOutWithDotStar(child2, child1OnlyTapes);
        return constructIntersection(child1, child2Etc);
    }
}

class AstStartsWith extends AstBinary {

    public constructExpr(ns: Root): Expr {
        if (this.child1.tapes == undefined || this.child2.tapes == undefined) {
            throw new Error("Getting Brz expression with undefined tapes");
        }

        const child1OnlyTapes = setDifference(this.child1.tapes, this.child2.tapes);

        const child1 = this.child1.constructExpr(ns);
        var child2 = this.child2.constructExpr(ns);

        for (const tape of this.child2.tapes) {
            const dot = constructDot(tape);
            const dotStar = constructStar(dot);
            child2 = constructBinaryConcat(child2, dotStar);
        }

        const child2Etc = fillOutWithDotStar(child2, child1OnlyTapes);
        return constructIntersection(child1, child2Etc);
    }

}

class AstEndsWith extends AstBinary {

    public constructExpr(ns: Root): Expr {
        if (this.child1.tapes == undefined || this.child2.tapes == undefined) {
            throw new Error("Getting Brz expression with undefined tapes");
        }

        const child1OnlyTapes = setDifference(this.child1.tapes, this.child2.tapes);

        const child1 = this.child1.constructExpr(ns);
        var child2 = this.child2.constructExpr(ns);

        for (const tape of this.child2.tapes) {
            const dot = constructDot(tape);
            const dotStar = constructStar(dot);
            child2 = constructBinaryConcat(dotStar, child2);
        }

        const child2Etc = fillOutWithDotStar(child2, child1OnlyTapes);
        return constructIntersection(child1, child2Etc);
    }

}


class AstContains extends AstBinary {

    public constructExpr(ns: Root): Expr {
        if (this.child1.tapes == undefined || this.child2.tapes == undefined) {
            throw new Error("Getting Brz expression with undefined tapes");
        }

        const child1OnlyTapes = setDifference(this.child1.tapes, this.child2.tapes);

        const child1 = this.child1.constructExpr(ns);
        var child2 = this.child2.constructExpr(ns);

        for (const tape of this.child2.tapes) {
            const dot = constructDot(tape);
            const dotStar = constructStar(dot);
            child2 = constructSequence(dotStar, child2, dotStar);
        }

        const child2Etc = fillOutWithDotStar(child2, child1OnlyTapes);
        return constructIntersection(child1, child2Etc);
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

class AstRename extends AstUnary {

    constructor(
        child: AstComponent,
        public fromTape: string,
        public toTape: string
    ) {
        super(child);
    }

    public collectVocab(tapes: Tape, stack: string[] = []): void {
        tapes = new RenamedTape(tapes, this.fromTape, this.toTape);
        this.child.collectVocab(tapes, stack);
    }

    public calculateTapes(stack: CounterStack): Set<string> {
        if (this.tapes == undefined) {
            this.tapes = new Set();
            for (const tapeName of this.child.calculateTapes(stack)) {
                if (tapeName == this.fromTape) {
                    this.tapes.add(this.toTape);
                } else {
                    this.tapes.add(tapeName);
                }
            }
        }
        return this.tapes;
    }
    
    public constructExpr(ns: Root): Expr {
        const childExpr = this.child.constructExpr(ns);
        return constructRename(childExpr, this.fromTape, this.toTape);
    }
}

class AstRepeat extends AstUnary {

    constructor(
        child: AstComponent,
        public minReps: number = 0,
        public maxReps: number = Infinity
    ) {
        super(child);
    }

    public constructExpr(ns: Root): Expr {
        const childExpr = this.child.constructExpr(ns);
        return constructRepeat(childExpr, this.minReps, this.maxReps);
    }
}

class AstNegation extends AstUnary {

    public constructExpr(ns: Root): Expr {
        if (this.child.tapes == undefined) {
            throw new Error("Getting Brz expression with undefined tapes");
        }

        const childExpr = this.child.constructExpr(ns);
        return constructNegation(childExpr, this.child.tapes);
    }
}

class AstHide extends AstUnary {

    public toTape: string;

    constructor(
        child: AstComponent,
        public tape: string,
        name: string = ""
    ) {
        super(child);
        if (name == "") {
            name = `HIDDEN${HIDE_INDEX}`;
            HIDE_INDEX++;
        }
        this.toTape = `__${name}_${tape}`;
    }

    public collectVocab(tapes: Tape, stack: string[] = []): void {
        tapes = new RenamedTape(tapes, this.tape, this.toTape);
        this.child.collectVocab(tapes, stack);
    }

    public calculateTapes(stack: CounterStack): Set<string> {
        if (this.tapes == undefined) {
            this.tapes = new Set();
            for (const tapeName of this.child.calculateTapes(stack)) {
                if (tapeName == this.tape) {
                    this.tapes.add(this.toTape);
                } else {
                    this.tapes.add(tapeName);
                }
            }
        }
        return this.tapes;
    }
    
    public sanityCheck(): AstError[] {
        const childErrors = super.sanityCheck();

        if (this.child.tapes == undefined) {
            throw new Error("Trying to sanity check before tapes are calculated");
        }

        if (!this.child.tapes.has(this.tape)) {
            const newError = new AstError(
                this.pos,
                "error",
                "Hiding missing tape",
                `The grammar to the left does not contain the tape ${this.tape}. Available tapes: [${[...this.child.tapes]}]`);
            childErrors.push(newError);
        }
        return childErrors;
    }

    public constructExpr(ns: Root): Expr {
        const childExpr = this.child.constructExpr(ns);
        return constructRename(childExpr, this.tape, this.toTape);
    }
}

export class AstNamespace extends AstComponent {

    constructor(
        public name: string
    ) {
        super();
    }

    public qualifiedNames: Map<string, string> = new Map();
    public symbols: Map<string, AstComponent> = new Map();

    public addSymbol(symbolName: string, component: AstComponent): void {

        if (symbolName.indexOf(".") != -1) {
            throw new Error(`Symbol names cannot have . in them`);
        }

        const symbol = this.resolveNameLocal(symbolName);
        if (symbol != undefined) {
            throw new Error(`Symbol ${symbolName} already defined.`);
        }
        this.symbols.set(symbolName, component);
    }

    public getSymbol(symbolName: string): AstComponent | undefined {
        return this.symbols.get(symbolName);
    }

    public allSymbols(): string[] {
        return [...this.symbols.keys()];
    }

    public getChildren(): AstComponent[] { 
        const results: AstComponent[] = [];
        for (const referent of this.symbols.values()) {
            if (results.indexOf(referent) == -1) {
                results.push(referent);
            }
        }
        return results;
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

    /**
     * Looks up an unqualified name in this namespace's symbol table,
     * case-insensitive.
     */
    public resolveNameLocal(name: string): [string, AstComponent] | undefined {
        for (const symbolName of this.symbols.keys()) {
            if (name.toLowerCase() == symbolName.toLowerCase()) {
                const referent = this.symbols.get(symbolName);
                if (referent == undefined) { return undefined; } // can't happen, just for linting
                return [symbolName, referent];
            }
        }
        return undefined;
    }

    public resolveName(
        unqualifiedName: string, 
        nsStack: AstNamespace[]
    ): [string, AstComponent] | undefined {

        // split into (potentially) namespace prefix(es) and symbol name
        const namePieces = unqualifiedName.split(".");

        // it's got no namespace prefix, it's a symbol name
        if (namePieces.length == 1) {

            const localResult = this.resolveNameLocal(unqualifiedName);

            if (localResult == undefined) {
                // it's not a symbol assigned in this namespace
                return undefined;
            }
            
            // it IS a symbol defined in this namespace,
            // so get the fully-qualified name.  we can't just grab this
            // from this.qualifiedNames because that may not have been
            // filled out yet
            const [localName, referent] = localResult;
            const newName = this.calculateQualifiedName(localName, nsStack);
            return [newName, referent];
        }

        // it's got a namespace prefix
        const child = this.resolveNameLocal(namePieces[0]);
        if (child == undefined) {
            // but it's not a child of this namespace
            return undefined;
        }

        const [localName, referent] = child;
        if (!(referent instanceof AstNamespace)) {
            // if symbol X isn't a namespace, "X.Y" can't refer to anything real
            return undefined;
        }

        // this namespace has a child of the correct name
        const remnant = namePieces.slice(1).join(".");
        const newStack = [ ...nsStack, referent ];
        return referent.resolveName(remnant, newStack);  // try the child
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
     * The same as calculateTapes and constructExpr, we only count
     * the last-defined symbol for this calculation
     */
    public collectVocab(tapes: Tape, stack: string[] = []): void {
        const children = [...this.symbols.values()];
        if (children.length == 0) {
            return;
        }
        const lastChild = children[children.length-1];
        lastChild.collectVocab(tapes, stack);
    }


    /**
     * The Brz expression for a Namespace object is that of 
     * its last-defined child.  (Note that JS Maps are ordered;
     * you can rely on the last-entered entry to be the last
     * entry when you iterate.)
     */
    public constructExpr(ns: Root): Expr {

        let expr: Expr = EPSILON;

        for (const [name, referent] of this.symbols) {
            const qualifiedName = this.qualifiedNames.get(name);
            if (qualifiedName == undefined) {
                throw new Error("Getting Brz expressions without having qualified names yet");
            }
            if (referent.tapes == undefined) {
                throw new Error("Getting Brz expressions without having calculated tapes");
            }
            expr = referent.constructExpr(ns);
            // memoize every expr
            expr = constructMemo(expr);
            ns.addComponent(qualifiedName, referent);
            ns.addSymbol(qualifiedName, expr);
            ns.addTapes(qualifiedName, referent.tapes);
        }
        return expr;
    }
}

class AstEmbed extends AstAtomic {

    public qualifiedName: string;
    public referent: AstComponent | undefined = undefined;

    constructor(
        public name: string
    ) {
        super();
        this.qualifiedName = name;
    }
        
    public sanityCheck(): AstError[] {
        if (this.referent == undefined) {
            return [ new AstError(
                this.pos, "error", "Unknown symbol",
                `Undefined symbol ${this.name}`)];
        }
        return [];
    }

    public qualifyNames(nsStack: AstNamespace[] = []): void {
        for (let i = nsStack.length-1; i >=0; i--) {
            // we go down the stack asking each to resolve it
            const subStack = nsStack.slice(0, i+1);
            const resolution = nsStack[i].resolveName(this.name, subStack);
            if (resolution != undefined) {              
                const [qualifiedName, referent] = resolution;
                this.qualifiedName = qualifiedName;
                this.referent = referent;
                break;
            }
        }
    }

    public calculateTapes(stack: CounterStack): Set<string> {
        if (this.tapes == undefined) {
            if (stack.exceedsMax(this.qualifiedName) || this.referent == undefined) {
                this.tapes = new Set();
            } else {
                const newStack = stack.add(this.qualifiedName);
                this.tapes = this.referent.calculateTapes(newStack);
            }
        }
        return this.tapes;
    }

    public collectVocab(tapes: Tape, stack: string[] = []): void {
        if (this.referent == undefined) {
            return; // failed to find the referent, so it's epsilon
        }
        if (stack.indexOf(this.qualifiedName) != -1) {
            return;
        }
        const newStack = [...stack, this.qualifiedName];
        this.referent.collectVocab(tapes, newStack);
    }

    public constructExpr(ns: Root): Expr {
        if (this.referent == undefined) {
            return EPSILON;
        }
        return constructEmbed(this.qualifiedName, ns);
    }
}

export class Root implements INamespace {

    constructor(
        public components: Map<string, AstComponent> = new Map(),
        public exprs: Map<string, Expr> = new Map(),
        public tapes: Map<string, Set<string>> = new Map()
    ) { }

    public addComponent(name: string, comp: AstComponent): void {
        if (this.components.has(name)) {
            // shouldn't happen due to alpha conversion, but check
            throw new Error(`Redefining symbol ${name}`);
        }
        this.components.set(name, comp);
    }

    public addSymbol(name: string, state: Expr): void {
        if (this.exprs.has(name)) {
            // shouldn't happen due to alpha conversion, but check
            throw new Error(`Redefining symbol ${name}`);
        }
        this.exprs.set(name, state);
    }
    
    public addTapes(name: string, tapes: Set<string>): void {
        this.tapes.set(name, tapes);
    }

    public register(symbolName: string): void { }

    public getSymbol(
        name: string, 
        stack: CounterStack | undefined = undefined
    ): Expr | undefined {
        return this.exprs.get(name);
    }

    public getComponent(name: string): AstComponent | undefined {
        return this.components.get(name);
    }
    

    public allSymbols(): string[] {
        return [...this.exprs.keys()];
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

        const component = this.components.get(symbolName);
        if (component == undefined) {
            throw new Error(`Cannot generate from undefined symbol ${symbolName}`);
        }
        const tapes = new TapeCollection();
        component.collectVocab(tapes);
        yield* expr.generate(tapes, random, maxRecursion, maxChars);
    }

}

export function Seq(...children: AstComponent[]): AstSequence {
    return new AstSequence(children);
}

export function Uni(...children: AstComponent[]): AstAlternation {
    return new AstAlternation(children);
}

export function Maybe(child: AstComponent): AstAlternation {
    return Uni(child, Epsilon());
}

export function Lit(tape: string, text: string): AstLiteral {
    return new AstLiteral(tape, text);
}

export function Any(tape: string): AstDot {
    return new AstDot(tape);
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

export function StartsWith(child1: AstComponent, child2: AstComponent): AstJoin {
    return new AstStartsWith(child1, child2);
}

export function EndsWith(child1: AstComponent, child2: AstComponent): AstJoin {
    return new AstEndsWith(child1, child2);
}

export function Contains(child1: AstComponent, child2: AstComponent): AstJoin {
    return new AstContains(child1, child2);
}

export function Rep(
    child: AstComponent, 
    minReps: number = 0, 
    maxReps: number = Infinity
) {
    return new AstRepeat(child, minReps, maxReps);
}

export function Epsilon(): AstEpsilon {
    return new AstEpsilon();
}

export function Null(): AstNull {
    return new AstNull();
}

export function Embed(name: string): AstEmbed {
    return new AstEmbed(name);
}

export function Rename(child: AstComponent, fromTape: string, toTape: string): AstRename {
    return new AstRename(child, fromTape, toTape);
}

export function Not(child: AstComponent): AstNegation {
    return new AstNegation(child);
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

let HIDE_INDEX = 0; 
export function Hide(child: AstComponent, tape: string, name: string = ""): AstHide {
    return new AstHide(child, tape, name);
}
