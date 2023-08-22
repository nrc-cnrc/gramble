import { 
    AlternationGrammar, CollectionGrammar, 
    ContainsGrammar, CorrespondGrammar, 
    CountGrammar, CursorGrammar, DotGrammar, 
    EmbedGrammar, EndsGrammar, EpsilonGrammar, Grammar, 
    HideGrammar, IntersectionGrammar, 
    JoinGrammar, LiteralGrammar, 
    MatchGrammar, NegationGrammar, 
    NullGrammar, PreTapeGrammar, 
    RenameGrammar, RepeatGrammar, 
    ReplaceBlockGrammar, ReplaceGrammar, 
    SequenceGrammar, ShortGrammar, 
    StartsGrammar 
} from "./grammars";
import { Dict, StringDict } from "./util";

/**
  * Replace implements general phonological replacement rules.
  * 
  * NOTE: The defaults for this convenience function differ from those 
  * in the constructor of ReplaceGrammar.  These are the defaults appropriate
  * for testing, whereas the defaults in ReplaceGrammar are appropriate for
  * the purposes of converting tabular syntax into grammars.
  * 
  * fromGrammar: input (target) Grammar (on fromTape)
  * toGrammar: output (change) Grammar (on one or more toTapes)
  * preContext: context to match before the target fromGrammar (on fromTape)
  * postContext: context to match after the target fromGrammar (on fromTape)
  * otherContext: context to match on other tapes (other than fromTape & toTapes)
  * beginsWith: set to True to match at the start of fromTape
  * endsWith: set to True to match at the end of fromTape
  * minReps: minimum number of times the replace rule is applied; normally 0
  * maxReps: maximum number of times the replace rule is applied
*/
export function Replace(
    fromGrammar: Grammar, 
    toGrammar: Grammar,
    preContext: Grammar = Epsilon(),
    postContext: Grammar = Epsilon(),
    otherContext: Grammar = Epsilon(),
    beginsWith: boolean = false, endsWith: boolean = false,
    minReps: number = 0, maxReps: number = Infinity,
    hiddenTapeName: string = ""
): ReplaceGrammar {
    return new ReplaceGrammar(fromGrammar, toGrammar, 
        preContext, postContext, otherContext, beginsWith, endsWith, 
        minReps, maxReps, hiddenTapeName, false);
}

export function OptionalReplace(
    fromGrammar: Grammar, 
    toGrammar: Grammar,
    preContext: Grammar = Epsilon(), 
    postContext: Grammar = Epsilon(),
    otherContext: Grammar = Epsilon(),
    beginsWith: boolean = false, endsWith: boolean = false,
    minReps: number = 0, maxReps: number = Infinity,
    hiddenTapeName: string = ""
): ReplaceGrammar {
    return new ReplaceGrammar(fromGrammar, toGrammar, 
        preContext, postContext, otherContext, beginsWith, endsWith, 
        minReps, maxReps, hiddenTapeName, true);
}

export function ReplaceBlock(
    inputTape: string,
    child: Grammar,
    rules: ReplaceGrammar[]
): ReplaceBlockGrammar {
    return new ReplaceBlockGrammar(inputTape, child, rules);
}

export function Correspond(
    tape1: string,
    tape2: string,
    child: Grammar
): CorrespondGrammar {
    return new CorrespondGrammar(child, tape1, tape2);
}

export function Query(
    query: StringDict[] | StringDict = {},
): Grammar {
    if (! Array.isArray(query)) {
        query = [query];
    }
    let queries: SequenceGrammar[] = [];
    for (let q of query) {
        const queryLiterals = Object.entries(q).map(([key, value]) => {
            key = key.normalize("NFD"); 
            value = value.normalize("NFD");
            return new LiteralGrammar(key, value);
        });
        queries.push(new SequenceGrammar(queryLiterals));
    }
    if (queries.length == 1) {
        return queries[0];
    }
    return new AlternationGrammar(queries);
}

export function PreTape(
    fromTape: string, 
    toTape: string, 
    child: Grammar
): Grammar {
    return new PreTapeGrammar(fromTape, toTape, child);
}

export function Epsilon(): EpsilonGrammar {
    return new EpsilonGrammar();
}

export function Seq(...children: Grammar[]): SequenceGrammar {
    return new SequenceGrammar(children);
}

export function Uni(...children: Grammar[]): AlternationGrammar {
    return new AlternationGrammar(children);
}

export function Optional(child: Grammar): AlternationGrammar {
    return Uni(child, Epsilon());
}

export function CharSet(tape: string, chars: string[]): Grammar {
    return new AlternationGrammar(chars.map(c => Lit(tape, c)));
}

export function Lit(tape: string, text: string): LiteralGrammar {
    return new LiteralGrammar(tape, text);
}

export function Any(tape: string): DotGrammar {
    return new DotGrammar(tape);
}

export function Intersect(child1: Grammar, child2: Grammar): IntersectionGrammar {
    return new IntersectionGrammar(child1, child2);
}

export function Join(child1: Grammar, child2: Grammar): JoinGrammar {
    return new JoinGrammar(child1, child2);
}

export function Short(child: Grammar): ShortGrammar {
    return new ShortGrammar(child);
}

export function Starts(child1: Grammar, child2: Grammar): JoinGrammar {
    const filter = new StartsGrammar(child2);
    return new JoinGrammar(child1, filter);
}

export function Ends(child1: Grammar, child2: Grammar): JoinGrammar {
    const filter = new EndsGrammar(child2);
    return new JoinGrammar(child1, filter);
}

export function Contains(child1: Grammar, child2: Grammar): JoinGrammar {
    const filter = new ContainsGrammar(child2);
    return new JoinGrammar(child1, filter);
}

export function Rep(
    child: Grammar, 
    minReps: number = 0, 
    maxReps: number = Infinity
) {
    return new RepeatGrammar(child, minReps, maxReps);
}

export function Null(): NullGrammar {
    return new NullGrammar();
}

export function Embed(name: string): EmbedGrammar {
    return new EmbedGrammar(name);
}

export function Dot(...tapes: string[]): SequenceGrammar {
    return Seq(...tapes.map(t => Any(t)));
}

export function Match(state:Grammar, fromTape: string, ...toTapes: string[]): Grammar {
    let result = state;
    for (const tape of toTapes) {
        result = new MatchGrammar(result, fromTape, tape);
    }
    return result;
}

export function Rename(child: Grammar, fromTape: string, toTape: string): RenameGrammar {
    return new RenameGrammar(child, fromTape, toTape);
}

export function Not(child: Grammar): NegationGrammar {
    return new NegationGrammar(child);
}

export function Collection(
    symbols: Dict<Grammar> = {}
): CollectionGrammar {
    const result = new CollectionGrammar();
    for (const [symbolName, component] of Object.entries(symbols)) {
        result.symbols[symbolName] = component;
    }
    return result;
}

export function Hide(child: Grammar, tape: string, toTape: string = ""): HideGrammar {
    return new HideGrammar(child, tape, toTape);
}

export function Vocab(arg1: string | StringDict, arg2: string = ""): Grammar {
    if (typeof arg1 == 'string') {
        return Rep(Lit(arg1, arg2), 0, 0)
    } else {
        let vocabGrammars: LiteralGrammar[] = [];
        for (const tape in arg1 as StringDict) {
            vocabGrammars.push(Lit(tape, arg1[tape]));
        }
        return Rep(Seq(...vocabGrammars), 0, 0);
    }
}

export function Count(
    maxChars: Dict<number>,
    child: Grammar,
    countEpsilon: boolean = false,
    errorOnCountExceeded: boolean = false
): Grammar {
    let result = child;
    for (const [tapeName, max] of Object.entries(maxChars)) {
        result = new CountGrammar(result, tapeName, max,
                                  countEpsilon, errorOnCountExceeded);
    }
    return result;
}

export function Cursor(tape: string | string[], child: Grammar): Grammar {
    let result = child;
    if (!Array.isArray(tape)) tape = [tape];
    for (let i = tape.length-1; i >= 0; i--) {
        result = new CursorGrammar(tape[i], result);   
    }
    return result;
}