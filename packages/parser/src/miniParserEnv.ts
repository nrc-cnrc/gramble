import { Gen } from "./util";

/**
 * This is a simple parser-combinator engine that underlies various small parsing tasks, 
 * like parsing headers "optional subj/gloss" and "~(1SG|2SG)".
 * 
 * A parser is a function from a tokenized string (e.g. ["optional", "subj", "/", "gloss"])
 * to a generator of result tuples, where that tuple represents an output of type <T> and
 * the unparsed remnant left over after parsing that.  For example, if we had a parser that
 * looked for the token "subj" specficially, and gave it ["subj", "/", "gloss"], it would
 * yield some sort of result of type <T> (maybe some sort of Literal object) and a remnant of
 * ["/", "gloss"].
 * 
 * Parser combinators are higher-order functions that take component functions (like the hypothetical
 * "subj" function above) and combine them into more complex parsers.  E.g. Alternation(A, B) could 
 * mean "apply either of A or B", Sequence(A, B) could mean "apply B to the output of A", etc.
 * 
 * Each of the functions below takes either a set of strings (e.g. reserved words) and returns a 
 * parser function, or takes one or more parser functions and returns a parser function.  Most of them
 * also take a constructor argument, by which we can specify to the parser what to do with what it finds.
 * For example, say our parser parses strings into Expressions, and when we find the strings "red", "orange"
 * etc. we want to parse them into ColorExpressions.  The parser MPReserved will do this:
 * 
 * const COLOR = MPReserved<Expression>(
 *      new Set(["red", "orange", "yellow", "green", "blue", "purple"]),
 *      (s) => new ColorExpression(s)
 * )
 * 
 * What if we want compound colors like "red-orange"?  The parser MPSequence takes a list of existing
 * parsers and (for convenience) literal strings, and associates them with slots in a constructor function.
 * 
 * const COMPOUND_COLOR = MPSequence<Expression>(
 *      [ COLOR, "-", COLOR ],
 *      (c1, c2) => new CompoundColorExpression(c1, c2)
 * )
 * 
 * The constructor here has to have exactly as many arguments as non-string elements of the array; in this
 * case there are two non-string arguments (the two colors) and thus we need a function with two arguments.
 * 
 * For grammars that recurse (which is most of them), we also need a mechanism to be able to refer to 
 * a parser before it's constructed.  There are various ways to do this; here we use "delaying", which
 * is just a parser that takes a trivial function () => Parser.  E.g., if you need to refer to COMPOUND_COLOR
 * earlier than COMPOUND_COLOR is actually defined, you can just do
 * 
 * const X = MPDelay<Expression>(() => COMPOUND_COLOR)
 *
 * NB: I don't think you need delaying if you define everything as functions rather than variables; 
 * JavaScript function hoisting should take care of it.
 */

/**
 * Prepend any special JS regex characters with backslashes
 */
function escapeRegExp(s: string): string {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Remove single backslashes (e.g. convert \x to x, and \\ to \)
 */
function unescape(s: string): string {
    return s.replace(/(?:\\(.))/g, '$1');
}

/**
 * Used to filter out empty & undefined strings
 */
function stringIsNontrivial(s: string): boolean {
    return s !== undefined && s !== '';
}

/**
 * Construct the appropriate regex for splitting Gramble regexes
 */
function constructTokenizer(reserved: Set<string>): RegExp {
    return new RegExp("\\s+|(?<!\\\\)(" + 
        [...reserved].map(escapeRegExp).join("|") + 
    ")");
}

export class MiniParseEnv {

    protected tokenizer: RegExp;

    constructor(
        public reserved: Set<string>
    ) { 
        this.tokenizer = constructTokenizer(reserved);
    }

    public tokenize(text: string): string[] {
        return text.split(this.tokenizer)
                   .filter(stringIsNontrivial)
                   .map(unescape);
    }
}

export type MPParser<T> = (input: string[], env: MiniParseEnv) => Gen<[T, string[]]>

/**
 * Delay the evaluation of a parser X to allow reference to a parser before it's defined (e.g. for
 * grammars that recurse).  You probably don't need this if your parsers are defined "function X(...){...}",
 * because hoisting should take care of that, but if they're defined as variables/constants like 
 * "const X = ...", you need this to allow the expression of recursive grammars.
 */
export function MPDelay<T>(child: () => MPParser<T>): MPParser<T> {
    return function*(input: string[], env: MiniParseEnv) {
        yield* child()(input, env);
    }
}

export function MPEnv<T>(
    child: MPParser<T>,
    env: MiniParseEnv
): MPParser<T> {
    return function*(input: string[], oldEnv: MiniParseEnv) {
        yield* child(input, env);
    }
}

/**
 * Recognizes any word in the "reserved" string set.
 */
export function MPReserved<T>(
    constr: (s: string) => T,
    caseSensitive: boolean = false    
): MPParser<T> {
    return function*(input: string[], env: MiniParseEnv) {
        if (input.length == 0) {
            return;
        }
        const firstToken = caseSensitive ? input[0] 
                                         : input[0].toLowerCase();
        if (!env.reserved.has(firstToken)) {
            return;
        }
        yield [constr(input[0]), input.slice(1)];
    }
}

/**
 * Recognizes any word that is NOT in the "reserved" string set.
 */
export function MPUnreserved<T>(
    constr: (s: string) => T,
    caseSensitive: boolean = false    
): MPParser<T> {
    return function*(input: string[], env: MiniParseEnv) {
        if (input.length == 0) {
            return;
        }
        const firstToken = caseSensitive ? input[0] 
                                         : input[0].toLowerCase();
        if (env.reserved.has(firstToken)) {
            return;
        }
        yield [constr(input[0]), input.slice(1)];
    }
}

/**
 * Recognizes a string that begins with commentStarter (e.g. "%" in a header)
 */
export function MPComment<T>(commentStarter: string, constr: (s: string) => T): MPParser<T> {
    return function*(input: string[]) {
        if (input.length == 0 || input[0] != commentStarter) {
            return;
        }
        yield [constr(input[0]), []];
    }
}

/**
 * Recognizes a sequence of grammar elements and (for convenience) literal strings.  The function constr
 * should have as many elements as the non-strings in your array.  (That is to say, it will pass all
 * non-strings it finds to the constructor, and ignore any literal strings.)
 */
export function MPSequence<T>(
    children: (string | MPParser<T>)[], 
    constr: (...children: T[]) => T,
    caseSensitive: boolean = false    
): MPParser<T> {
    return function*(input: string[], env: MiniParseEnv) {

        let results: [T[], string[]][] = [[[], input]];

        for (const child of children) {
            let newResults: [T[], string[]][] = [];
            for (const [existingOutputs, existingRemnant] of results) {
                if (typeof child == "string") {
                    if (existingRemnant.length == 0) {
                        continue;
                    }
                    const remnantTestForm = caseSensitive ? existingRemnant[0] 
                                                          : existingRemnant[0].toLowerCase();
                    const childTestForm = caseSensitive ? child 
                                                        : child.toLowerCase();

                    if (remnantTestForm == childTestForm) {
                        newResults.push([existingOutputs, existingRemnant.slice(1)]);
                    }
                    continue;
                }
    
                for (const [output2, remnant2] of child(existingRemnant, env)) {
                    const newOutput: T[] = [...existingOutputs, output2];
                    newResults.push([newOutput, remnant2]);
                }
            }
            results = newResults;
        }  
        for (const [output, remnant] of results) {
            yield [constr(...output), remnant];
        }
    }
}

export function MPRepetition<T>(
    child: MPParser<T>,
    constr: (...children: T[]) => T,
    minReps: number = 0,
    maxReps: number = Infinity
): MPParser<T> {
    return function*(input: string[], env: MiniParseEnv) {
        let results: [T[], string[]][] = [[[], input]];
        for (let reps = 0; reps <= maxReps && results.length > 0; reps++) {
            let newResults: [T[], string[]][] = [];
            for (const [existingOutputs, existingRemnant] of results) {
                if (reps >= minReps) {
                    yield [constr(...existingOutputs), existingRemnant];
                }
                for (const [output2, remnant2] of child(existingRemnant, env)) {
                    const newOutput: T[] = [...existingOutputs, output2];
                    newResults.push([newOutput, remnant2]);
                }
            }
            results = newResults;
        }  
    }
}

/**
 * The result of MPAlternation(A, B)(X) is just the union of the results of applying A(X) and B(X).
 */
export function MPAlt<T>(...children: MPParser<T>[]): MPParser<T> {
    return function*(input: string[], env: MiniParseEnv) {
        for (const child of children) {
            yield* child(input, env);
        }
    }
}

/**
 * A convenience function to tokenize, parse, throw out incomplete results, and fail when the 
 * number of results isn't exactly equal to one.
 * 
 * If you're parsing a grammar that's genuinely ambiguous (can have multiple valid parses
 * for the same string) then you don't want to use this function.  All of our mini-grammars
 * are deterministic so it really is an error if we get multiple parses. 
 */
export function miniParse<T>(
    env: MiniParseEnv,
    grammar: MPParser<T>,
    text: string
): T[] {
    const pieces = env.tokenize(text);
    let results = [... grammar(pieces, env)];
    // result is a list of [header, remaining_tokens] pairs.  
    // we only want results where there are no remaining tokens.
    return results.filter(([t, r]) => r.length == 0)
                      .map(([t, r]) => t);
}