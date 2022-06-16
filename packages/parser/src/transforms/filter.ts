import { 
    AlternationGrammar, ContainsGrammar, CounterStack, 
    DotGrammar, EndsGrammar, Grammar,
    IntersectionGrammar, NegationGrammar, 
    NsGrammar, RepeatGrammar, SequenceGrammar, StartsGrammar
} from "../grammars";

import { IdentityTransform } from "./transforms";

/**
 * There's a semantic gotcha in starts/ends/contains that could throw programmers for a 
 * loop: If we filter a string to say that it starts with not(X), then the filter will
 * let everything through, because the empty string is a member of not(X), and every string
 * starts with the empty string.
 * 
 * What the programmer really means to say here isn't "it starts with not X" but "it doesn't
 * start with X".  (Note the scope difference.)  This isn't the scope that the actually program 
 * has, though; the grammar structure we get from the tabular syntax tree has the structure
 * starts(not(X)).  So we have to switch their scope, and this transform does that.
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
export class FilterTransform extends IdentityTransform<void> {
    
    public get desc(): string {
        return "Constructing filters";
    }

    public transformStarts(g: StartsGrammar, ns: NsGrammar, args: void): Grammar {

        if (g.child instanceof NegationGrammar) {
            // this(not(x) -> not(this(x))
            const newFilter = new StartsGrammar(g.cell, g.child.child, g.tapes);
            const newNegation = new NegationGrammar(g.child.cell, newFilter, g.child.maxReps);
            return newNegation.accept(this, ns, args);
        }

        if (g.child instanceof SequenceGrammar && g.child.children.length > 0) {
            // this(x+y) -> x+this(y)
            const newChildren = [...g.child.children]; // clone the children
            const newLastChild = new StartsGrammar(
                g.cell, newChildren[newChildren.length-1], g.tapes);
            newChildren[newChildren.length-1] = newLastChild;
            const newSequence = new SequenceGrammar(g.cell, newChildren);
            return newSequence.accept(this, ns, args);
        }
        
        if (g.child instanceof AlternationGrammar) {
            // this(x|y) -> this(x)|this(y)
            const newChildren = g.child.children.map(c => new StartsGrammar(g.cell, c, g.tapes));
            const newAlternation = new AlternationGrammar(g.cell, newChildren);
            return newAlternation.accept(this, ns, args);
        }

        if (g.child instanceof IntersectionGrammar) {
            // this(x&y) -> this(x)&this(y)
            const newFilter1 = new StartsGrammar(g.cell, g.child.child1, g.tapes);
            const newFilter2 = new StartsGrammar(g.cell, g.child.child2, g.tapes);
            const newIntersection = new IntersectionGrammar(g.child.cell, newFilter1, newFilter2);
            return newIntersection.accept(this, ns, args);
        }

        // construct the filter
        const newChild = g.child.accept(this, ns, args);
        const dotStars: Grammar[] = [];
        for (const tape of g.tapes) {
            const dot = new DotGrammar(g.cell, tape);
            const dotStar = new RepeatGrammar(g.cell, dot);
            dotStars.push(dotStar);
        }
        return new SequenceGrammar(g.cell, [ newChild, ...dotStars ]);
    }
    
    public transformEnds(g: StartsGrammar, ns: NsGrammar, args: void): Grammar {

        if (g.child instanceof NegationGrammar) {
            // this(not(x) -> not(this(x))
            const newFilter = new EndsGrammar(g.cell, g.child.child, g.tapes);
            const newNegation = new NegationGrammar(g.child.cell, newFilter, g.child.maxReps);
            return newNegation.accept(this, ns, args);
        }

        if (g.child instanceof SequenceGrammar && g.child.children.length > 0) {
            // this(x+y) -> this(x)+y
            const newChildren = [...g.child.children]; // clone the children
            const newFirstChild = new EndsGrammar(g.cell, newChildren[0], g.tapes);
            newChildren[0] = newFirstChild;
            const newSequence = new SequenceGrammar(g.cell, newChildren);
            return newSequence.accept(this, ns, args);
        }
        
        if (g.child instanceof AlternationGrammar) {
            // this(x|y) -> this(x)|this(y)
            const newChildren = g.child.children.map(c => new EndsGrammar(g.cell, c, g.tapes));
            const newAlternation = new AlternationGrammar(g.cell, newChildren);
            return newAlternation.accept(this, ns, args);
        }

        if (g.child instanceof IntersectionGrammar) {
            // this(x&y) -> this(x)&this(y)
            const newFilter1 = new EndsGrammar(g.cell, g.child.child1, g.tapes);
            const newFilter2 = new EndsGrammar(g.cell, g.child.child2, g.tapes);
            const newIntersection = new IntersectionGrammar(g.child.cell, newFilter1, newFilter2);
            return newIntersection.accept(this, ns, args);
        }

        // create the filter
        const newChild = g.child.accept(this, ns, args);
        const dotStars: Grammar[] = [];
        for (const tape of g.tapes) {
            const dot = new DotGrammar(g.cell, tape);
            const dotStar = new RepeatGrammar(g.cell, dot);
            dotStars.push(dotStar);
        }
        return new SequenceGrammar(g.cell, [ ...dotStars, newChild ]);
    }
    
    public transformContains(g: ContainsGrammar, ns: NsGrammar, args: void): Grammar {

        if (g.child instanceof NegationGrammar) {
            // this(not(x) -> not(this(x))
            const newFilter = new ContainsGrammar(g.cell, g.child.child, g.tapes);
            const newNegation = new NegationGrammar(g.child.cell, newFilter, g.child.maxReps);
            return newNegation.accept(this, ns, args);
        }

        if (g.child instanceof SequenceGrammar && g.child.children.length > 0) {
            // this(x+y) -> x+this(y)
            const newChildren = [...g.child.children]; // clone the children
            const newFirstChild = new EndsGrammar(g.cell, newChildren[0], g.tapes);
            newChildren[0] = newFirstChild;
            const newLastChild = new StartsGrammar(g.cell, newChildren[newChildren.length-1], g.tapes);
            newChildren[newChildren.length-1] = newLastChild;
            const newSequence = new SequenceGrammar(g.cell, newChildren);
            return newSequence.accept(this, ns, args);
        }
        
        if (g.child instanceof AlternationGrammar) {
            // this(x|y) -> this(x)|this(y)
            const newChildren = g.child.children.map(c => new ContainsGrammar(g.cell, c, g.tapes));
            const newAlternation = new AlternationGrammar(g.cell, newChildren);
            return newAlternation.accept(this, ns, args);
        }

        if (g.child instanceof IntersectionGrammar) {
            // this(x&y) -> this(x)&this(y)
            const newFilter1 = new ContainsGrammar(g.cell, g.child.child1, g.tapes);
            const newFilter2 = new ContainsGrammar(g.cell, g.child.child2, g.tapes);
            const newIntersection = new IntersectionGrammar(g.child.cell, newFilter1, newFilter2);
            return newIntersection.accept(this, ns, args);
        }

        // create the filter
        const newChild = g.child.accept(this, ns, args);
        const dotStars: Grammar[] = [];
        for (const tape of g.tapes) {
            const dot = new DotGrammar(g.cell, tape);
            const dotStar = new RepeatGrammar(g.cell, dot);
            dotStars.push(dotStar);
        }
        return new SequenceGrammar(g.cell, [ ...dotStars, newChild, ...dotStars ]);
    }
}

