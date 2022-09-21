import { 
    AlternationGrammar, ContainsGrammar, 
    DotGrammar, EndsGrammar, Grammar,
    GrammarResult,
    IntersectionGrammar, LocatorGrammar, NegationGrammar, 
    RepeatGrammar, SequenceGrammar, StartsGrammar
} from "../grammars";

import { IdentityTransform } from "./transforms";

/**
 * There's a semantic gotcha in starts/ends/contains that could throw programmers for a 
 * loop: If we filter a string to say that it starts with not(X), then the filter will
 * let everything through, because the empty string is a member of not(X), and every string
 * starts with the empty string.
 * 
 * What the programmer really means to say here isn't "it starts with not X" but "it doesn't
 * start with X".  (Note the scope difference.)  This isn't the scope that the actual program 
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
export class FilterTransform extends IdentityTransform {
    
    public get desc(): string {
        return "Constructing filters";
    }

    public transformStarts(g: StartsGrammar): GrammarResult {

        if (g.child instanceof NegationGrammar) {
            // this(not(x) -> not(this(x))
            const newFilter = new StartsGrammar(g.child.child, g.tapes);
            const newNegation = new NegationGrammar(newFilter, g.child.maxReps);
            return newNegation.accept(this);
        }

        if (g.child instanceof SequenceGrammar && g.child.children.length > 0) {
            // this(x+y) -> x+this(y)
            const newChildren = [...g.child.children]; // clone the children
            const newLastChild = new StartsGrammar(
                newChildren[newChildren.length-1], g.tapes);
            newChildren[newChildren.length-1] = newLastChild;
            const newSequence = new SequenceGrammar(newChildren);
            return newSequence.accept(this);
        }
        
        if (g.child instanceof AlternationGrammar) {
            // this(x|y) -> this(x)|this(y)
            const newChildren = g.child.children.map(c => new StartsGrammar(c, g.tapes));
            const newAlternation = new AlternationGrammar(newChildren);
            return newAlternation.accept(this);
        }

        if (g.child instanceof IntersectionGrammar) {
            // this(x&y) -> this(x)&this(y)
            const newFilter1 = new StartsGrammar(g.child.child1, g.tapes);
            const newFilter2 = new StartsGrammar(g.child.child2, g.tapes);
            const newIntersection = new IntersectionGrammar(newFilter1, newFilter2);
            return newIntersection.accept(this);
        }

        if (g.child instanceof LocatorGrammar) {
            const newFilter = new StartsGrammar(g.child.child, g.tapes);
            const newLocation = new LocatorGrammar(g.child.cell, newFilter);
            return newLocation.accept(this);
        }

        // construct the filter
        const [child, msgs] = g.child.accept(this).destructure();
        const dotStars: Grammar[] = [];
        for (const tape of g.tapes) {
            const dot = new DotGrammar(tape);
            const dotStar = new RepeatGrammar(dot);
            dotStars.push(dotStar);
        }
        return new SequenceGrammar([child, ...dotStars ]).msg(msgs);
    }
    
    public transformEnds(g: StartsGrammar): GrammarResult {

        if (g.child instanceof NegationGrammar) {
            // this(not(x) -> not(this(x))
            const newFilter = new EndsGrammar(g.child.child, g.tapes);
            const newNegation = new NegationGrammar(newFilter, g.child.maxReps);
            return newNegation.accept(this);
        }

        if (g.child instanceof SequenceGrammar && g.child.children.length > 0) {
            // this(x+y) -> this(x)+y
            const newChildren = [...g.child.children]; // clone the children
            const newFirstChild = new EndsGrammar(newChildren[0], g.tapes);
            newChildren[0] = newFirstChild;
            const newSequence = new SequenceGrammar(newChildren);
            return newSequence.accept(this);
        }
        
        if (g.child instanceof AlternationGrammar) {
            // this(x|y) -> this(x)|this(y)
            const newChildren = g.child.children.map(c => new EndsGrammar(c, g.tapes));
            const newAlternation = new AlternationGrammar(newChildren);
            return newAlternation.accept(this);
        }

        if (g.child instanceof IntersectionGrammar) {
            // this(x&y) -> this(x)&this(y)
            const newFilter1 = new EndsGrammar(g.child.child1, g.tapes);
            const newFilter2 = new EndsGrammar(g.child.child2, g.tapes);
            const newIntersection = new IntersectionGrammar(newFilter1, newFilter2);
            return newIntersection.accept(this);
        }
        
        if (g.child instanceof LocatorGrammar) {
            const newFilter = new EndsGrammar(g.child.child, g.tapes);
            const newLocation = new LocatorGrammar(g.child.cell, newFilter);
            return newLocation.accept(this);
        }

        // create the filter
        const [child, msgs] = g.child.accept(this).destructure();
        const dotStars: Grammar[] = [];
        for (const tape of g.tapes) {
            const dot = new DotGrammar(tape);
            const dotStar = new RepeatGrammar(dot);
            dotStars.push(dotStar);
        }
        return new SequenceGrammar([ ...dotStars, child ]).msg(msgs);
    }
    
    public transformContains(g: ContainsGrammar): GrammarResult {

        if (g.child instanceof NegationGrammar) {
            // this(not(x) -> not(this(x))
            const newFilter = new ContainsGrammar(g.child.child, g.tapes);
            const newNegation = new NegationGrammar(newFilter, g.child.maxReps);
            return newNegation.accept(this);
        }

        if (g.child instanceof SequenceGrammar && g.child.children.length > 0) {
            // this(x+y) -> x+this(y)
            const newChildren = [...g.child.children]; // clone the children
            const newFirstChild = new EndsGrammar(newChildren[0], g.tapes);
            newChildren[0] = newFirstChild;
            const newLastChild = new StartsGrammar(newChildren[newChildren.length-1], g.tapes);
            newChildren[newChildren.length-1] = newLastChild;
            const newSequence = new SequenceGrammar(newChildren);
            return newSequence.accept(this);
        }
        
        if (g.child instanceof AlternationGrammar) {
            // this(x|y) -> this(x)|this(y)
            const newChildren = g.child.children.map(c => new ContainsGrammar(c, g.tapes));
            const newAlternation = new AlternationGrammar(newChildren);
            return newAlternation.accept(this);
        }

        if (g.child instanceof IntersectionGrammar) {
            // this(x&y) -> this(x)&this(y)
            const newFilter1 = new ContainsGrammar(g.child.child1, g.tapes);
            const newFilter2 = new ContainsGrammar(g.child.child2, g.tapes);
            const newIntersection = new IntersectionGrammar(newFilter1, newFilter2);
            return newIntersection.accept(this);
        }

        if (g.child instanceof LocatorGrammar) {
            const newFilter = new ContainsGrammar(g.child.child, g.tapes);
            const newLocation = new LocatorGrammar(g.child.cell, newFilter);
            return newLocation.accept(this);
        }

        // create the filter
        const [child, msgs] = g.child.accept(this).destructure();
        const dotStars: Grammar[] = [];
        for (const tape of g.tapes) {
            const dot = new DotGrammar(tape);
            const dotStar = new RepeatGrammar(dot);
            dotStars.push(dotStar);
        }
        return new SequenceGrammar(
                    [ ...dotStars, child, ...dotStars ])
                   .msg(msgs);
    }
}