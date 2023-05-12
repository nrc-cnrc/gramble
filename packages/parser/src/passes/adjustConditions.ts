import { PassEnv } from "../passes";
import { 
    AlternationGrammar, ContainsGrammar, 
    DotGrammar, EndsGrammar, Grammar,
    GrammarPass, GrammarResult,
    IntersectionGrammar, LocatorGrammar, 
    NegationGrammar, RepeatGrammar, 
    SequenceGrammar, StartsGrammar, 
    RenameGrammar
} from "../grammars";
import { HIDDEN_PREFIX } from "../util";

/**
 * There's a semantic gotcha in starts/ends/contains that could throw programmers for a 
 * loop: If we filter a string to say that it starts with not(X), then the filter will
 * let everything through, because the empty string is a member of not(X), and every string
 * starts with the empty string.
 * 
 * What the programmer really means to say here isn't "it starts with not X" but "it doesn't
 * start with X".  (Note the scope difference.)  This isn't the scope that the actual program 
 * has, though; the grammar structure we get from the tabular syntax tree has the structure
 * starts(not(X)).  So we have to switch their scope, and this pass does that.
 * 
 * Note, however, that not every arbitrary regex that the programmer might put under a 
 * starts filter is going to get a reasonable result when this operation is performed.  
 * (For example, when they use a sequence where the first element is nullable and the second
 * is negated; the result of this is not necessarily going to be what they thought it would.
 * The trouble is that, at this point in the calculation, we don't know what's nullable; 
 * that's only something we learn when executing the resulting grammar.)  When the programmer
 * wants something unusual like this, it's better for the programmer to write the regex 
 * they really want the string to match (i.e. putting the .* exactly where they intend it to
 * be) and wrap that in an equals rather than using starts/ends/contains.
 */
export class AdjustConditions extends GrammarPass {
    
    public get desc(): string {
        return "Adjusting condition scope";
    }

    public transform(g: Grammar, env: PassEnv): GrammarResult {
        
        switch (g.constructor) {
            case StartsGrammar:
                return this.transformStarts(g as StartsGrammar, env);
            case EndsGrammar:
                return this.transformEnds(g as EndsGrammar, env);
            case ContainsGrammar:
                return this.transformContains(g as ContainsGrammar, env);
            default:
                return g.mapChildren(this, env);
        }
        
    }

    public transformStarts(g: StartsGrammar, env: PassEnv): GrammarResult {

        if (g.child instanceof NegationGrammar) {
            // this(not(x) -> not(this(x))
            const newCond = new StartsGrammar(g.child.child, g.tapes);
            const newNegation = new NegationGrammar(newCond);
            return newNegation.mapChildren(this, env);
        }

        if (g.child instanceof SequenceGrammar && g.child.children.length > 0) {
            // this(x+y) -> x+this(y)
            const newChildren = [...g.child.children]; // clone the children
            const newLastChild = new StartsGrammar(
                newChildren[newChildren.length-1], g.tapes);
            newChildren[newChildren.length-1] = newLastChild;
            const newSequence = new SequenceGrammar(newChildren);
            return newSequence.mapChildren(this, env);
        }
        
        if (g.child instanceof AlternationGrammar) {
            // this(x|y) -> this(x)|this(y)
            const newChildren = g.child.children.map(c => new StartsGrammar(c, g.tapes));
            const newAlternation = new AlternationGrammar(newChildren);
            return newAlternation.mapChildren(this, env);
        }

        if (g.child instanceof IntersectionGrammar) {
            // this(x&y) -> this(x)&this(y)
            const newCond1 = new StartsGrammar(g.child.child1, g.tapes);
            const newCond2 = new StartsGrammar(g.child.child2, g.tapes);
            const newIntersection = new IntersectionGrammar(newCond1, newCond2);
            return newIntersection.mapChildren(this, env);
        }

        if (g.child instanceof LocatorGrammar) {
            const newCond = new StartsGrammar(g.child.child, g.tapes);
            const newLocation = new LocatorGrammar(g.child.position, newCond);
            return newLocation.mapChildren(this, env);
        }

        if (g.child instanceof RenameGrammar) {
            const newCond = new StartsGrammar(g.child.child, g.child.child.tapes);
            const newRename = new RenameGrammar(newCond, g.child.fromTape, g.child.toTape);
            return newRename.mapChildren(this, env);
        }

        // construct the condition
        const newG = this.transform(g.child, env);
        return newG.bind(c => {
            const dotStars: Grammar[] = [];
            for (const tape of g.tapes) {
                if (tape.startsWith(HIDDEN_PREFIX)) continue;
                const dot = new DotGrammar(tape);
                const dotStar = new RepeatGrammar(dot);
                dotStars.push(dotStar);
            }
            return new SequenceGrammar([c, ...dotStars ]);
        });
    }
    
    public transformEnds(g: EndsGrammar, env: PassEnv): GrammarResult {

        if (g.child instanceof NegationGrammar) {
            // this(not(x) -> not(this(x))
            const newCond = new EndsGrammar(g.child.child, g.tapes);
            const newNegation = new NegationGrammar(newCond);
            return newNegation.mapChildren(this, env);
        }

        if (g.child instanceof SequenceGrammar && g.child.children.length > 0) {
            // this(x+y) -> this(x)+y
            const newChildren = [...g.child.children]; // clone the children
            const newFirstChild = new EndsGrammar(newChildren[0], g.tapes);
            newChildren[0] = newFirstChild;
            const newSequence = new SequenceGrammar(newChildren);
            return newSequence.mapChildren(this, env);
        }
        
        if (g.child instanceof AlternationGrammar) {
            // this(x|y) -> this(x)|this(y)
            const newChildren = g.child.children.map(c => new EndsGrammar(c, g.tapes));
            const newAlternation = new AlternationGrammar(newChildren);
            return newAlternation.mapChildren(this, env);
        }

        if (g.child instanceof IntersectionGrammar) {
            // this(x&y) -> this(x)&this(y)
            const newCond1 = new EndsGrammar(g.child.child1, g.tapes);
            const newCond2 = new EndsGrammar(g.child.child2, g.tapes);
            const newIntersection = new IntersectionGrammar(newCond1, newCond2);
            return newIntersection.mapChildren(this, env);
        }
        
        if (g.child instanceof LocatorGrammar) {
            const newCond = new EndsGrammar(g.child.child, g.tapes);
            const newLocation = new LocatorGrammar(g.child.position, newCond);
            return newLocation.mapChildren(this, env);
        }
        
        if (g.child instanceof RenameGrammar) {
            const newCond = new EndsGrammar(g.child.child, g.child.child.tapes);
            const newRename = new RenameGrammar(newCond, g.child.fromTape, g.child.toTape);
            return newRename.mapChildren(this, env);
        }

        // create the condition
        const newG = this.transform(g.child, env);
        return newG.bind(c => {
            const dotStars: Grammar[] = [];
            for (const tape of g.tapes) {
                if (tape.startsWith(HIDDEN_PREFIX)) continue;
                const dot = new DotGrammar(tape);
                const dotStar = new RepeatGrammar(dot);
                dotStars.push(dotStar);
            }
            return new SequenceGrammar([ ...dotStars, c ]);
        });
    }
    
    public transformContains(g: ContainsGrammar, env: PassEnv): GrammarResult {

        if (g.child instanceof NegationGrammar) {
            // this(not(x) -> not(this(x))
            const newCond = new ContainsGrammar(g.child.child, g.tapes);
            const newNegation = new NegationGrammar(newCond);
            return newNegation.mapChildren(this, env);
        }

        if (g.child instanceof SequenceGrammar && g.child.children.length > 0) {
            // this(x+y) -> x+this(y)
            const newChildren = [...g.child.children]; // clone the children
            const newFirstChild = new EndsGrammar(newChildren[0], g.tapes);
            newChildren[0] = newFirstChild;
            const newLastChild = new StartsGrammar(newChildren[newChildren.length-1], g.tapes);
            newChildren[newChildren.length-1] = newLastChild;
            const newSequence = new SequenceGrammar(newChildren);
            return newSequence.mapChildren(this, env);
        }
        
        if (g.child instanceof AlternationGrammar) {
            // this(x|y) -> this(x)|this(y)
            const newChildren = g.child.children.map(c => new ContainsGrammar(c, g.tapes));
            const newAlternation = new AlternationGrammar(newChildren);
            return newAlternation.mapChildren(this, env);
        }

        if (g.child instanceof IntersectionGrammar) {
            // this(x&y) -> this(x)&this(y)
            const newCond1 = new ContainsGrammar(g.child.child1, g.tapes);
            const newCond2 = new ContainsGrammar(g.child.child2, g.tapes);
            const newIntersection = new IntersectionGrammar(newCond1, newCond2);
            return newIntersection.mapChildren(this, env);
        }

        if (g.child instanceof LocatorGrammar) {
            const newCond = new ContainsGrammar(g.child.child, g.tapes);
            const newLocation = new LocatorGrammar(g.child.position, newCond);
            return newLocation.mapChildren(this, env);
        }
        
        if (g.child instanceof RenameGrammar) {
            const newCond = new ContainsGrammar(g.child.child, g.child.child.tapes);
            const newRename = new RenameGrammar(newCond, g.child.fromTape, g.child.toTape);
            return newRename.mapChildren(this, env);
        }

        // create the condition
        const newG = this.transform(g.child, env);
        return newG.bind(c => {
            const dotStars: Grammar[] = [];
            for (const tape of g.tapes) {
                if (tape.startsWith(HIDDEN_PREFIX)) continue;
                const dot = new DotGrammar(tape);
                const dotStar = new RepeatGrammar(dot);
                dotStars.push(dotStar);
            }
            return new SequenceGrammar([...dotStars, c, ...dotStars]);
        });
    }
}
