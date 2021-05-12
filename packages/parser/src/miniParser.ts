import { Gen } from "./util";

export type MPParser<T> = (input: string[]) => Gen<[T, string[]]>

export function MPDelay<T>(child: () => MPParser<T>): MPParser<T> {
    return function*(input: string[]) {
        yield* child()(input);
    }
}

export function MPUnreserved<T>(
    reserved: Set<string>, 
    constr: (s: string) => T,
    caseSensitive: boolean = false    
): MPParser<T> {
    return function*(input: string[]) {
        
        const firstToken = caseSensitive ? input[0] 
                                         : input[0].toLowerCase();
        if (input.length == 0 || reserved.has(firstToken)) {
            return;
        }
        yield [constr(input[0]), input.slice(1)];
    }
}


export function MPComment<T>(commentStarter: string, constr: (s: string) => T): MPParser<T> {
    return function*(input: string[]) {
        if (input.length == 0 || input[0] != commentStarter) {
            return;
        }
        yield [constr(input[0]), []];
    }
}

export function MPSequence<T>(children: 
    (string | MPParser<T>)[], 
    constr: (...children: T[]) => T,
    caseSensitive: boolean = false    
): MPParser<T> {
    return function*(input: string[]) {

        var results: [T[], string[]][] = [[[], input]];

        for (const child of children) {
            var newResults: [T[], string[]][] = [];
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
    
                for (const [output2, remnant2] of child(existingRemnant)) {
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

export function MPAlternation<T>(...children: MPParser<T>[]): MPParser<T> {
    return function*(input: string[]) {
        for (const child of children) {
            yield* child(input);
        }
    }
}

export function miniParse<T>(
    tokenizer: (text: string) => string[],
    grammar: MPParser<T>,
    text: string
): T {
    const pieces = tokenizer(text);
    var result = [... grammar(pieces)];
    // result is a list of [header, remaining_tokens] pairs.  
    // we only want results where there are no remaining tokens.
    result = result.filter(([t, r]) => r.length == 0);

    if (result.length == 0) {
        // if there are no results, the programmer made a syntax error
        throw new Error(`Cannot parse: ${text}`);
    }
    if (result.length > 1) {
        throw new Error(`Ambiguous, cannot uniquely parse: ${text}.`);
    }
    return result[0][0];
}