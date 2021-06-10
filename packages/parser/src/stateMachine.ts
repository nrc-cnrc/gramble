import { Gen, iterTake, setDifference, setIntersection, StringDict } from "./util";
import { MultiTapeOutput, Tape, RenamedTape, TapeCollection, Token, ANY_CHAR } from "./tapes";
import { assert } from "chai";

/**
 * This is the parsing engine that underlies Gramble.
 * It generalizes Brzozowski derivatives (Brzozowski, 1964) to
 * multi-tape languages.
 * 
 *      - "Multi-tape" means that there are multiple "tapes"
 *      (in the Turing machine sense) from/to which the machine
 *      can read/write.  Finite-state acceptors are one-tape automata,
 *      they read in from one tape and either succeed or fail.  Finite-
 *      state transducers are two-tape automata, reading from one and
 *      writing to another.  This system allows any number of tapes, and
 *      reading/writing from them in any combination.  (E.g. you could have
 *      five tapes A,B,C,D,E, have the input tapes be B and C and the outputs
 *      be A,D,E.  You don't need to specify this in advance, the grammar just
 *      expresses a relationship between tapes, not the direction 
 *      of the "parse".)
 * 
 * The basic idea of a Brzozowski derivative is easy.  Consider a language that
 * only consists of the following six words 
 * 
 *    L = { "apple", "avocado", "banana", "blueberry", "cherry", "date" }
 * 
 * The Brzozowski derivative with respect to the character "b" of the above is
 * 
 *    D_b(L) = { "anana", "lueberry" }
 * 
 * Easy, no?  But we can also do this for languages that we haven't written out in 
 * full like this -- languages that we've only expressed in terms of a grammar.  For
 * example, here are the rules for union (| here) and the 
 * Kleene star with respect to some character c:
 * 
 *    D_c(A|B) = D_c(A) | D_c(B)
 *    D_c(A*) = D_c(A) + A*
 * 
 * In other words, we can distribute the derivative operation to the components of each grammar
 * element, depending on which grammar element it is, and eventually down to atomic elements like
 * literals.
 * 
 *   D_c("banana") = "anana" if c == "b"
 *                   0 otherwise
 gi* 
 * Brzozowski proved that all regular grammars have only finitely many derivatives (even if 
 * the grammar itself generates infinitely).
 * 
 * You can generate from a grammar L by trying each possible letter for c, and then, for 
 * each derivative L' in D_c(L), trying each possible letter again to get L'' in D_c(L'), etc.
 * If you put those letters c into a tree, you've got L again, but this time in trie form. 
 * That's basically what we're doing!  Except it'd be silly to actually iterate through all the possible
 * letters; instead we represent our vocabulary of possible letters as a set of bits and do bitwise
 * operations on them. 
 * 
 * A lot of our implementation of this algorithm uses the metaphor that these are states in a state
 * machine that has not been fully constructed yet.  You can picture the process of taking a Brz. 
 * derivative as moving from a state to a state along an edge labeled "c", but where instead of the state
 * graph already being constructed and in memory, each state constructing its successors on demand.  
 * Since states corresponding to (say) a particular position within a literal are different 
 * than those that (say) start off a subgraph corresponding to a Union, they belong to different 
 * classes here: there's a LiteralState, a UnionState, etc. that differ in how they construct 
 * their successors, and what information they need to keep track of to do so.  LiteralStates, for example,
 * need to keep track of what that literal is and how far along they are within it.
 * 
 * Brzozowski derivatives can be applied to grammars beyond regular ones -- they're well-defined
 * on context-free grammars, and here we generalize them to multi-tape grammars.  Much of the complexity
 * here isn't in constructing the derivative (which is often easy) but in bookkeeping the multiple tapes,
 * dealing with sampling randomly from a grammar or compiling it into a more efficient grammar, etc.
 * 
 * Although an unoptimized Brzozowski-style algoritm has poor runtime complexity, the benefit of it to
 * us is that it gives us an easy-to-conceptualize flexibility between top-down parsing (poor runtime 
 * complexity, good space complexity) and compiling a grammar to a state graph (good runtime complexity, 
 * poor space complexity).  The reason for this is we can use the Brz. algorithm to actually
 * construct the state graph, but then still use the Brz. algorithm on that state graph (the Brz. derivative
 * of a language expressed as a state graph is easy, just follow that edge labeled "c").  That is to say,
 * compiling the state graph is just pre-running the algorithm.  This gives us a way to think about the 
 * _partial_ compilation of a grammar, and lets us decide things like where we want to allocate a potentially
 * limited compilation budget to the places it's going to matter the most at runtime.
 */

export type SymbolTable = {[key: string]: State};

/**
 * CounterStack
 * 
 * A convenience class that works roughly like Python's collections.Counter.  Just
 * note that add() is non-destructive; it returns a new Counter without changing the original.
 * So use it like:
 * 
 *  * counter = counter.add("verb");
 * 
 * We use this to make sure we don't recurse an impractical number of times, like
 * infinitely.  
 * 
 * Infinite recursion is *correct* behavior for a grammar that's
 * genuinely infinite, but because this system is meant to be embedded in a 
 * programming language meant for beginner programmers,
 * we default to allowing four recursions before stopping recursion.  Advanced 
 * programmers will be able to turn this off and allow infinite recursion, but they
 * have to take an extra step to do so.
 */

export class CounterStack {

    constructor(
        public max: number = 4
    ) { }

    public stack: {[key: string]: number} = {};
    public id: string = "ground";

    public add(key: string) {
        const result = new CounterStack(this.max);
        result.stack[key] = 0;
        Object.assign(result.stack, this.stack);
        result.stack[key] += 1;
        result.id = key + result.stack[key];
        return result;
    }

    public get(key: string): number {
        return (key in this.stack) ? this.stack[key] : 0;
    }

    public exceedsMax(key: string): boolean {
        return this.get(key) >= this.max;
    }

    public tostring(): string {
        return JSON.stringify(this.stack);
    }
}

/**
 * Namespace
 * 
 * A Namespace object associates symbols with names, and resolves references
 * to them.  They are nested; when a symbol cannot be resolved in the current
 * namespace, it's passed to the parent namespace which tries to resolve it.
 * 
 * While these namespaces, structurally, form a tree, at the moment we only
 * actually support one level of nesting.  There is a global namespace associated
 * with a whole Project, and a child namespace for each source sheet within the 
 * project.  Project sources are currently assumed to be flat: that is to say,
 * there's nothing like a "directory" or "nested module" structure at the moment.
 * (The reason for that is that we conceptualize a project as being composed
 * primarily within a spreadsheet editor like Google Sheets or Excel, and there
 * is no metaphor within a spreadsheet by which worksheets are grouped in a 
 * directory-like structure.  From the POV of the spreadsheet user, worksheets
 * are unordered and not hierarchically structured, and so likewise Gramble 
 * project source files are unordered and not hierarchically structured, too.)
 */
export class Namespace {
    
    protected parent: Namespace | undefined = undefined;

    constructor(
        protected name: string,
        protected symbols: {[name: string]: [string, State]} = {}
    ) { }

    protected childNamespaces: {[name: string]: Namespace} = {};
    public requiredNamespaces: Set<string> = new Set();
    public defaultNamespaceName: string = "";
    public defaultSymbolName: string = "";

    public hasSymbol(name: string): boolean {
        return name in this.symbols;
    }

    public addSymbol(name: string, state: State): void {
        if (name.indexOf(".") != -1) {
            throw new Error(`Symbol names may not contain a period: ${name}`);
        }
        if (name in this.symbols) {
            throw new Error(`Redefining symbol ${name}`);
        }
        const lowercaseName = name.toLowerCase();
        this.symbols[lowercaseName] = [name, state];
        this.defaultSymbolName = lowercaseName;
    }

    public resolveName(name: string, tryParent: boolean = true): [Namespace, string] | undefined {

        const pieces = name.split(".", 2);
        if (pieces.length == 1) {
            // it's either a local symbol name, or a local namespace name with the default symbol name,
            // or in our default namespace

            const lowercaseName = name.toLowerCase();
            const symbol = this.symbols[lowercaseName];
            if (symbol != undefined) {
                return [this, name];  // it's a local symbol
            }

            const ns = this.getLocalNamespace(name);
            if (ns != undefined && ns.defaultSymbolName != "") {
                return [ns, ns.defaultSymbolName]; // it's a local namespace name with the default symbol
            }

            if (this.defaultNamespaceName != "") {
                const ns = this.getLocalNamespace(this.defaultNamespaceName);
                if (ns != undefined) {
                    const result = ns.symbols[lowercaseName];
                    if (result != undefined) {
                        return [ns, lowercaseName]; // it's a symbol in our default namespace
                    }
                }
            }
        } else {
            // there is more than one name piece, so this is a name qualified by a namespace. look
            // for the namespace locally, and ask for that one
     
            const ns = this.getLocalNamespace(pieces[0]);
            if (ns != undefined) {
                const remnant = pieces.slice(1).join("");
                const result = ns.resolveName(remnant, false);
                if (result != undefined) {
                    return result;
                }
            }
        }

        // if you still can't find it, see if your parent can resolve it
        if (this.parent != undefined && tryParent) {
            const result = this.parent.resolveName(name);
            if (result != undefined) {
                return result;
            }
        }
        return undefined;
    }

    public compileSymbol(
        name: string, 
        allTapes: TapeCollection, 
        symbolStack: CounterStack,
        compileLevel: number
    ): void {
        const resolution = this.resolveName(name);
        if (resolution == undefined) {
            // this is an error due to an undefined symbol, but now isn't the time
            // to raise a fuss.  this error will be caught elsewhere and the programmer
            // will be notified
            return;
        }
        const [ns, symbolName] = resolution;
        ns.compileLocalSymbol(symbolName, allTapes, symbolStack, compileLevel);
    }

    public compileLocalSymbol(
        name: string, 
        allTapes: TapeCollection, 
        symbolStack: CounterStack,
        compileLevel: number
    ): void {
        
        if (name.indexOf(".") != -1) {
            throw new Error(`Trying to locally compile a qualified name ${name}; ` +
                    " this should have been resolved in symbol resolution");
        }
        
        const compiledName = this.getCompiledName(name, symbolStack);
        if (compiledName in this.symbols) {
            // already compiled it
            return;
        }

        const lowercaseName = name.toLowerCase();
        const [realName, state] = this.symbols[lowercaseName];
        const compiledState = state.compileAux(allTapes, symbolStack, compileLevel);
        this.symbols[compiledName] = [realName, compiledState]
    }

    public allSymbols(): string[] {
        const symbols = Object.values(this.symbols);
        var result = symbols.map(([name, value]) => name);
        for (const namespaceName in this.childNamespaces) {
            const childNamespace = this.childNamespaces[namespaceName];
            for (const symbol of childNamespace.allSymbols()) {
                result.push(`${childNamespace.name}.${symbol}`);
            }
        }
        return result;
    }

    public addLocalNamespace(name: string, namespace: Namespace): void {
        if (name.indexOf(".") != -1) {
            throw new Error(`Namespace names may not contain a period: ${name}`);
        }
        const lowercaseName = name.toLowerCase();
        if (lowercaseName in this.childNamespaces) {
            throw new Error(`Redefining namespace ${name}`);
        }
        this.childNamespaces[lowercaseName] = namespace;
        namespace.parent = this;
    }

    public setDefaultNamespaceName(name: string): void {
        const lowercaseName = name.toLowerCase();
        if (!(lowercaseName in this.childNamespaces)) {
            throw new Error(`Trying to set ${name} to the default namespace, but it doesn't exist yet.`);
        }
        this.defaultNamespaceName = lowercaseName;
    }

    /**
     * Gets a namespace by name, but only local ones (i.e. children of this namespace)
     */
    public getLocalNamespace(name: string): Namespace | undefined {
        const lowercaseName = name.toLowerCase();
        return this.childNamespaces[lowercaseName];
    }

    public getLocalSymbol(name: string, 
                        symbolStack: CounterStack | undefined = undefined): State | undefined {
        
        if (symbolStack != undefined) {
            const compiledName = this.getCompiledName(name, symbolStack);
            if (compiledName in this.symbols) {
                const [realName, state] = this.symbols[compiledName];
                return state;
            }
        }
        const lowercaseName = name.toLowerCase();
        const [realName, state] = this.symbols[lowercaseName];
        return state;
    }

    protected getCompiledName(symbolName: string, symbolStack: CounterStack) {
        return symbolName + "@@@" + symbolStack.id;
    }

    public getSymbol(name: string, 
                symbolStack: CounterStack | undefined = undefined): State | undefined {

        const resolution = this.resolveName(name);
        if (resolution == undefined) {
            return undefined;
        }

        const [ns, localName] = resolution;
        return ns.getLocalSymbol(localName, symbolStack);
    }

    //public registeredSymbolNames: string[] = [];

    /**
     * When an EmbedState is constructed, it needs to "register" the symbol
     * name it is going to want later, so that we can (if necessary) load and
     * parse the source file that contains that symbol.
     */
    public register(symbolName: string): void {
        const pieces = symbolName.split(".");
        if (pieces.length > 2) {
            // At some point we may want to allow registration of
            // symbols with nested namespaces, but right now that's
            // a whole can of worms.
            throw new Error(`${symbolName} is not a valid reference, ` +
               " because nested namespaces (e.g. X.Y.Z) are not currently supported.");
        }
        if (this.parent == undefined) {
            // this doesn't happen in real projects, but it can happen when unit testing.
            return;
        }
        this.parent.requiredNamespaces.add(pieces[0]);
    }
}

/**
 * State
 * 
 * State is the basic class of the parser.  It encapsulate the current state of the parse; you can think
 * of it like a pointer into the state graph, if we were to ever construct that graph, which we don't.
 * Rather, a State encapsulates the *information* that that node would have represented.  
 * 
 * For example, imagine an automaton that recognizes the literal "hello".  We could implement this as an
 * explicit graph of nodes, where each node leads to the next by consuming a particular letter (state 0 leads
 * to 1 by consuming "h", state 1 leads to 2 by consuming "e", etc.).  Our pointer into this graph 
 * basically represents two pieces of information, what the word is ("hello") and 
 * how far into it we are.  We could also represent this information as an object { text: string, index: number }.
 * Rather than pre-compute each of these nodes, we can say that this object returns (upon matching) another 
 * object {text: string, index: number+1}... until we exceed the length of the literal, of course.  This 
 * idea, in general, allows us to avoid creating explicit state graphs that can be exponentially huge, 
 * although it comes with its own pitfalls.
 * 
 * For our purposes, a State is anything that can, upon being queried with a [tape, char] pair, 
 * return the possible successor states it can get to.  
 * 
 * Many kinds of States have to contain references to other states (like an 
 * [EmbedState], which lets us embed grammars inside other grammars, keeps a point to the current parse state inside
 * that embedded grammar).  The structure of State components ends up being roughly isomorphic to the grammar that it's
 * parsing (e.g. if the grammar is (A+(B|C)), then the start State that we begin in will have the same structure,
 * it'll be a [ConcatState] of (A and a [UnionState] of (B and C)).  Then as the parse goes on, the State will
 * simplify bit-by-bit, like once A is recognized, the current state will just be one corresponding to B|C, and 
 * if B fails, the current state will just be C.
 * 
 * For the purposes of the algorithm, there are three crucial functions of States:
 * 
 *  * ndQuery(tape, char): What states can this state get to, compatible with a given tape/character
 *  * dQuery(tape, char): Calls ndQuery and rearranges the outputs so that any specific character can 
 *                      only lead to one state.
 *  * accepting(): Whether this state is a final state, meaning it constitutes a complete parse
 */

export abstract class State {

    /**
     * States must know what tapes their associated grammars are defined over.  Note that these
     * might not be the same names that the grammar as a whole knows these tapes by, because the Rename
     * operation can rename tapes within its scope.
     * 
     * The tapes over which a grammar is defined are not necessarily known at the point that the grammar
     * is initially constructed, because this depends on their children, and children can include symbols
     * defined only later.  So we need a separate pass after construction.
     */
     protected relevantTapes: Set<string> | undefined = undefined;

    /**
     * Collects the names of all tapes relevant to this state.  The names are those
     * that this state would "see" (that is, if this state refers to a RenameState,
     * it uses the renamed tape name, not whatever that tape is referred to "inside"
     * the RenameState).
     * 
     * This will be the same result as if we called "collectVocab" on this state with an empty
     * TapeCollection, but we don't go to the trouble of collecting the character vocabulary.
     */
     public getRelevantTapes(stateStack: CounterStack): Set<string> {
        if (this.relevantTapes == undefined) {
            this.relevantTapes = new Set();
        }
        return this.relevantTapes;
    }

    public caresAbout(tape: Tape): boolean {
        if (tape.tapeName == "__ANY_TAPE__") return true;
        const symbolStack = new CounterStack(2);
        return this.getRelevantTapes(symbolStack).has(tape.tapeName);
    }

    /**
     * Due to complications involved in compilation, States sometimes have to keep reference
     * to the vocabulary with which they were originally compiled.  (You can't run a compiled
     * state graph using a different vocab, after all, and running the collectVocab() algorithm
     * on the compiled graph might result in a different vocab.) So the following property/getter/setter
     * handles stored TapeCollections (which are the object that keeps the vocabulary for all
     * tapes). 
     * 
     * Not all States will actually define this property; generally it will only be the "root"
     * state of a grammar, or a state that was at some point a root state of a grammar that a 
     * caller was manupulating as a reference.  (That is, for this to be defined, this State
     * was probably referenced as a variable and someone called generate() or compile() on it.)
     */
    protected allTapes: TapeCollection | undefined = undefined;

    public getAllTapes(): TapeCollection {
        if (this.allTapes == undefined) {
            this.allTapes = new TapeCollection();
            this.collectVocab(this.allTapes, []);
        }
        return this.allTapes;
    }

    public setAllTapes(tapes: TapeCollection): void {
        this.allTapes = tapes;
    }

    /**
     * Gets an id() for the state.  At the moment we're only using this
     * for debugging purposes, but we may want to use it in the future
     * as a unique identifier for a state in explicit graph construction.
     * 
     * If we do this, we should go through and make sure that IDs are actually
     * unique; right now they're often not.
     */
    public abstract get id(): string;
    
    /**
     * accepting 
     * 
     * Whether the state is accepting (i.e. indicates that we have achieved a complete parse).  (What is typically rendered as a "double circle"
     * in a state machine.) Note that, since this is a recursive state machine, getting to an accepting state doesn't necessarily
     * mean that the *entire* grammar has completed; we might just be in a subgrammar.  In this case, accepting() isn't the signal that we
     * can stop parsing, just that we've reached a complete parse within the subgrammar.  For example, [ConcatState] checks whether its left
     * child is accepting() to determine whether to move on and start parsing its right child.
     * 
     * @param symbolStack A [CounterStack] that keeps track of symbols, used for preventing infinite recursion.
     * @returns true if the state is an accepting state (i.e., constitutes a complete parse) 
     */
    public accepting(tape: Tape, random: boolean, symbolStack: CounterStack): boolean {
        return false;
    }

    /**
     * non-deterministic Query
     * 
     * The workhorse function of the parser, taking a <tape, char> pair and trying to match it to a transition
     * (e.g., matching it to the next character of a [LiteralState]).  It yields all matching <tape, char> pairs, and the respective
     * nextStates to which we should move upon a successful transition.
     * 
     * Note that an ndQuery's results may "overlap" in the sense that you may get the same matched character
     * twice (e.g., you might get two results "q", or a result "q" and a result "__ANY__" that includes "q").
     * For some parts of the algorithm, this would be inappropriate (i.e., inside of a negation).  So rather
     * than call ndQuery directly, call dQuery (deterministic Query), which calls ndQuery and then adjusts
     * the results so that the results are disjoint.
     * 
     * @param tape A Tape object identifying the name/type/vocabulary of the relevant tape
     * @param target A Token identifying what characters we need to match
     * @param symbolStack A [CounterStack] that keeps track of symbols (for embedding grammars), used for preventing infinite recursion
     * @returns A tuple <tape, match, matched, nextState>, where:
     *      * tape is the tape we matched on, 
     *      * match is the intersection of the original target and our match,
     *      * matched is whether we actually made a match or ignored it (for being on the wrong tape)
     *      * nextState is the state the matched transition leads to
     */

    public abstract ndQuery(tape: Tape, 
        target: Token,
        random: boolean,
        symbolStack: CounterStack): Gen<[Tape, Token, boolean, State]>;

    public randomize(): State {
        return this;
    }
        
    /** 
     * deterministic Query
     * 
     * Queries the state so that the results are deterministic (or more accurately, so that all returned 
     * transitions are disjoint).  (There can still be multiple results; when we query ANY:ANY, for example.)
     * 
     * This looks a bit complicated (and it kind of is) but what it's doing is handing off the query to
     * ndQuery, then combining results so that there's no overlap between the tokens.  For example, say ndQuery yields
     * two tokens X and Y, and they have no intersection.  Then we're good, we just yield those.  But if they 
     * do have an intersection, we need to return three paths:
     * 
     *    X&Y (leading to the UnionState of the states X and Y would have led to)
     *    X-Y (leading to the state X would have led to)
     *    Y-X (leading to the state Y would have led to)
     * 
     * @param nextTape A Tape object identifying the name/type/vocabulary of the relevant tape
     * @param target A Token identifying what characters we need to match
     * @param symbolStack A [CounterStack] that keeps track of symbols (for embedding grammars), used for preventing infinite recursion
     * @returns A tuple <tape, match, matched, nextState>, where:
     *      * tape is the tape we matched on, 
     *      * match is the intersection of the original target and our match,
     *      * matched is whether we actually made a match or ignored it (for being on the wrong tape)
     *      * nextState is the state the matched transition leads to
     */ 

    public *dQuery(
        tape: Tape, 
        target: Token,
        random: boolean,
        symbolStack: CounterStack
    ): Gen<[Tape, Token, boolean, State]> {

        var results: [Tape, Token, boolean, State][] = [];
        var nextStates: [Tape, Token, boolean, State][] = [... this.ndQuery(tape, target, random, symbolStack)];
        
        for (var [nextTape, nextBits, nextMatched, next] of nextStates) {
            //if (nextTape.isTrivial || !nextMatched) {
            if (!nextMatched) {
                results.push([nextTape, nextBits, nextMatched, next]);
                continue;
            }

            var newResults: [Tape, Token, boolean, State][] = [];
            for (var [otherTape, otherBits, otherMatched, otherNext] of results) {
                if (nextTape.tapeName != otherTape.tapeName || !otherMatched) {
                    newResults.push([otherTape, otherBits, otherMatched, otherNext]);
                    continue;
                }

                // they both matched
                const intersection = nextBits.and(otherBits);
                if (!intersection.isEmpty()) {
                    // there's something in the intersection
                    const union = new UnionState([next, otherNext]);
                    newResults.push([nextTape, intersection, true, union]); 
                }
                nextBits = nextBits.andNot(intersection)
                otherBits = otherBits.andNot(intersection);

                // there's something left over
                if (!otherBits.isEmpty()) {
                    newResults.push([otherTape, otherBits, otherMatched, otherNext]);
                }
            }
            results = newResults;
            if (!nextBits.isEmpty()) {
                results.push([nextTape, nextBits, nextMatched, next]);
            }
        }
        yield *results;

    }

    public runUnitTest(test: State): boolean {
        const testingState = Filter(this, test);
        const tapeCollection = this.getAllTapes(); // see the commentary on .parse() for why we have
        test.collectVocab(tapeCollection, []); // to do something special with the tapes.
        testingState.allTapes = tapeCollection;
        const results = [...testingState.generate()];
        return (results.length != 0);
    }

    public *parse(inputs: StringDict,
                randomize: boolean = false,
                maxRecursion: number = 4, 
                maxChars: number = 1000): Gen<StringDict> {

        const inputLiterals: State[] = [];
        for (const tapeName in inputs) {
            const value = inputs[tapeName];
            const inputLiteral = Lit(tapeName, value);
            inputLiterals.push(inputLiteral);
        }

        var startState: State = this;

        if (inputLiterals.length > 0) {
            const inputSeq = Seq(...inputLiterals);
            startState = Filter(startState, inputSeq); 
            const tapeCollection = this.getAllTapes(); // in case this state has already
                    // been compiled, we need to start the algorithm with the same vocab.
                    // if it hasn't been compiled, .allTapes always starts as undefined anyway,
                    // so it's no change.
            inputSeq.collectVocab(tapeCollection, []);   
                                        // add any new characters in the inputs to the vocab
                                        //  this would actually happen automatically
                                        // anyway, but I'd rather do it explicitly here 
                                        // than rely on an undocumented side-effect
            startState.allTapes = tapeCollection; 
        }

        yield *startState.generate(randomize, maxRecursion, maxChars);
    }

    public sample(
        restriction: StringDict,
        numSamples: number = 1,
        maxTries: number = 1000,
        maxRecursion: number = 4, 
        maxChars: number = 1000
    ): StringDict[] {

        var results: StringDict[] = [];
        var tries = 0;

        while (results.length < numSamples && tries < maxTries) {

            const gen = this.parse(restriction, true, maxRecursion, maxChars);
            const firstResult = iterTake(gen, 1);
            results = results.concat(firstResult);
            tries++;
        }

        return results;
    }

    /**
     * Performs a breadth-first traversal of the graph.  This will be the function that most 
     * clients will be calling.
     * 
     * Even parsing is just calling generate.  (It's a separate function only because of a
     * complication with compilation.)  To do parses, we
     * join the grammar with a grammar corresponding to the query.  E.g., if we wanted to parse
     * { text: "foo" } in grammar X, we would construct JoinState(LiteralState("text", "foo"), X).
     * The reason for this is that it allows us a diverse collection of query types for free, by
     * choosing an appropriate "query grammar" to join X with.
     * 
     * @param [maxRecursion] The maximum number of times the grammar can recurse; for infinite recursion pass Infinity.
     * @param [maxChars] The maximum number of steps any one traversal can take (roughly == the total number of characters
     *                    output to all tapes)
     * @returns a generator of { tape: string } dictionaries, one for each successful traversal. 
     */
    public *generate(random: boolean = false,
                    maxRecursion: number = 4, 
                    maxChars: number = 1000): Gen<StringDict> {
        
        const symbolStack = new CounterStack(maxRecursion);
        const allTapes = this.getAllTapes();

        const startTime = Date.now();
        const startingState = random ? this.randomize() : this;

        if (allTapes.isTrivial) {
            // there aren't any literal characters anywhere in the grammar, so there's no vocab.  
            // the only possible output is the empty grammar.
            if (startingState.accepting(allTapes, random, symbolStack)) {
                yield {};
            }
            return;
        }

        const initialOutput: MultiTapeOutput = new MultiTapeOutput();

        var stateQueue: [MultiTapeOutput, State][] = [[initialOutput, startingState]];
        var chars = 0;

        while (stateQueue.length > 0 && chars < maxChars) {
            var nextQueue: [MultiTapeOutput, State][] = [];
            for (const [prevOutput, prevState] of stateQueue) {

                if (prevState.accepting(allTapes, random, symbolStack)) {
                    yield* prevOutput.toStrings(random);
                }

                for (const [tape, c, matched, newState] of 
                            prevState.dQuery(allTapes, ANY_CHAR, random, symbolStack)) {
                    if (!matched) {
                        throw new Error("Something went wrong, got all the way through without a match");
                    }
                    const nextOutput = prevOutput.add(tape, c);
                    nextQueue.push([nextOutput, newState]);
                }
            }
            stateQueue = nextQueue;
            chars++;
        }
    }

    /**
     * Collects all explicitly mentioned characters in the grammar for all tapes.
     * 
     * @param tapes A TapeCollection for holding found characters
     * @param stateStack What symbols we've already collected from, to prevent inappropriate recursion
     * @returns vocab 
     */
    public collectVocab(tapes: Tape, stateStack: string[]): void { }


    public compileAux(
        allTapes: TapeCollection, 
        symbolStack: CounterStack,
        compileLevel: number
    ): State {
        return this;
    }

    public compile(
        compileLevel: number,
        maxRecursion: number = 4
    ): State {
        const allTapes = this.getAllTapes();
        return this.compileAux(allTapes, new CounterStack(maxRecursion), compileLevel);
    }

    public isEmpty(): boolean {
        return false;
    }
}

class CompiledState extends State {

    public id: string;
    public acceptingOnStart: {[tape: string]: boolean} = {};
    public transitionsByTape: {[tape: string]: [Tape, Token, boolean, State][]} = {};

    constructor(
        originalState: State,
        allTapes: TapeCollection,
        symbolStack: CounterStack,
        compileLevel: number,
    ) {
        super();
        this.id = `cmp${originalState.id}@${symbolStack.id}`;
        // your relevant states, and your accepting status, are inherited from the original
        this.relevantTapes = originalState.getRelevantTapes(symbolStack);

        // then run dQuery and remember the results
        const tapes = [ allTapes, ...allTapes.tapes.values() ];
        for (const tape of tapes) {
            
            // first remember the value of accepting() for this tape
            this.acceptingOnStart[tape.tapeName] = originalState.accepting(tape, false, symbolStack);

            // then remember the results
            for (const [resTape, resToken, resMatched, resNext] of 
                                    originalState.dQuery(tape, tape.any(), false, symbolStack)) {
                const compiledNext = resNext.compileAux(allTapes, symbolStack, compileLevel-1);
                this.addTransition(tape, resTape, resToken, resMatched, compiledNext);
            }
        }

        this.allTapes = allTapes;
    }

    public addTransition(queryTape: Tape,
                        resultTape: Tape,
                        token: Token,
                        matched: boolean,
                        next: State): void {
        if (!(queryTape.tapeName in this.transitionsByTape)) {
            this.transitionsByTape[queryTape.tapeName] = [];
        }
        this.transitionsByTape[queryTape.tapeName].push([resultTape, token, matched, next]);
    }

    public accepting(tape: Tape, random: boolean, symbolStack: CounterStack): boolean {
        if (!(tape.tapeName in this.acceptingOnStart)) {
            return false;
        }
        return this.acceptingOnStart[tape.tapeName];
    }

    /**
     * For CompiledState, query results are already deterministic (in the sense of dQuery;
     * they might not be unique), because they themselves are the result of calling dQuery.
     * So it's not necessary to determinize them again; we just yield ndQuery.
     */
    public *dQuery(tape: Tape, 
        target: Token,
        random: boolean,
        symbolStack: CounterStack): Gen<[Tape, Token, boolean, State]> {

        yield *this.ndQuery(tape, target, random, symbolStack);
    }

    public *ndQuery(tape: Tape, 
        target: Token,
        random: boolean,
        symbolStack: CounterStack): Gen<[Tape, Token, boolean, State]> {

        const transitions = this.transitionsByTape[tape.tapeName];
        if (transitions == undefined) {
            // no transitions were recording for this tape, it must have failed for all possibilities
            return;
        }

        for (const [origResultTape, token, matched, next] of transitions) {
            if (origResultTape.isTrivial) { // no vocab, so no possible results
                yield [origResultTape, token, matched, next];
                return;
            } 
            const matchedTape = tape.matchTape(origResultTape.tapeName);
            if (matchedTape == undefined) {
                throw new Error(`Failed to match ${tape.tapeName} to ${origResultTape.tapeName}..?`);
            }
            const resultToken = matchedTape.match(token, target);
            if (resultToken.isEmpty()) {
                continue;
            }
            yield [matchedTape, resultToken, matched, next];
        }
    }
}

/**
 * Abstract base class for both LiteralState and AnyCharState,
 * since they share the same query algorithm template.
 * 
 * In order to implement TextState, a descendant class must implement
 * firstToken() (giving the first token that needs to be matched) and
 * successor() (returning the state to which we would translate upon successful
 * matching of the token).
 */
abstract class TextState extends State {

    constructor(
        public tapeName: string
    ) {
        super();
    }

    protected abstract getToken(tape: Tape): Token;
    protected abstract successor(): State;

    public *ndQuery(tape: Tape, 
                    target: Token,
                    random: boolean,
                    symbolStack: CounterStack): Gen<[Tape, Token, boolean, State]> {

        const matchedTape = tape.matchTape(this.tapeName);
        if (matchedTape == undefined) {
            yield [tape, target, false, this];
            return;
        }
        
        if (this.accepting(matchedTape, random, symbolStack)) {
            return; 
        }

        const bits = this.getToken(matchedTape);
        const result = matchedTape.match(bits, target);
        if (result.isEmpty()) {
            return;
        }
        const nextState = this.successor();
        yield [matchedTape, result, true, nextState];

    }

    public getRelevantTapes(stateStack: CounterStack): Set<string> {
        if (this.relevantTapes == undefined) {
            this.relevantTapes = new Set([this.tapeName]);
        }
        return this.relevantTapes;
    }
}

/**
 * The state that recognizes/emits any character on a specific tape; 
 * implements the "dot" in regular expressions.
 */
export class AnyCharState extends TextState {

    public get id(): string {
        return `${this.tapeName}:(ANY)`;
    }
    
    protected getToken(tape: Tape): Token {
        return tape.any();
    }

    public accepting(
        tape: Tape,
        random: boolean, 
        symbolStack: CounterStack
    ): boolean {
        const matchedTape = tape.matchTape(this.tapeName);
        if (matchedTape == undefined) {
            return true;
        }
        return false;
    }

    protected successor(): State {
        return new TrivialState();
    }
}

/**
 * Recognizes/emits a literal string on a particular tape.  
 * Inside, it's just a string like "foo"; upon successfully 
 * matching "f" we construct a successor state looking for 
 * "oo", and so on.
 * 
 * The first time we construct a LiteralState, we just pass in
 * the text argument, and leave tokens empty.  (This is because,
 * at the initial point of construction of a LiteralState, we
 * don't know what the total character vocabulary of the grammar is
 * yet, and thus can't tokenize it into Tokens yet.)  On subsequent
 * constructions, like in successor(), we've already tokenized,
 * so we pass the remainder of the tokens into the tokens argument.
 * It doesn't really matter what we pass into text in subsequent
 * constructions, it's not used except for debugging, so we just pass
 * in the original text.
 */
export class LiteralState extends TextState {

    constructor(
        tape: string,
        public text: string,
        public index: number = 0
    ) { 
        super(tape);
    }

    public isEmpty(): boolean {
        return this.text.length == 0;
    }

    public get id(): string {
        const index = this.index > 0 ? `[${this.index}]` : ""; 
        return `${this.tapeName}:${this.text}${index}`;
    }

    public accepting(
        tape: Tape, 
        random: boolean, 
        symbolStack: CounterStack
    ): boolean {
        const matchedTape = tape.matchTape(this.tapeName);
        if (matchedTape == undefined) {
            return true;
        }
        return this.index >= this.text.length;
    }

    public collectVocab(tapes: Tape, stateStack: string[]): void {
        tapes.tokenize(this.tapeName, this.text);
    }

    protected getToken(tape: Tape): Token {
        return tape.tokenize(tape.tapeName, this.text[this.index])[0];
    }

    protected successor(): State {
        const newText = this.text;
        return new LiteralState(this.tapeName, this.text, this.index+1);
    }

    public getText(): string {
        // Return the remaining text for this LiteralState.
        return this.text.slice(this.index);
    }


}

/**
 * Recognizes the empty grammar.  This is occassionally 
 * useful in implementing other states (e.g. when
 * you need a state that's accepting but won't go anywhere).
 */
export class TrivialState extends State {

    public get id(): string {
        return "0";
    }

    public isEmpty(): boolean {
        return true;
    }

    public accepting(tape: Tape, random: boolean,  symbolStack: CounterStack): boolean {
        return true;
    }

    public *ndQuery(tape: Tape, 
        target: Token,
        random: boolean,
        symbolStack: CounterStack): Gen<[Tape, Token, boolean, State]> { }
}


/**
 * The abstract base class of all States with two state children 
 * (e.g. [JoinState]).
 */
abstract class BinaryState extends State {

    constructor(
        public child1: State,
        public child2: State,
        relevantTapes: Set<string> | undefined = undefined
    ) {
        super();
        this.relevantTapes = relevantTapes;
    }
    
    public collectVocab(tapes: Tape, stateStack: string[]): void {
        this.child1.collectVocab(tapes, stateStack);
        this.child2.collectVocab(tapes, stateStack);
    }
    
    public getRelevantTapes(stateStack: CounterStack): Set<string> {
        if (this.relevantTapes == undefined) {
            const child1tapes = this.child1.getRelevantTapes(stateStack);
            const child2tapes = this.child2.getRelevantTapes(stateStack);
            this.relevantTapes = new Set([...child1tapes, ...child2tapes]);
        }
        return this.relevantTapes;
    }

    public get id(): string {
        return `${this.constructor.name}(${this.child1.id},${this.child2.id})`;
    }

    public accepting(
        tape: Tape, 
        random: boolean, 
        symbolStack: CounterStack
    ): boolean {
        return this.child1.accepting(tape, random, symbolStack) && 
                this.child2.accepting(tape, random, symbolStack);
    }
}

abstract class NAryState extends State {

    constructor(
        public children: State[]
    ) {
        super();
    }

    public collectVocab(tapes: Tape, stateStack: string[]): void {
        for (const child of this.children) {
            child.collectVocab(tapes, stateStack);
        }
    }

    public getRelevantTapes(stateStack: CounterStack): Set<string> {
        if (this.relevantTapes == undefined) {
            this.relevantTapes = new Set();
            for (const child of this.children) {
                const childTapes = child.getRelevantTapes(stateStack);
                this.relevantTapes = new Set([...this.relevantTapes, ...childTapes]);
            }
        }
        return this.relevantTapes;
    }
}

/*
export class ListState extends BinaryState {

    constructor(
        child1: State,
        child2: State,
        public indices: {[tapeName: string]: boolean} | undefined = undefined
    ) {
        super(child1, child2);
    }

    public get id(): string {
        return `(${this.child1.id}+${this.child2.id})`;
    }

    public compileAux(
        allTapes: TapeCollection, 
        symbolStack: CounterStack,
        compileLevel: number
    ): State {

        if (compileLevel <= 0) {
            return this;
        }
        
        const newChild1 = this.child1.compileAux(allTapes, symbolStack, compileLevel);
        const newChild2 = this.child2.compileAux(allTapes, symbolStack, compileLevel);
        const newThis = new ListState(newChild1, newChild2);
        return new CompiledState(newThis, allTapes, symbolStack, compileLevel);
    }

    public randomize(): State {
        return new ListState(this.child1.randomize(), this.child2.randomize());
    }

    public getIndices(symbolStack: CounterStack): {[tapeName: string]: boolean} {
        if (this.indices == undefined) {
            this.indices = {};
            for (const tapeName of this.getRelevantTapes(symbolStack)) {
                this.indices[tapeName] = false;
            }
        }
        return this.indices;
    }

    protected getCurrentIndex(tape: Tape, symbolStack: CounterStack): [Tape | undefined, boolean] {
        
        const indices = this.getIndices(symbolStack);

        if (!(tape.tapeName == "__ANY_TAPE__")) {
            if (!(tape.tapeName in indices)) {
                throw new Error(`Cannot find tape ${tape.tapeName} in indices in ${this.id}`);
            }
            return [tape, indices[tape.tapeName]];
        }

        // the tape is ANY_TAPE, we need to find an index that is false
        let minTapeName = "";
        let minIndex = Infinity;
        for (const [tapeName, tapeIsDone] of Object.entries(indices)) {
            if (!tapeIsDone) {
                const matchedTape = tape.matchTape(tapeName);
                return [matchedTape, false];
            }
        }
    }

}
*/

/**
 * ConcatState represents the current state in a concatenation A+B+... of 2+ grammars.
 * 
 * The one thing that makes ConcatState a bit tricky is that they're the only part of the grammar
 * where there is a precedence order, which in a naive implementation can lead to a deadlock situation.
 * For example, if we have ConcatState(LiteralState("A","a"), LiteralState("B","b")), then the material
 * on tape A needs to be emitted/matched before the material on tape B.  But then consider the opposite,
 * ConcatState(LiteralState("B","b"), LiteralState("A","a")).  That grammar describes the same database,
 * but looks for the material in opposite tape order.  If we join these two, the first is emitting on A and
 * waiting for a match, but the second can't match it because it'll only get there later.
 */

 export class ConcatState extends NAryState {

    constructor(
        children: State[],
        public indices: {[tapeName: string]: number} | undefined = undefined
    ) {
        super(children);
    }

    
    public compileAux(
        allTapes: TapeCollection, 
        symbolStack: CounterStack,
        compileLevel: number
    ): State {
        
        if (compileLevel <= 0) {
            return this;
        }

        const newChildren = this.children.map(c => c.compileAux(allTapes, symbolStack, compileLevel));
        const newThis = new ConcatState(newChildren, this.indices);
        return new CompiledState(newThis, allTapes, symbolStack, compileLevel);
    } 

    public get id(): string {
        return `Seq(${this.children.map(c => c.id).join("+")})`;
    }

    public randomize(): State {
        const newChildren = this.children.map(c => c.randomize());
        return new ConcatState(newChildren);
    }

    public isEmpty(): boolean {

        if (this.children.length == 0) {
            return true;
        }

        for (const child of this.children) {
            if (!child.isEmpty()) {
                return false;
            }
        }

        return true;
    }

    public getIndices(symbolStack: CounterStack): {[tapeName: string]: number} {
        if (this.indices == undefined) {
            this.indices = {};
            for (const tapeName of this.getRelevantTapes(symbolStack)) {
                this.indices[tapeName] = 0;
            }
        }
        return this.indices;
    }

    public accepting(
        tape: Tape, 
        random: boolean, 
        symbolStack: CounterStack
    ): boolean {
        for (const child of this.children) {
            if (!child.accepting(tape, random, symbolStack)) {
                return false;
            }
        }
        return true;
    }

    public successor(
        tape: Tape, 
        newChild: State,
        newIndex: number,
        symbolStack: CounterStack
    ): ConcatState {
        
        const currentIndices = this.getIndices(symbolStack);
        
        const newIndices: {[tapeName: string]: number} = {};
        Object.assign(newIndices, currentIndices);
        newIndices[tape.tapeName] = newIndex;

        const newChildren = [... this.children];
        newChildren[newIndex] = newChild;
        return new ConcatState(newChildren, newIndices);
    }

    protected getCurrentIndex(tape: Tape, symbolStack: CounterStack): [Tape | undefined, number] {
        const indices = this.getIndices(symbolStack);

        if (!(tape.tapeName == "__ANY_TAPE__")) {
            if (!(tape.tapeName in indices)) {
                throw new Error(`Cannot find tape ${tape.tapeName} in indices in ${this.id}`);
            }
            return [tape, indices[tape.tapeName]];
        }

        // the tape is ANY_TAPE, we need to find the lowest index of our indices.
        let minTapeName = "";
        let minIndex = Infinity;
        for (const [tapeName, index] of Object.entries(indices)) {
            if (index < minIndex) {
                minTapeName = tapeName;
                minIndex = index;
            }
        }
        const matchedTape = tape.matchTape(minTapeName);
        // matchedTape *can* be undefined here; it's not an error, it's the correct
        // behavior when all the children are Empty()
        return [matchedTape, minIndex];
    }

    public *ndQuery(
        tape: Tape, 
        target: Token,
        random: boolean,
        symbolStack: CounterStack
    ): Gen<[Tape, Token, boolean, State]> {

        if (!this.caresAbout(tape)) {
            // if no child cares, just short circuit this rather than bother with all the rest
            yield [tape, target, false, this];
            return;
        }

        const [matchedTape, currentIndex] = this.getCurrentIndex(tape, symbolStack);
        // when tape is an actual named tape, matchedTape will be identical.  but when
        // tape is ANY_TAPE, matchedTape will be a named tape.  we don't actually use this
        // tape for querying children; we only use it to check whether the child is accepting 
        // on a tape, and increment the index for that tape if so.

        if (matchedTape == undefined) {
            // this can happen when all the children are empty
            return;
        }

        if (currentIndex >= this.children.length) {
            return;
        }

        const currentChild = this.children[currentIndex];

        if (currentChild.accepting(tape, random, symbolStack)) {
            if (currentIndex+1 < this.children.length) {
                const currentChild = this.children[currentIndex+1];
                const successor = this.successor(matchedTape, currentChild, currentIndex+1, symbolStack);
                yield* successor.ndQuery(tape, target, random, symbolStack);
            }
        }

        const childResults = [...currentChild.ndQuery(tape, target, random, symbolStack)];
        for (const [cTape, cTarget, cMatched, cNext] of childResults) {
            if (!cMatched) {
                // we don't accept trivial transitions by NewConcatState children.  only
                // if the entire sequence doesn't care, do we perform a trivial match, above.
                continue;
            }
            
            // in this successor, the indices stay the same, but we change the
            // child at the current index to cNext
            const newChildren = [... this.children];
            newChildren[currentIndex] = cNext;
            const successor = new ConcatState(newChildren, this.indices);
            yield [cTape, cTarget, cMatched, successor];
        }
    }
}

/*

// this is the old implementation of ConcatState 

export class ConcatState extends BinaryState {

    constructor(
        child1: State,
        child2: State,
        protected child1Done: boolean = false,
        relevantTapes: Set<string> | undefined = undefined
    ) {
        super(child1, child2, relevantTapes);
    }

    public compileAux(
        allTapes: TapeCollection, 
        symbolStack: CounterStack,
        compileLevel: number
    ): State {

        if (compileLevel <= 0) {
            return this;
        }
        
        const newChild1 = this.child1.compileAux(allTapes, symbolStack, compileLevel);
        const newChild2 = this.child2.compileAux(allTapes, symbolStack, compileLevel);

        const newThis = new ConcatState(newChild1, newChild2, this.child1Done, this.relevantTapes);

        return new CompiledState(newThis, allTapes, symbolStack, compileLevel);
    }

    public *ndQuery(tape: Tape, 
        target: Token,
        random: boolean,
        symbolStack: CounterStack): Gen<[Tape, Token, boolean, State]> {
        
        if (!this.caresAbout(tape)) {
            // if neither child cares, just short circuit this rather than bother with all the rest
            yield [tape, target, false, this];
            return;
        }

        if (this.child1Done) {
            if (!this.child2.caresAbout(tape)) {
                return;
            }

            for (const [c2tape, c2text, c2matched, c2next] of 
                this.child2.dQuery(tape, target, random, symbolStack)) {
                const successor = new ConcatState(this.child1, c2next, true, this.relevantTapes);
                yield [c2tape, c2text, c2matched, successor];
            }
            return;
        }

        var yieldedAlready = false;

        if (this.child1.accepting(tape, random, symbolStack)) {
            const successor = new ConcatState(this.child1, this.child2, true, this.relevantTapes);
            yield* successor.dQuery(tape, target, random, symbolStack);
            yieldedAlready = true;
        }

        if (this.child1.caresAbout(tape)) {
            for (const [c1tape, c1text, c1matched, c1next] of 
                    this.child1.dQuery(tape, target, random, symbolStack)) {
                const successor = new ConcatState(c1next, this.child2, false, this.relevantTapes);
                yield [c1tape, c1text, c1matched, successor];
            }
            return;
        }

        if (yieldedAlready == true) {
            return;
        }
        
        // child2 must care, otherwise one of the previous conditions would have triggered
        for (const [c2tape, c2text, c2matched, c2next] of 
                this.child2.dQuery(tape, target, random, symbolStack)) {
            const successor = new ConcatState(this.child1, c2next, false, this.relevantTapes);
            yield [c2tape, c2text, c2matched, successor];
        }
    }
}

*/


export class UnionState extends NAryState {

    constructor(
        children: State[]
    ) {
        super(children);
    }
    
    public compileAux(
        allTapes: TapeCollection, 
        symbolStack: CounterStack,
        compileLevel: number
    ): State {
        
        if (compileLevel <= 0) {
            return this;
        }

        const newChildren = this.children.map(c => c.compileAux(allTapes, symbolStack, compileLevel));
        const newThis = new UnionState(newChildren);
        return new CompiledState(newThis, allTapes, symbolStack, compileLevel);
    }

    public isEmpty(): boolean {

        if (this.children.length == 0) {
            return true;
        }

        for (const child of this.children) {
            if (child.isEmpty()) {
                return true;
            }
        }

        return false;
    }

    public get id(): string {
        return `(${this.children.map(c => c.id).join("|")})`;
    }

    public randomize(): State {
        if (this.children.length == 0) {
            return this;
        }
        const randomChild = this.children[Math.floor(Math.random() * this.children.length)];
        return randomChild.randomize();
    }

    public accepting(
        tape: Tape, 
        random: boolean, 
        symbolStack: CounterStack
    ): boolean {

        if (this.children.length == 0) {
            return true;
        }

        for (const child of this.children) {
            if (child.accepting(tape, random, symbolStack)) {
                return true;
            }
        }

        return false;
    }

    public *ndQuery(tape: Tape, 
        target: Token,
        random: boolean,
        symbolStack: CounterStack): Gen<[Tape, Token, boolean, State]> {

        if (this.children.length == 0) {
            return;
        }

        for (const child of this.children) {
            yield* child.ndQuery(tape, target, random, symbolStack);
        }
    }
} 

/**
 * Convenience function that takes two generators, and yields from the
 * second only if it can't yield from the first.  This is handy in situations
 * like the implementation of join, where if we yielded from both we would
 * constantly be yielding the same states.
 */
function *iterPriorityUnion<T>(iter1: Gen<T>, iter2: Gen<T>): Gen<T> {

    var yieldedAlready = false;
    for (const output of iter1) {
        yield output;
        yieldedAlready = true;
    }

    if (!yieldedAlready) {   
        yield* iter2;
    }
}


/**
 * Filter(A, B) removes outputs of A that do not contain an output of B.  That is, consider these two
 * grammars:
 * 
 *    A = [ { T1:a, T2:b }, {T1:b, T2:b }, {T1:c, T1:a}, and {T1:d} ]
 *    B = [ { T2:b } ]
 * 
 * Filter(A, B) would output [ { T1:a, T2:b }, {T1:b, T2:b } ].  Note that {T1:d} wasn't included, even
 * though T2 is irrelevant to it -- this isn't just "match T2:b if you care about T2", but "you must match T2:b".
 *  
 * At one point we incorrectly called this a left semijoin, but a left semijoin doesn't care about tapes
 * in B that aren't defined in A, whereas this does.
 */
class FilterState extends BinaryState {

    /**
     * Because .successor() on both this and its descendent JoinState are
     * so simple, we only have to write one compileAux() for both
     */
    public compileAux(
        allTapes: TapeCollection, 
        symbolStack: CounterStack,
        compileLevel: number
    ): State {
        if (compileLevel <= 0) {
            return this;
        }
        const newChild1 = this.child1.compileAux(allTapes, symbolStack, compileLevel);
        const newChild2 = this.child2.compileAux(allTapes, symbolStack, compileLevel);
        const newThis = this.successor(newChild1, newChild2);
        return new CompiledState(newThis, allTapes, symbolStack, compileLevel);
    }

    public randomize(): State {
        const randomLeft = this.child1.randomize();
        return new FilterState(randomLeft, this.child2);
    }

    /**
     * We factor this out from ndQuery because the descendant Join class uses it too.
     */
    public *filter(
        tape: Tape,
        target: Token,
        c1: State,
        c2: State,                  
        random: boolean,
        symbolStack: CounterStack): Gen<[Tape, Token, boolean, State]> {
                            

        for (const [c1tape, c1target, c1matched, c1next] of 
                c1.ndQuery(tape, target, random, symbolStack)) {

            /*
            if (c1tape.isTrivial) { 
                // c1 contained a ProjectionState that hides the original tape; move on without
                // asking c2 to match anything.
                const successor = this.successor(c1next, c2);
                yield [c1tape, c1target, c1matched, successor];
                continue;
            } */
            
            /*
            if (!c2.caresAbout(c1tape)) {
                const successor = this.successor(c1next, c2);
                yield [c1tape, c1target, c1matched, successor];
                continue;
            }  */
            
            /**
             * Even if we're random, we don't ask the other side to randomize; this 
             * would end up having surprising effects.
             */
            for (const [c2tape, c2target, c2matched, c2next] of 
                    c2.ndQuery(c1tape, c1target, false, symbolStack)) {
                const successor = this.successor(c1next, c2next);
                yield [c2tape, c2target, c1matched || c2matched, successor];
            }
        } 
    }

    protected successor(newChild1: State, newChild2: State): State {
        return new FilterState(newChild1, newChild2, this.relevantTapes);
    }

    public *ndQuery(tape: Tape, 
        target: Token,
        random: boolean,
        symbolStack: CounterStack): Gen<[Tape, Token, boolean, State]> {

        yield *this.filter(tape, target, this.child1, this.child2, random, symbolStack);
    }

    public accepting(tape: Tape, random: boolean, symbolStack: CounterStack): boolean {
        return this.child1.accepting(tape, random, symbolStack) && 
                this.child2.accepting(tape, random, symbolStack);
    }

}


/**
 * The JoinState implements the natural join (in the relational algebra sense)
 * for two automata. This is a fundamental operation in the parser, as we implement
 * parsing as a traversal of a corresponding join state.  You can think of join(X,Y)
 * as yielding from the intersection of X and Y on tapes that they share, and the product
 * on tapes that they don't share.
 * 
 * The algorithm is simplified by the fact that join(X, Y) can be implemented the union
 * of the left and right semijoins (or, put another way, the left semijoin of (X,Y) and 
 * the left semijoin of (Y,X)).  The left semijoin (X,Y) just consists of querying X, then 
 * taking the result of that and querying Y, and yielding the result of that.
 * 
 * Because the ordinary union of these would lead to the same states twice, we use the
 * priority union instead.
 * 
 * Note that even though, on its own, the Filter(A, B) operation is not the semijoin, the
 * way its used *here* ends up equivalent to the union of semijoins.
 */
export class JoinState extends FilterState {
    
    protected successor(newChild1: State, newChild2: State): State {
        return new JoinState(newChild1, newChild2, this.relevantTapes);
    }

    
    public randomize(): State {
        const randomLeft = this.child1.randomize();
        const randomRight = this.child2.randomize();
        return new JoinState(randomLeft, randomRight);
    }

    public accepting(
        tape: Tape, 
        random: boolean, 
        symbolStack: CounterStack
    ): boolean {
        return this.child1.accepting(tape, random, symbolStack) && 
               this.child2.accepting(tape, random, symbolStack);
    }

    public *ndQuery(tape: Tape, 
        target: Token,
        random: boolean,
        symbolStack: CounterStack): Gen<[Tape, Token, boolean, State]> {

        const leftJoin = this.filter(tape, target, this.child1, this.child2, random, symbolStack);
        const rightJoin = this.filter(tape, target, this.child2, this.child1, random, symbolStack);
        
        if (this.child1.accepting(tape, random, symbolStack)) {
            yield* iterPriorityUnion(rightJoin, leftJoin);
            return;
        }

        yield* iterPriorityUnion(leftJoin, rightJoin);
    }

} 

/**
 * Abstract base class for states with only one child state.  Typically, UnaryStates
 * handle queries by forwarding on the query to their child, and doing something special
 * before or after.  For example, [EmbedStates] do a check a stack of symbol names to see
 * whether they've passed the allowable recursion limit, and [RenameState]s change what
 * the different tapes are named.
 * 
 * Note that [UnaryState.child] is a getter, rather than storing an actual child.  This is
 * because [EmbedState] doesn't actually store its child, it grabs it from a symbol table instead.
 * (If it tried to take it as a param, or construct it during its own construction, this wouldn't 
 * work, because the EmbedState's child can be that EmbedState itself.)
 */
abstract class UnaryState extends State {

    public abstract get child(): State;

    public get id(): string {
        return `${this.constructor.name}(${this.child.id})`;
    }
    
    public collectVocab(tapes: Tape, stateStack: string[]): void {
        this.child.collectVocab(tapes, stateStack);
    }

    public getRelevantTapes(stateStack: CounterStack): Set<string> {
        if (this.relevantTapes == undefined) {
            this.relevantTapes = this.child.getRelevantTapes(stateStack);
        }
        return this.relevantTapes;
    }

    public accepting(tape: Tape, random: boolean, symbolStack: CounterStack): boolean {
        return this.child.accepting(tape, random, symbolStack);
    }
}

/*
export class StarState extends State {

    protected currentChild: State = new TrivialState();
    protected nextChild: State | undefined = undefined;

    constructor(
        public initialChild: State
    ) {
        super();
    }

    public accepting(tape: Tape, symbolStack: CounterStack): boolean {
        return this.currentChild.accepting(tape, symbolStack);
    }

    public get id(): string {
        return `(${this.initialChild.id})*`;
    }

    public *ndQuery(
        tape: Tape, 
        target: Token,
        random: boolean,
        symbolStack: CounterStack
    ): Gen<[Tape, Token, boolean, State]> {

        if (!this.caresAbout(tape)) {
            // if no child cares, just short circuit this rather than bother with all the rest
            yield [tape, target, false, this];
            return;
        }

        if (this.accepting(tape, symbolStack)) {


        }

        const successor = new ConcatState([this.child, this]);
        yield* successor.ndQuery(tape, target, random, symbolStack);
    }
}
*/

/**
 * RepetitionState implements the Kleene star, plus, question mark, and in general
 * repetitions between N and M times.  (E.g. x{2,3} matching x two or three times.)
 * 
 * The slightly odd part of implementing RepetitionState, compared to other states, is that only
 * RepetitionState needs to remember the initial state of its child.  That is, all the
 * other UnaryStates only keep track of the current state of the child parse.  RepetitionState,
 * however, needs to be able to *restart* the child.  To do that, it
 * keeps around the original child state, so that it can construct its appropriate successor
 * when the current child state is finished.
 * 
 * Note that the below algorithm is fairly similar to [ConcatState]; in the future
 * we might want to partially unify these the way we did [LiteralState] and [AnyCharState].
 */
export class RepetitionState extends UnaryState {

    constructor(
        public child: State,
        public minReps: number = 0,
        public maxReps: number = Infinity,
        public index: number = 0,
        public initialChild: State,
    ) { 
        super();
    }

    public randomize(): State {

        const newChild = this.child.randomize();
        
        let randomReps = 0;

        if (this.minReps > this.maxReps) {
            randomReps = -1;
        } else if (this.minReps == this.maxReps) {
            randomReps = this.minReps;
        } else {
            const maxReps = (this.maxReps != Infinity) ? this.maxReps : 10;
            const range = maxReps - this.minReps + 1;
            randomReps = this.minReps + Math.floor(Math.random() * range);
        }

        return new RepetitionState(newChild, randomReps, randomReps, this.index, this.initialChild);
    }

    public get id(): string {
        if (this.minReps == this.maxReps) {
            return `${this.initialChild.id}{${this.minReps}}`;
        }
        return `${this.initialChild.id}{${this.minReps},${this.maxReps}}`;
    }

    public isEmpty(): boolean {
        return this.initialChild.isEmpty() || (this.minReps == 0 && this.index == 0 && this.child.isEmpty());
    }

    public compileAux(
        allTapes: TapeCollection, 
        symbolStack: CounterStack,
        compileLevel: number
    ): State {
        
        if (compileLevel <= 0) {
            return this;
        }
        const newInitialChild = this.initialChild.compileAux(allTapes, symbolStack, compileLevel);
        const newThis = new RepetitionState(this.child, this.minReps, this.maxReps, 
                                                    this.index, newInitialChild);
        return new CompiledState(newThis, allTapes, symbolStack, compileLevel);
    }
    
    public collectVocab(tapes: Tape, stateStack: string[]): void {
        this.initialChild.collectVocab(tapes, stateStack);
    }

    public getRelevantTapes(stateStack: CounterStack): Set<string> {
        if (this.relevantTapes == undefined) {
            this.relevantTapes = this.initialChild.getRelevantTapes(stateStack);
        }
        return this.relevantTapes;
    }

    public accepting(
        tape: Tape, 
        random: boolean, 
        symbolStack: CounterStack
    ): boolean {

        if (this.child.isEmpty() && this.initialChild.isEmpty()) {
            return true;
        } 

        return this.index >= this.minReps && 
            this.index <= this.maxReps && 
            this.child.accepting(tape, random, symbolStack);
    }

    public *ndQuery(tape: Tape, 
        target: Token,
        random: boolean,
        symbolStack: CounterStack): Gen<[Tape, Token, boolean, State]> {

        if (this.index > this.maxReps) {
            return;
        }

        if (!this.child.caresAbout(tape)) {
            yield [tape, target, false, this];
        } 

        if (this.child.accepting(tape, random, symbolStack) &&
            !(this.maxReps == Infinity && this.child == this.initialChild)) {
            const successorChild = random ? this.initialChild.randomize() : this.initialChild;
            const successor = new RepetitionState(successorChild, this.minReps, this.maxReps, 
                                                this.index+1, this.initialChild)
            for (const result of successor.ndQuery(tape, target, random, symbolStack)) {
                yield result;
            }
        }

        for (const [childTape, childText, childMatched, childNext] of 
                this.child.ndQuery(tape, target, random, symbolStack)) {
            if (!childMatched) { // child doesn't care, neither do we
                yield [childTape, childText, false, this];
                continue;
            }

            const successor = new RepetitionState(childNext, this.minReps, this.maxReps, this.index, this.initialChild);
            yield [childTape, childText, childMatched, successor];
        }

    }
}

/**
 * The parser that handles arbitrary subgrammars referred to by a symbol name; this is what makes
 * recursion possible.
 * 
 * Like most such implementations, EmbedState's machinery serves to delay the construction of a child
 * state, since this child may be the EmbedState itself, or refer to this EmbedState by indirect recursion.
 * So instead of having a child at the start, it just has a symbol name and a reference to a symbol table.
 * 
 * The successor states of the EmbedState may have an explicit child, though: the successors of that initial
 * child state.  (If we got the child from the symbol table every time, we'd just end up trying to match its 
 * first letter again and again.)  We keep track of that through the _child member, which is initially undefined
 * but which we specify when constructing EmbedState's successor.
 */
export class EmbedState extends State {

    constructor(
        public symbolName: string,
        public namespace: Namespace,
        public _child: State | undefined = undefined,
        relevantTapes: Set<string> | undefined = undefined
    ) { 
        super();
        
        // need to register our symbol name with the namespace, in case
        // the referred-to symbol is defined in a file we haven't yet loaded.
        namespace.register(symbolName);
        this.relevantTapes = relevantTapes;
    }

    public get id(): string {
        return `${this.constructor.name}(${this.symbolName})`;
    }

    public compileAux(
        allTapes: TapeCollection, 
        symbolStack: CounterStack, 
        compileLevel: number
    ): State {
        
        if (compileLevel <= 0) {
            return this;
        }
        
        if (symbolStack.exceedsMax(this.symbolName)) {
            return this;
        }

        const newStack = symbolStack.add(this.symbolName);
        this.namespace.compileSymbol(this.symbolName, allTapes, newStack, compileLevel);
        return new CompiledState(this, allTapes, symbolStack, compileLevel);
    } 
    
    public collectVocab(tapes: Tape, stateStack: string[]): void {
        if (stateStack.indexOf(this.symbolName) != -1) {
            return;
        }
        const newStack = [...stateStack, this.symbolName];
        this.getChild(false).collectVocab(tapes, newStack);
    }

    public getRelevantTapes(stateStack: CounterStack): Set<string> {
        if (this.relevantTapes == undefined) {
            if (stateStack.exceedsMax(this.symbolName)) {
                this.relevantTapes = new Set();
            } else {
                const newStack = stateStack.add(this.symbolName);
                this.relevantTapes = this.getChild(false, newStack).getRelevantTapes(newStack);
            }
        }
        return this.relevantTapes;
    }

    /*
    public get child(): State {
        if (this._child == undefined) {
            this._child = this.namespace.getSymbol(this.symbolName);
            if (this._child == undefined) {
                // this is an error, typically caused by programmer error,
                // but now is not when we notify the programmer.  just
                // fail gracefully by treating the child as the empty grammar
                this._child = Empty();
            }
        }
        return this._child;
    } */

    public getChild(random: boolean, symbolStack: CounterStack | undefined = undefined): State {
        if (this._child == undefined) {
            const child = this.namespace.getSymbol(this.symbolName, symbolStack);
            if (child == undefined) {
                // this is an error, due to the programmer referring to an undefined
                // symbol, but now is not the time to complain.  it'll be caught elsewhere
                // and the programmer will be notified.  just fail gracefully by treating
                // the child as the empty grammar
                return Empty();
            } 
            return random ? child.randomize() : child;
        }
        return this._child;
    }
    
    public accepting(
        tape: Tape, 
        random: boolean, 
        symbolStack: CounterStack
    ): boolean {
        if (symbolStack.exceedsMax(this.symbolName)) {
            return false;
        }
        const newStack = symbolStack.add(this.symbolName);
        return this.getChild(random, newStack).accepting(tape, random, newStack);
    }

    public *ndQuery(tape: Tape, 
        target: Token,
        random: boolean,
        symbolStack: CounterStack): Gen<[Tape, Token, boolean, State]> {

        if (symbolStack.exceedsMax(this.symbolName)) {
            return;
        }

        symbolStack = symbolStack.add(this.symbolName);
        let child = this.getChild(random, symbolStack);

        for (const [childchildTape, childTarget, childMatched, childNext] of 
                        child.ndQuery(tape, target, random, symbolStack)) {
            const successor = new EmbedState(this.symbolName, this.namespace, childNext, this.relevantTapes);
            yield [childchildTape, childTarget, childMatched, successor];
        }
    }
}

/**
 * A state that implements Projection in the sense of relational algebra, only 
 * exposing a subset of fields (read: tapes) of its child state.
 * 
 * Note that the child state itself still has and operates on those fields/tapes.
 * For example, the Projection of a join can still fail when there's a conflict regarding
 * field T, even if the Projection hides field T.  We can think of the Project as encapsulating
 * the set of fields/tapes such that only a subset of its fields are exposed to the outside,
 * rather than removing those fields/tapes.
 */
/*
export class ProjectionState extends UnaryState {

    constructor(
        public child: State,
        public tapeRestriction: Set<string>
    ) { 
        super();
    }

    public compileAux(
        allTapes: TapeCollection, 
        symbolStack: CounterStack,
        compileLevel: number
    ): State {
        
        if (compileLevel <= 0) {
            return this;
        }
        const newChild = this.child.compileAux(allTapes, symbolStack, compileLevel);
        const newThis = new ProjectionState(newChild, this.tapeRestriction);
        return new CompiledState(newThis, allTapes, symbolStack, compileLevel);
    }

    public getRelevantTapes(stateStack: CounterStack): Set<string> {
        if (this.relevantTapes == undefined) {
            this.relevantTapes = this.tapeRestriction;
        }
        return this.relevantTapes;
    }

    public *ndQuery(tape: Tape, 
        target: Token,
        random: boolean,
        symbolStack: CounterStack): Gen<[Tape, Token, boolean, State]> {

        if (tape.tapeName != "__ANY_TAPE__" && !this.tapeRestriction.has(tape.tapeName)) {
            // if it's not a tape we care about, go nowhere
            yield [tape, target, false, this];
            return;
        }

        for (var [childTape, childTarget, childMatch, childNext] of 
                            this.child.dQuery(tape, target, random, symbolStack)) {

            if (childTape.tapeName != "__ANY_TAPE__" && !this.tapeRestriction.has(childTape.tapeName)) {
                // even if our child yields content on a restricted tape, 
                // we don't let our own parent know about it
                childTape = new TapeCollection();
                childTarget = NO_CHAR;
            }
            yield [childTape, childTarget, childMatch, new ProjectionState(childNext, this.tapeRestriction)];
        }
    }
}
*/

/**
 * This is the opposite of ProjectionState; in which you specify what you drop rather than what you keep.
 * Either is sufficient to implement relational algebra; you only really need one of these.
 */
/*
export class DropState extends UnaryState {

    constructor(
        public child: State,
        public droppedTape: string
    ) { 
        super();
    }

    public getRelevantTapes(stateStack: CounterStack): Set<string> {
        const result = new Set([...this.child.getRelevantTapes(stateStack)]);
        result.delete(this.droppedTape);
        return result;
    }

    
    public compileAux(
        allTapes: TapeCollection, 
        symbolStack: CounterStack,
        compileLevel: number
    ): State {
        
        if (compileLevel <= 0) {
            return this;
        }
        const newChild = this.child.compileAux(allTapes, symbolStack, compileLevel);
        const newThis = new DropState(newChild, this.droppedTape);
        return new CompiledState(newThis, allTapes, symbolStack, compileLevel);
    }

    public *ndQuery(tape: Tape, 
        target: Token,
        random: boolean,
        symbolStack: CounterStack): Gen<[Tape, Token, boolean, State]> {

        if (tape.tapeName == this.droppedTape) {
            // don't pass it on, just stay here
            yield [tape, target, false, this];
            return;
        }

        for (var [childTape, childTarget, childMatch, childNext] of 
                            this.child.dQuery(tape, target, random, symbolStack)) {

            if (childTape.tapeName == this.droppedTape) {
                // even if our child yields content on a restricted tape, 
                // we don't let our own parent know about it
                childTape = new TapeCollection();
                childTarget = NO_CHAR;
            }
            yield [childTape, childTarget, childMatch, 
                    new DropState(childNext, this.droppedTape)];
        }
    }
}
*/

/**
 * Implements the Rename operation from relational algebra.
 *
 */
export class RenameState extends UnaryState {

    constructor(
        public child: State,
        public fromTape: string,
        public toTape: string,
        relevantTapes: Set<string> | undefined = undefined
    ) { 
        super();
        this.relevantTapes = relevantTapes;
    }

    public isEmpty(): boolean {
        return this.child.isEmpty();
    }

    public randomize(): State {
        return new RenameState(this.child.randomize(), this.fromTape, this.toTape);
    }

    public accepting(tape: Tape, random: boolean, symbolStack: CounterStack): boolean {
        tape = new RenamedTape(tape, this.fromTape, this.toTape);
        return this.child.accepting(tape, random, symbolStack);
    }

    public collectVocab(tapes: Tape, stateStack: string[]): void {
        tapes = new RenamedTape(tapes, this.fromTape, this.toTape);
        this.child.collectVocab(tapes, stateStack);
    }

    public getRelevantTapes(stateStack: CounterStack): Set<string> {
        if (this.relevantTapes == undefined) {
            this.relevantTapes = new Set();
            for (const tapeName of this.child.getRelevantTapes(stateStack)) {
                if (tapeName == this.fromTape) {
                    this.relevantTapes.add(this.toTape);
                } else {
                    this.relevantTapes.add(tapeName);
                }
            }
        }
        return this.relevantTapes;
    }

    public *ndQuery(tape: Tape, 
        target: Token,
        random: boolean,
        symbolStack: CounterStack): Gen<[Tape, Token, boolean, State]> {

        var rememberToUnwrapTape = false;

        if (tape.tapeName == this.fromTape) {
            yield [tape, target, false, this];
            return;
        }

        if (tape.tapeName == this.toTape || tape.tapeName == "__ANY_TAPE__") {
            tape = new RenamedTape(tape, this.fromTape, this.toTape);
            rememberToUnwrapTape = true;
        } 
    
        for (var [childTape, childTarget, childMatched, childNext] of 
                this.child.ndQuery(tape, target, random, symbolStack)) {
            if (rememberToUnwrapTape && childTape instanceof RenamedTape) {
                childTape = childTape.child;
            }
            yield [childTape, childTarget, childMatched, new RenameState(childNext, this.fromTape, this.toTape, this.relevantTapes)];
        }
    }
}

/**
 * Negation leads to problems, which is why many languages' regex modules
 * don't allow negation of arbitrary parts of the grammar, only of operators
 * like lookahead where negation is well-behaved.  However, negated parsers
 * are genuinely used in linguistic programming (for, e.g., phonological
 * constraints) and so we should have them.
 * 
 * In general, we negate an automaton by:
 * 
 *  * turning all accepting states into non-accepting states and vice-versa, 
 *    which we can do easily in the accepting() function.
 * 
 *  * introducing a new accepting state that the parse goes to if it "falls off"
 *    the automaton (e.g., if the automaton recognizes "foo", and get "q", then
 *    that's an acceptable negation, you need a state to accept that).  Here
 *    we implement this state by having "undefined" in place of a child.
 * 
 * There are two snags that come up when (as we do) you try to avoid actually
 * constructing the graph.
 * 
 * In general, negation of an automaton requires two things:
 * 
 *  * the automaton is deterministic; we handle that by calling dQuery instead
 *    of ndQuery.
 * 
 *  * the automaton to be negated doesn't have loops that are always 
 *    accepting (because those become loops that are never accepting, 
 *    and the traversal of them can go on forever).  Or put another way,
 *    a negated automaton can have useless states that will never lead
 *    to an output, that would be properly pruned in a concrete & determinized
 *    automaton, but that we can't be sure of when we evaluate the graph 
 *    lazily because it's effectively "looking into the future".
 * 
 * So the second one effectively requires construction and determinization of the
 * graph, but that can take enormous space... and because this is intended as a 
 * programming language that is kind to beginners, we want a well-formed grammar to always
 * successfully compile.  So we're going to probably end up with a patchwork of partial solutions,
 * and beyond that guarantee that the traversal halts by simply capping the 
 * maximum number of steps the automaton can take.  Not ideal, but should cover
 * most reasonable use cases.
 */
export class NegationState extends State {

    constructor(
        public child: State | undefined,
        relevantTapes: Set<string> | undefined = undefined
    ) {
        super();
        this.relevantTapes = relevantTapes;
    }

    public compileAux(
        allTapes: TapeCollection, 
        symbolStack: CounterStack,
        compileLevel: number
    ): State {
        
        if (compileLevel <= 0) {
            return this;
        }
        var newChild = this.child;
        if (newChild != undefined) {
            newChild = newChild.compileAux(allTapes, symbolStack, compileLevel);
        }
        const newThis = new NegationState(newChild, this.relevantTapes);
        return new CompiledState(newThis, allTapes, symbolStack, compileLevel);
    }

    public get id(): string {
        if (this.child == undefined) {
            return "~()";
        }
        return `~(${this.child.id})`;
    }
    
    public collectVocab(tapes: Tape, stateStack: string[]): void {
        if (this.child == undefined) {
            return;
        }
        this.child.collectVocab(tapes, stateStack);
    }

    public getRelevantTapes(stateStack: CounterStack): Set<string> {
        if (this.relevantTapes == undefined) {
            if (this.child == undefined) {
                this.relevantTapes = new Set();
            } else {
                this.relevantTapes = this.child.getRelevantTapes(stateStack);
            }
            
            if (this.relevantTapes.size > 1) {
                throw new Error("We do not currently support negations of grammars that reference 2+ tapes");
            }
        }
        return this.relevantTapes;
    } 

    public randomize(): State {
        console.log("Warning, taking a randomization of a negation");
        return this;
    }

    public accepting(
        tape: Tape,
        random: boolean, 
        symbolStack: CounterStack
    ): boolean {
        if (this.child == undefined) {
            return true;
        }
        return !this.child.accepting(tape, random, symbolStack);
    }

    public *ndQuery(
        tape: Tape, 
        target: Token,
        random: boolean,
        symbolStack: CounterStack
    ): Gen<[Tape, Token, boolean, State]> {

        if (random) {
            console.log("Warning, querying a negation randomly");
        }

        var remainderTapeName = [...this.getRelevantTapes(symbolStack)][0];
        var remainderTape = tape.matchTape(remainderTapeName);
        if (remainderTape == undefined) {  // we don't care about this
            yield [tape, target, false, this];
            return;
        }

        if (this.child == undefined) {  // we've can't possibly match the child, so we're basically .* from now on
            yield [remainderTape, target, true, this]; 
            return;
        }

        var remainder = new Token(target.bits.clone());

        for (const [childTape, childText, childMatched, childNext] of 
                this.child.dQuery(tape, target, random, symbolStack)) {
            remainder = remainder.andNot(childText);
            yield [childTape, childText, childMatched, new NegationState(childNext, this.relevantTapes)];
        }

        yield [remainderTape, remainder, true, new NegationState(undefined, this.relevantTapes)];
    }
}

export class MatchState extends UnaryState {

    constructor(
        public child: State,
        public tapes: Set<string>,
        public buffers: {[key: string]: State} = {}
    ) {
        super();
    }


    public randomize(): State {
        console.log("Warning, taking a randomization of a match");
        return this;
    }

    public getRelevantTapes(stateStack: CounterStack): Set<string> {
        if (this.relevantTapes == undefined) {
            this.relevantTapes = new Set(this.tapes);
        }
        return this.relevantTapes;
    }

    public accepting(
        tape: Tape,
        random: boolean, 
        symbolStack: CounterStack
    ): boolean {
        for (const buffer of Object.values(this.buffers)) {
            if (!buffer.accepting(tape, random, symbolStack)) {
                return false;
            }
        }
        return this.child.accepting(tape, random, symbolStack);
    }

    public *ndQuery(
        tape: Tape, 
        target: Token,
        random: boolean,
        symbolStack: CounterStack
    ): Gen<[Tape, Token, boolean, State]> {

        for (const [c1tape, c1target, c1matched, c1next] of 
                    this.child.ndQuery(tape, target, random, symbolStack)) {
            
            // if c1tape is not one we care about, then yield right away
            if (!this.caresAbout(c1tape)) {
                yield [c1tape, c1target, c1matched, new MatchState(c1next, this.tapes, this.buffers)];
                continue;
            }
        
            if (!c1matched) { 
                yield [c1tape, c1target, c1matched, new MatchState(c1next, this.tapes, this.buffers)];
                continue;
            }
            
            // We need to match each character separately.
            for (const c of c1tape.fromToken(c1tape.tapeName, c1target)) {

                // cTarget: Token = c1tape.tokenize(c1tape.tapeName, c)[0]
                const cTarget: Token = c1tape.toToken(c1tape.tapeName, c);
                
                // STEP A: Are we matching something already buffered?
                const c1buffer = this.buffers[c1tape.tapeName]
                var c1bufMatched = false;
                if (c1buffer instanceof LiteralState) {

                    // that means we already matched a character on a different
                    // tape previously and now need to make sure it also matches
                    // this character on this tape
                    for (const [bufTape, bufTarget, bufMatched, bufNext] of 
                            c1buffer.ndQuery(c1tape, cTarget, random, symbolStack)) {
                        if (bufMatched) {
                            c1bufMatched = true;
                        }
                    }
                }

                // STEP B: If not, constrain my successors to match this on other tapes
                const newBuffers: {[key: string]: State} = {};
                //Object.assign(newBuffers, this.buffers);
                if (!c1bufMatched) {
                    for (const tapeName of this.tapes) {
                        const buffer = this.buffers[tapeName];
                        if (tapeName == c1tape.tapeName) {
                            // we're going to match it in a moment, don't need to match
                            // it again!
                            if (buffer != undefined) {
                                newBuffers[tapeName] = buffer;
                            }
                            continue;
                        }
                        var prevText: string = "";
                        if (buffer instanceof LiteralState) {
                            // that means we already found stuff we needed to match,
                            // so we add to that
                            prevText = buffer.getText();
                        }
                        newBuffers[tapeName] = new LiteralState(tapeName, prevText + c);
                    }
                }
                
                // STEP C: Match the buffer
                if (c1buffer instanceof LiteralState) {
                    // that means we already matched a character on a different tape
                    // previously and now need to make sure it also matches on this
                    // tape
                    for (const [bufTape, bufTarget, bufMatched, bufNext] of 
                            c1buffer.ndQuery(c1tape, cTarget, random, symbolStack)) {
                        // We expect at most one match here.
                        // We expect bufTape == c1Tape,
                        //   bufTape == c1Tape
                        //   bufTarget == cTarget
                        //   bufMatched == c1Matched
                        //assert(bufTape == c1tape, "tape does not match");
                        //assert(bufTarget == cTarget, "target does not match");
                        //assert(bufMatched == c1matched, "matched does not match");
                        newBuffers[c1tape.tapeName] = bufNext;

                        // the following comment is leftover from some pseudocode
                        // and we're not sure whether it is still relevant.  but just in case...

                        // oops, not yield for each buffer, get through all the
                        // buffers and only yield at the end if we got through them
                        // all.  so fix this ????
                        yield [c1tape, cTarget, c1matched, new MatchState(c1next, this.tapes, newBuffers)];
                    }
                } else {
                    // my predecessors have not previously required me to match
                    // anything in particular on this tape
                    yield [c1tape, cTarget, c1matched, new MatchState(c1next, this.tapes, newBuffers)]
                }
            }
        }
    }
}


/* CONVENIENCE FUNCTIONS FOR CONSTRUCTING GRAMMARS */

export function Lit(tape: string, text: string): State {
    return new LiteralState(tape, text);
}

export function Literalizer(tape: string) {
    return function(text: string) {
        return Lit(tape, text);
    }
}

export function Seq(...children: State[]): State {
    /*
    if (children.length == 0) {
        return Empty();
    }

    if (children.length == 1) {
        return children[0];
    }
    */
    return new ConcatState(children);
}

export function Uni(...children: State[]): State {
    /*
    if (children.length == 0) {
        return Empty();
    }

    if (children.length == 1) {
        return children[0];
    } */

    return new UnionState(children);
}

/*
export function Pri(...children: State[]): State {
    return new PriorityUnionState(children);
} */

export function Join(child1: State, child2: State): State {
    return new JoinState(child1, child2);
}

export function Filter(child1: State, child2: State): State {
    return new FilterState(child1, child2);
}

export function Not(child: State): State {
    return new NegationState(child);
}

export function Emb(symbolName: string, namespace: Namespace): State {
    return new EmbedState(symbolName, namespace);
}

// Reveal and Hide, as currently implemented, does name-mangling
// a la Python double-underscore variables.  Generally an 
// interface will supply a name for the show/hide and we'll use that
// to mangle the name, but if not, the Show()/Hide() function will use
// this variable to create a nonce name.

let REVEAL_INDEX = 0; 
export function Reveal(child: State, tape: string[], name: string = ""): State {
    if (name == "") {
        name = `HIDDEN${REVEAL_INDEX}`;
        REVEAL_INDEX++;
    }
    const desiredTapes: Set<string> = new Set(tape);
    var result: State = child;
    for (const tape of child.getRelevantTapes(new CounterStack())) {
        if (!desiredTapes.has(tape)) {
            result = new RenameState(result, tape, `__${name}_${tape}`)
        }
    }
    return result;
} 

let HIDE_INDEX = 0; 
export function Hide(child: State, tape: string, name: string = ""): State {

    if (name == "") {
        name = `HIDDEN${HIDE_INDEX}`;
        HIDE_INDEX++;
    }
    return new RenameState(child, tape, `__${name}_${tape}`);
}

export function Rename(child: State, fromTape: string, toTape: string): State {
    return new RenameState(child, fromTape, toTape);
}

export function Any(tape: string): State {
    return new AnyCharState(tape);
}

export function Rep(child: State, minReps=0, maxReps=Infinity) {
    return new RepetitionState(new TrivialState(), minReps, maxReps, 0, child);
}

export function Match(child: State, ...tapes: string[]): State {
    return new MatchState(child, new Set(tapes));
}

export function Dot(...tapes: string[]): State {
    return Seq(...tapes.map((t: string) => Any(t)));
}

export function MatchDot(...tapes: string[]): State {
    return Match(Dot(...tapes), ...tapes)
}


export function MatchDotRep(minReps: number = 0, maxReps: number = Infinity, ...tapes: string[]): State {
    return Match(Rep(Dot(...tapes), minReps, maxReps), ...tapes)
}

export function MatchDotStar(...tapes: string[]): State {
    return Match(Rep(Dot(...tapes)), ...tapes)
}
    
export function Empty(): State {
    return new TrivialState();
}

export function Maybe(child: State): State {
    return Uni(child, Empty());
}

/*
export function Intersection(child1: State, child2: State): State {
    return new IntersectionState(child1, child2);
}
*/

/*
export function Star(child: State) {
    return new StarState(child);
} */
