import { 
    AlternationGrammar, ContainsGrammar, CounterStack, 
    DotGrammar, EndsGrammar, Grammar,
    IntersectionGrammar, NegationGrammar, 
    NsGrammar, RepeatGrammar, SequenceGrammar, StartsGrammar
} from "../grammars";

import { IdentityTransform } from "./transforms";

export class FilterTransform extends IdentityTransform<void> {

    public transform(g: Grammar): Grammar {
        g.calculateTapes(new CounterStack(2));
        return g.accept(this, g as NsGrammar, null);
    }

    public transformStarts(g: StartsGrammar, ns: NsGrammar, args: void): Grammar {
        
        if (g.tapes == undefined) {
            throw new Error("missing tapes in StartsGrammar");
        }

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
        
        if (g.tapes == undefined) {
            throw new Error("missing tapes in EndsGrammar");
        }

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
        
        if (g.tapes == undefined) {
            throw new Error("missing tapes in ContainsGrammar");
        }

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

