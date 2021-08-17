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
    constructMemo,
    constructMatch,
    SymbolTable
} from "./derivs";

import { RenamedTape, Tape, TapeCollection } from "./tapes";
import { Cell, DummyCell, flatten, Gen, setDifference, setUnion, StringDict } from "./util";

export { CounterStack, Expr };


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

    protected expr: Expr | undefined = undefined;
    public tapes: Set<string> | undefined = undefined;

    constructor(
        public cell: Cell
    ) { }

    public message(msg: any): void {
        this.cell.message(msg);
    }

    public abstract getChildren(): AstComponent[];

    public abstract constructExpr(symbols: SymbolTable): Expr;

    
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

    public runUnitTests(): void {
        this.qualifyNames();
        this.calculateTapes(new CounterStack(2));
        this.constructExpr({});
        this.runUnitTestsAux();
    }

    public runUnitTestsAux(): void {
        for (const child of this.getChildren()) {
            child.runUnitTestsAux();
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

    public qualifyNames(nsStack: AstNamespace[] = []): string[] {
        return flatten(this.getChildren().map(c => c.qualifyNames(nsStack)));
    }

    public getAllTapes(): TapeCollection {
        const tapes = new TapeCollection();
        this.collectVocab(tapes, []);
        return tapes;
    }

    public allSymbols(): string[] {
        return [];
    }
    
    public getSymbol(name: string): AstComponent | undefined {
        if (name == "") {
            return this;
        }
        return undefined;
    }

    public *generate(
        symbolName: string = "",
        query: StringDict = {},
        random: boolean = false,
        maxRecursion: number = 4, 
        maxChars: number = 1000
    ): Gen<StringDict> {

        this.qualifyNames();
        this.calculateTapes(new CounterStack(2));
        this.constructExpr({});

        let targetComponent = this.getSymbol(symbolName);
        if (targetComponent == undefined) {
            throw new Error(`Missing symbol: ${symbolName}`);
        }
        const allTapes = new TapeCollection();
        targetComponent.collectVocab(allTapes);

        if (Object.keys(query).length > 0) {
            const queryLiterals: AstComponent[] = [];
            for (const [key, value] of Object.entries(query)) {
                const lit = new AstLiteral(DUMMY_CELL, key, value);
                queryLiterals.push(lit);
            }
            const querySeq = new AstSequence(DUMMY_CELL, queryLiterals);
            targetComponent = new AstFilter(DUMMY_CELL, targetComponent, querySeq);
        }

        targetComponent.calculateTapes(new CounterStack(2));
        targetComponent.collectVocab(allTapes); // in case there's more vocab
        const expr = targetComponent.constructExpr({});
        yield* expr.generate(allTapes, random, maxRecursion, maxChars);
    }
}

abstract class AstAtomic extends AstComponent {

    public getChildren(): AstComponent[] { return []; }

}

export class AstEpsilon extends AstAtomic {

    public calculateTapes(stack: CounterStack): Set<string> {
        if (this.tapes == undefined) {
            this.tapes = new Set();
        }
        return this.tapes;
    }

    public constructExpr(symbols: SymbolTable): Expr {
        if (this.expr == undefined) {
            this.expr = EPSILON;
        }
        return this.expr;
    }
}

export class AstNull extends AstAtomic {

    public calculateTapes(stack: CounterStack): Set<string> {
        if (this.tapes == undefined) {
            this.tapes = new Set();
        }
        return this.tapes;
    }

    public constructExpr(symbols: SymbolTable): Expr {
        if (this.expr == undefined) {
            return NULL;
        }
        return this.expr;
    }
}


export class AstLiteral extends AstAtomic {

    constructor(
        cell: Cell,
        public tape: string,
        public text: string
    ) {
        super(cell);
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

    public constructExpr(symbols: SymbolTable): Expr {
        if (this.expr == undefined) {
            this.expr = constructLiteral(this.tape, this.text);
        }
        return this.expr;
    }
}

export class AstDot extends AstAtomic {

    constructor(
        cell: Cell,
        public tape: string
    ) {
        super(cell);
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

    public constructExpr(symbols: SymbolTable): Expr {
        if (this.expr == undefined) {
            this.expr = constructDot(this.tape);
        }
        return this.expr;
    }
}

abstract class AstNAry extends AstComponent {

    constructor(
        cell: Cell,
        public children: AstComponent[]
    ) {
        super(cell);
    }
    
    public getChildren(): AstComponent[] { 
        return this.children; 
    }
}

export class AstSequence extends AstNAry {

    public constructExpr(symbols: SymbolTable): Expr {
        if (this.expr == undefined) {        
            const childExprs = this.children.map(s => s.constructExpr(symbols));
            this.expr = constructSequence(...childExprs);
        }
        return this.expr;
    }

    public finalChild(): AstComponent {
        if (this.children.length == 0) {
            // shouldn't be possible so long as client used constructX methods,
            // but just in case
            return new AstEpsilon(DUMMY_CELL);
        }
        return this.children[this.children.length-1];
    }

    public nonFinalChildren(): AstComponent[] {
        if (this.children.length <= 1) {
            // shouldn't be possible so long as client used constructX methods,
            // but just in case
            return [];
        }
        return this.children.slice(0, this.children.length-1);
    }
}

export class AstAlternation extends AstNAry {

    public constructExpr(symbols: SymbolTable): Expr {
        if (this.expr == undefined) {
            const childExprs = this.children.map(s => s.constructExpr(symbols));
            this.expr = constructAlternation(...childExprs);
        } 
        return this.expr;
    }
}

abstract class AstBinary extends AstComponent {

    constructor(
        cell: Cell,
        public child1: AstComponent,
        public child2: AstComponent
    ) {
        super(cell);
    }
    
    public getChildren(): AstComponent[] { 
        return [this.child1, this.child2];
    }
}

export class AstIntersection extends AstBinary {

    public constructExpr(symbols: SymbolTable): Expr {
        if (this.expr == undefined) {
            const left = this.child1.constructExpr(symbols);
            const right = this.child2.constructExpr(symbols);
            this.expr = constructIntersection(left, right);
        }
        return this.expr;
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

export class AstJoin extends AstBinary {

    public constructExpr(symbols: SymbolTable): Expr {
        if (this.expr == undefined) {
            if (this.child1.tapes == undefined || this.child2.tapes == undefined) {
                throw new Error("Getting Brz expression with undefined tapes");
            }

            const child1OnlyTapes = setDifference(this.child1.tapes, this.child2.tapes);
            const child2OnlyTapes = setDifference(this.child2.tapes, this.child1.tapes);

            const child1 = this.child1.constructExpr(symbols);
            const child1Etc = fillOutWithDotStar(child1, child2OnlyTapes);
            const child2 = this.child2.constructExpr(symbols);
            const child2Etc = fillOutWithDotStar(child2, child1OnlyTapes);
            this.expr = constructIntersection(child1Etc, child2Etc);
        }
        return this.expr;
    }

}

export class AstFilter extends AstBinary {

    public constructExpr(symbols: SymbolTable): Expr {
        if (this.expr == undefined) {
            if (this.child1.tapes == undefined || this.child2.tapes == undefined) {
                throw new Error("Getting Brz expression with undefined tapes");
            }

            const child1OnlyTapes = setDifference(this.child1.tapes, this.child2.tapes);

            const child1 = this.child1.constructExpr(symbols);
            const child2 = this.child2.constructExpr(symbols);
            const child2Etc = fillOutWithDotStar(child2, child1OnlyTapes);
            this.expr = constructIntersection(child1, child2Etc);
        }
        return this.expr;

    }
}

export class AstStartsWith extends AstBinary {

    public constructExpr(symbols: SymbolTable): Expr {
        if (this.expr == undefined) {
            if (this.child1.tapes == undefined || this.child2.tapes == undefined) {
                throw new Error("Getting Brz expression with undefined tapes");
            }

            const child1OnlyTapes = setDifference(this.child1.tapes, this.child2.tapes);

            const child1 = this.child1.constructExpr(symbols);
            var child2 = this.child2.constructExpr(symbols);

            for (const tape of this.child2.tapes) {
                const dot = constructDot(tape);
                const dotStar = constructStar(dot);
                child2 = constructBinaryConcat(child2, dotStar);
            }

            const child2Etc = fillOutWithDotStar(child2, child1OnlyTapes);
            this.expr = constructIntersection(child1, child2Etc);
        }
        return this.expr;
    }

}

export class AstEndsWith extends AstBinary {

    public constructExpr(symbols: SymbolTable): Expr {
        if (this.expr == undefined) {
            if (this.child1.tapes == undefined || this.child2.tapes == undefined) {
                throw new Error("Getting Brz expression with undefined tapes");
            }

            const child1OnlyTapes = setDifference(this.child1.tapes, this.child2.tapes);

            const child1 = this.child1.constructExpr(symbols);
            var child2 = this.child2.constructExpr(symbols);

            for (const tape of this.child2.tapes) {
                const dot = constructDot(tape);
                const dotStar = constructStar(dot);
                child2 = constructBinaryConcat(dotStar, child2);
            }

            const child2Etc = fillOutWithDotStar(child2, child1OnlyTapes);
            this.expr = constructIntersection(child1, child2Etc);
        }
        return this.expr;
    }

}


export class AstContains extends AstBinary {

    public constructExpr(symbols: SymbolTable): Expr {
        if (this.expr == undefined) {
            if (this.child1.tapes == undefined || this.child2.tapes == undefined) {
                throw new Error("Getting Brz expression with undefined tapes");
            }

            const child1OnlyTapes = setDifference(this.child1.tapes, this.child2.tapes);

            const child1 = this.child1.constructExpr(symbols);
            var child2 = this.child2.constructExpr(symbols);

            for (const tape of this.child2.tapes) {
                const dot = constructDot(tape);
                const dotStar = constructStar(dot);
                child2 = constructSequence(dotStar, child2, dotStar);
            }

            const child2Etc = fillOutWithDotStar(child2, child1OnlyTapes);
            this.expr = constructIntersection(child1, child2Etc);
        }
        return this.expr;
    }

}

export class AstUnary extends AstComponent {

    constructor(
        cell: Cell,
        public child: AstComponent
    ) {
        super(cell);
    }

    public getChildren(): AstComponent[] { 
        return [this.child]; 
    }

    public constructExpr(symbols: SymbolTable): Expr {
        return this.child.constructExpr(symbols);
    }
}

export class AstRename extends AstUnary {

    constructor(
        cell: Cell,
        child: AstComponent,
        public fromTape: string,
        public toTape: string
    ) {
        super(cell, child);
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
    
    public constructExpr(symbols: SymbolTable): Expr {
        if (this.expr == undefined) {
            const childExpr = this.child.constructExpr(symbols);
            this.expr = constructRename(childExpr, this.fromTape, this.toTape);
        }
        return this.expr;
    }
}

export class AstRepeat extends AstUnary {

    constructor(
        cell: Cell,
        child: AstComponent,
        public minReps: number = 0,
        public maxReps: number = Infinity
    ) {
        super(cell, child);
    }

    public constructExpr(symbols: SymbolTable): Expr {
        if (this.expr == undefined) {
            const childExpr = this.child.constructExpr(symbols);
            this.expr = constructRepeat(childExpr, this.minReps, this.maxReps);
        }
        return this.expr;
    }
}

export class AstNegation extends AstUnary {

    constructor(
        cell: Cell,
        child: AstComponent,
        public maxReps: number = Infinity
    ) {
        super(cell, child);
    }

    public constructExpr(symbols: SymbolTable): Expr {
        if (this.expr == undefined) {
            if (this.child.tapes == undefined) {
                throw new Error("Getting Brz expression with undefined tapes");
            }

            const childExpr = this.child.constructExpr(symbols);
            this.expr = constructNegation(childExpr, this.child.tapes, this.maxReps);
        }
        return this.expr;
    }
}

let HIDE_INDEX = 0; 
export class AstHide extends AstUnary {

    public toTape: string;

    constructor(
        cell: Cell,
        child: AstComponent,
        public tape: string,
        name: string = ""
    ) {
        super(cell, child);
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
    
    public constructExpr(symbols: SymbolTable): Expr {

        if (this.expr == undefined) {
            if (this.child.tapes == undefined) {
                throw new Error("Trying to construct an expression before tapes are calculated");
            }

            if (!this.child.tapes.has(this.tape)) {            
                if (this.cell != undefined) {
                    this.message({
                        type: "error", 
                        shortMsg: "Hiding missing tape",
                        longMsg: `The grammar to the left does not contain the tape ${this.tape}. " +
                            " Available tapes: [${[...this.child.tapes]}]`
                    });
                }
            }

            const childExpr = this.child.constructExpr(symbols);
            this.expr = constructRename(childExpr, this.tape, this.toTape);
        }
        return this.expr;
    }
}

export class AstMatch extends AstUnary {

    constructor(
        cell: Cell,
        child: AstComponent,
        public relevantTapes: Set<string>
    ) {
        super(cell, child);
    }

    public constructExpr(symbols: SymbolTable): Expr {
        if (this.expr == undefined) {
            const childExpr = this.child.constructExpr(symbols);
            this.expr = constructMatch(childExpr, this.relevantTapes);
        }
        return this.expr;
    }
}

export class AstNamespace extends AstComponent {

    constructor(
        cell: Cell,
        public name: string
    ) {
        super(cell);
    }

    public qualifiedNames: Map<string, string> = new Map();
    public symbols: Map<string, AstComponent> = new Map();
    public default: AstComponent = new AstEpsilon(DUMMY_CELL);

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

        if (symbolName == "") {
            return this;
        }
        const pieces = symbolName.split(".");
        const child = this.symbols.get(pieces[0]);
        if (child == undefined) {
            return undefined;
        }
        const remnant = pieces.slice(1).join(".");
        return child.getSymbol(remnant);
    }

    public allSymbols(): string[] {
        const results: string[] = [];
        for (const [name, referent] of this.symbols.entries()) {
            results.push(name);
            for (const subname of referent.allSymbols())
            results.push(`${name}.${subname}`);
        }
        return results;
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
        const namePrefixes = nsStack.map(n => n.name).filter(s => s.length > 0);
        return [...namePrefixes, name].join(".");
    }
    
    public qualifyNames(nsStack: AstNamespace[] = []): string[] {
        let unqualifiedNames: string[] = [];
        const newStack = [ ...nsStack, this ];
        for (const [symbolName, referent] of this.symbols) {
            const newName = this.calculateQualifiedName(symbolName, newStack);
            this.qualifiedNames.set(symbolName, newName);
            unqualifiedNames = unqualifiedNames.concat(referent.qualifyNames(newStack));
        }
        return unqualifiedNames;
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
    public constructExpr(symbols: SymbolTable): Expr {

        if (this.expr == undefined) {
            this.expr = EPSILON // just in case

            for (const [name, referent] of this.symbols) {
                const qualifiedName = this.qualifiedNames.get(name);
                if (qualifiedName == undefined) {
                    throw new Error("Getting Brz expressions without having qualified names yet");
                }
                if (referent.tapes == undefined) {
                    throw new Error("Getting Brz expressions without having calculated tapes");
                }
                this.expr = referent.constructExpr(symbols);
                // memoize every expr
                this.expr = constructMemo(this.expr);
                symbols[qualifiedName] = this.expr;
            }
        }
        return this.expr;
    }
}

export class AstEmbed extends AstAtomic {

    public qualifiedName: string;
    public referent: AstComponent | undefined = undefined;

    constructor(
        cell: Cell,
        public name: string
    ) {
        super(cell);
        this.qualifiedName = name;
    }

    public qualifyNames(nsStack: AstNamespace[] = []): string[] {
        let resolution: [string, AstComponent] | undefined = undefined;
        for (let i = nsStack.length-1; i >=0; i--) {
            // we go down the stack asking each to resolve it
            const subStack = nsStack.slice(0, i+1);
            resolution = nsStack[i].resolveName(this.name, subStack);
            if (resolution != undefined) {              
                const [qualifiedName, referent] = resolution;
                this.qualifiedName = qualifiedName;
                this.referent = referent;
                break;
            }
        }

        if (resolution == undefined) {
            return [ this.name ];
        }
        return [];
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

    public constructExpr(symbols: SymbolTable): Expr {
        if (this.expr == undefined) {
            if (this.referent == undefined) {
                this.message({
                    type: "error", 
                    shortMsg: "Unknown symbol", 
                    longMsg: `Undefined symbol: ${this.name}`
                });
                return EPSILON;
            }
            this.expr = constructEmbed(this.qualifiedName, symbols);
        }
        return this.expr;
    }
}

export class AstUnitTest extends AstUnary {

    constructor(
        cell: Cell,
        child: AstComponent,
        protected tests: AstComponent[]
    ) {
        super(cell, child)
    }

    public runUnitTestsAux(): void {
        super.runUnitTestsAux();

        for (const test of this.tests) {
            const testingState = new AstFilter(test.cell, this.child, test);
            const results = [...testingState.generate()];
            this.markResults(test, results);
        }
    }

    public markResults(test: AstComponent, results: StringDict[]): void {
        if (results.length == 0) {
            test.message({
                type: "error", 
                shortMsg: "Failed unit test",
                longMsg: "The grammar above has no outputs compatible with this row."
            });
        } else {
            test.message({
                type: "info",
                shortMsg: "Unit test successful",
                longMsg: "The grammar above has outputs compatible with this row."
            });
        }
    }

    public constructExpr(symbols: SymbolTable): Expr {
        if (this.expr == undefined) {
            this.expr = this.child.constructExpr(symbols);
        }
        return this.expr;
    }
}


export class AstNegativeUnitTest extends AstUnitTest {

    public markResults(test: AstComponent, results: StringDict[]): void {
        if (results.length > 0) {
            test.message({
                type: "error", 
                shortMsg: "Failed unit test",
                longMsg: "The grammar above incorrectly has outputs compatible with this row."
            });
        } else {
            test.message({
                type: "info",
                shortMsg: "Unit test successful",
                longMsg: "The grammar above correctly has no outputs compatible with this row."
            });
        }
    } 

}

const DUMMY_CELL = new DummyCell();

export function Seq(...children: AstComponent[]): AstSequence {
    return new AstSequence(DUMMY_CELL, children);
}

export function Uni(...children: AstComponent[]): AstAlternation {
    return new AstAlternation(DUMMY_CELL, children);
}

export function Maybe(child: AstComponent): AstAlternation {
    return Uni(child, Epsilon());
}

export function Lit(tape: string, text: string): AstLiteral {
    return new AstLiteral(DUMMY_CELL, tape, text);
}

export function Any(tape: string): AstDot {
    return new AstDot(DUMMY_CELL, tape);
}

export function Intersect(child1: AstComponent, child2: AstComponent): AstIntersection {
    return new AstIntersection(DUMMY_CELL, child1, child2);
}

export function Filter(child1: AstComponent, child2: AstComponent): AstFilter {
    return new AstFilter(DUMMY_CELL, child1, child2);
}

export function Join(child1: AstComponent, child2: AstComponent): AstJoin {
    return new AstJoin(DUMMY_CELL, child1, child2);
}

export function StartsWith(child1: AstComponent, child2: AstComponent): AstJoin {
    return new AstStartsWith(DUMMY_CELL, child1, child2);
}

export function EndsWith(child1: AstComponent, child2: AstComponent): AstJoin {
    return new AstEndsWith(DUMMY_CELL, child1, child2);
}

export function Contains(child1: AstComponent, child2: AstComponent): AstJoin {
    return new AstContains(DUMMY_CELL, child1, child2);
}

export function Rep(
    child: AstComponent, 
    minReps: number = 0, 
    maxReps: number = Infinity
) {
    return new AstRepeat(DUMMY_CELL, child, minReps, maxReps);
}

export function Epsilon(): AstEpsilon {
    return new AstEpsilon(DUMMY_CELL);
}

export function Null(): AstNull {
    return new AstNull(DUMMY_CELL);
}

export function Embed(name: string): AstEmbed {
    return new AstEmbed(DUMMY_CELL, name);
}

export function Match(child: AstComponent, ...tapes: string[]): AstMatch {
    return new AstMatch(DUMMY_CELL, child, new Set(tapes));
}

export function Dot(...tapes: string[]): AstSequence {
    return Seq(...tapes.map(t => Any(t)));
}

export function MatchDot(...tapes: string[]): AstMatch {
    return Match(Dot(...tapes), ...tapes);
}

export function MatchDotRep(minReps: number = 0, maxReps: number = Infinity, ...tapes: string[]): AstMatch {
    return Match(Rep(Dot(...tapes), minReps, maxReps), ...tapes)
}

export function MatchDotRep2(minReps: number = 0, maxReps: number = Infinity, ...tapes: string[]): AstMatch {
    return Match(Seq(...tapes.map((t: string) => Rep(Any(t), minReps, maxReps))), ...tapes);
}

export function MatchDotStar(...tapes: string[]): AstMatch {
    return MatchDotRep(0, Infinity, ...tapes)
}

export function MatchDotStar2(...tapes: string[]): AstMatch {
    return MatchDotRep2(0, Infinity, ...tapes)
}

export function MatchFrom(firstTape: string, secondTape: string, state: AstComponent): AstComponent {
    return Match(Seq(state, Rename(state, firstTape, secondTape)),
                 firstTape, secondTape);
}

export function Rename(child: AstComponent, fromTape: string, toTape: string): AstRename {
    return new AstRename(DUMMY_CELL, child, fromTape, toTape);
}

export function Not(child: AstComponent, maxChars:number=Infinity): AstNegation {
    return new AstNegation(DUMMY_CELL, child, maxChars);
}

export function Ns(
    name: string, 
    symbols: {[name: string]: AstComponent} = {}
): AstNamespace {
    const result = new AstNamespace(DUMMY_CELL, name);
    for (const [symbolName, component] of Object.entries(symbols)) {
        result.addSymbol(symbolName, component);
    }
    return result;
}

export function Hide(child: AstComponent, tape: string, name: string = ""): AstHide {
    return new AstHide(DUMMY_CELL, child, tape, name);
}

export function Vocab(tape: string, text: string): AstComponent {
    return Rep(Lit(tape, text), 0, 0)
}

/**
  * Replace implements general phonological replacement rules.
  * 
  * fromTapeName: name of the input (target) tape
  * toTapeName: name of the output (change) tape
  * fromState: input (target) State (on fromTape)
  * toState: output (change) State (on toTape)
  * preContext: context to match before the target fromState (on fromTape)
  * postContext: context to match after the target fromState (on fromTape)
  * beginsWith: set to True to match at the start of fromTape
  * endsWith: set to True to match at the end of fromTape
  * minReps: minimum number of times the replace rule is applied; normally 0.
  * maxReps: maximum number of times the replace rule is applied
  * maxExtraChars: a character limiter for extra characters at start/end
  * repetitionPatch: if True, expand replacement repetition using Uni
  *     repetitionPatch is a workaround for a bug resulting in a bad interaction
  *         between the old ConcatState and RepetitionState.
  *     Note: repetitionPatch may not be true if maxReps > 100
*/
export function Replace(
    fromTapeName: string, toTapeName: string,
    fromState: AstComponent, toState: AstComponent,
    preContext: AstComponent | undefined, postContext: AstComponent | undefined,
    beginsWith: Boolean = false, endsWith: boolean = false,
    minReps: number = 0, maxReps: number = Infinity,
    maxExtraChars: number = 100,
    repetitionPatch: Boolean = false
): AstComponent {
    if (beginsWith || endsWith) {
        maxReps = Math.max(1, maxReps);
        minReps = Math.min(minReps, maxReps);
    }

    var states: AstComponent[] = [];
    if (preContext != undefined)
        states.push(MatchFrom(fromTapeName, toTapeName, preContext));
    states.push(fromState, toState);
    if (postContext != undefined)
        states.push(MatchFrom(fromTapeName, toTapeName, postContext));

    // Determine if the vocabulary for fromTape is a subset of the vocabulary
    // of toTape, in which case toTape could match the target replacement pattern.
    // sameVocab is used to determine what matchAnythingElse should match, but
    // is not needed if replacing at the start or end of text.
    
    var sameVocab: boolean = false;
    var replaceState: AstComponent = Seq(...states);

    const tapeCollection: TapeCollection = replaceState.getAllTapes();
    const fromTape: Tape | undefined = tapeCollection.matchTape(fromTapeName);
    if (fromTape != undefined) {
        const fromVocab: string = fromTape.fromToken(fromTapeName, fromTape.any()).join('');
        sameVocab = tapeCollection.inVocab(toTapeName, fromVocab)
    }

    function matchAnythingElse(replaceNone: boolean = false) {
        const dotStar: AstComponent = Rep(Any(fromTapeName), 0, maxExtraChars);
        // 1. If the fromTape vocab for the replacement operation contains some
        //    characters that are not in the corresponding toTape vocab, then
        //    extra text matched before and after the replacement cannot possibly
        //    contain the from replacement pattern. Furthermore, we don't want to
        //    add those characters to the toTape vocab, so instead we match .*
        // 2. If we are matching an instance at the start of text (beginsWith),
        //    or end of text (endsWith) then matchAnythingElse needs to match any
        //    other instances of the replacement pattern, so we need to match .*
        if( !sameVocab || (beginsWith && !replaceNone) || (endsWith && !replaceNone)) {
            return MatchFrom(fromTapeName, toTapeName, dotStar)
        }
        var fromInstance: AstComponent[] = [];
        if (preContext != undefined)
            fromInstance.push(preContext);
        fromInstance.push(fromState);
        if (postContext != undefined)
            fromInstance.push(postContext);
        var notState: AstComponent;
        if (beginsWith && replaceNone)
            notState = Not(Seq(...fromInstance, dotStar), maxExtraChars);
        else if (endsWith && replaceNone)
            notState = Not(Seq(dotStar, ...fromInstance), maxExtraChars);
        else
            notState = Not(Seq(dotStar, ...fromInstance, dotStar), maxExtraChars);
        return MatchFrom(fromTapeName, toTapeName, notState)
    }

    if (! endsWith)
        states.push(matchAnythingElse());

    const replaceOne: AstComponent = Seq(...states);
    var replaceMultiple: AstComponent = Rep(replaceOne, minReps, maxReps);
    
    /*if (repetitionPatch && maxReps <= 100) {
        var multiples: AstComponent[] = [];
        for (let n=Math.max(1, minReps); n < maxReps+1; n++) {
            multiples.push(Seq(...Array.from({length: n}).map(x => replaceOne)));
        }
        replaceMultiple = Uni(...multiples);
    } */

    if (beginsWith)
        replaceState = replaceOne;
    else if (endsWith)
        replaceState = Seq(matchAnythingElse(), replaceOne);
    else 
        replaceState = Seq(matchAnythingElse(), replaceMultiple);
        
    if (minReps > 0)
        return replaceState
    // ??? NOTE: matchAnythingElse(true) with beginsWith can result in an
    // "infinite" loop when generate is called (especially if maxChars is
    // high) because the match on notState is not respecting maxExtraChars
    // for some reason.
    return(Uni(matchAnythingElse(true), replaceState));
}
