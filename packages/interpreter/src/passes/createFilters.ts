import { AutoPass } from "../passes.js";
import { 
    AlternationGrammar, ContainsGrammar, 
    DotGrammar, EndsGrammar, Grammar,
    NegationGrammar, RepeatGrammar, 
    SequenceGrammar, StartsGrammar, 
    RenameGrammar,
    FilterGrammar,
    JoinGrammar
} from "../grammars.js";
import { PassEnv } from "../components.js";

/**
 * This pass creates Joins out of filters and handles a semantic 
 * gotcha in starts/ends/contains.
 * 
 * If we filter a string to say that it starts with not(X), then the filter will
 * let everything through, because the empty string is a member of not(X), and every string
 * starts with the empty string.  This is correct but probably not what the programmer
 * means to say!
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
export class CreateFilters extends AutoPass<Grammar> {

    public preTransform(g: Grammar, env: PassEnv): Grammar {
        switch (g.tag) {
            case "filter":   return this.transformFilter(g, env)
                                        .tapify(env);
            case "starts":   return this.transformStarts(g, env)
                                        .tapify(env);
            case "ends":     return this.transformEnds(g, env)
                                        .tapify(env);
            case "contains": return this.transformContains(g, env)
                                        .tapify(env);
            default:         return g;
        }
    }

    transformFilter(g: FilterGrammar, env: PassEnv): Grammar {
        return new JoinGrammar(g.child1, g.child2);
    }

    public transformStarts(g: StartsGrammar, env: PassEnv): Grammar {

        if (g.child instanceof NegationGrammar) {
            // this(not(x) -> not(this(x))
            const newCond = new StartsGrammar(g.child.child, g.tapeName);
            return new NegationGrammar(newCond);
        }

        if (g.child instanceof SequenceGrammar && g.child.children.length > 0) {
            // this(x+y) -> x+this(y)
            const newChildren = [...g.child.children]; // clone the children
            const newLastChild = new StartsGrammar(
                newChildren[newChildren.length-1], g.tapeName);
            newChildren[newChildren.length-1] = newLastChild;
            return new SequenceGrammar(newChildren);
        }
        
        if (g.child instanceof AlternationGrammar) {
            // this(x|y) -> this(x)|this(y)
            const newChildren = g.child.children.map(c => new StartsGrammar(c, g.tapeName));
            return new AlternationGrammar(newChildren);
        }

        if (g.child instanceof JoinGrammar) {
            // this(x&y) -> this(x)&this(y)
            const newCond1 = new StartsGrammar(g.child.child1, g.tapeName);
            const newCond2 = new StartsGrammar(g.child.child2, g.tapeName);
            return new JoinGrammar(newCond1, newCond2);
        }

        if (g.child instanceof RenameGrammar) {
            const tapeName = g.child.toTape == g.tapeName ? g.child.fromTape 
                                                          : g.tapeName;
            const newCond = new StartsGrammar(g.child.child, tapeName);
            return new RenameGrammar(newCond, g.child.fromTape, g.child.toTape);
        }

        // construct the condition
        const dot = new DotGrammar(g.tapeName);
        const dotStar = new RepeatGrammar(dot);
        return new SequenceGrammar([g.child, dotStar]);
    }
    
    public transformEnds(g: EndsGrammar, env: PassEnv): Grammar {

        if (g.child instanceof NegationGrammar) {
            // this(not(x) -> not(this(x))
            const newCond = new EndsGrammar(g.child.child, g.tapeName);
            return new NegationGrammar(newCond);
        }

        if (g.child instanceof SequenceGrammar && g.child.children.length > 0) {
            // this(x+y) -> this(x)+y
            const newChildren = [...g.child.children]; // clone the children
            const newFirstChild = new EndsGrammar(newChildren[0], g.tapeName);
            newChildren[0] = newFirstChild;
            return new SequenceGrammar(newChildren);
        }
        
        if (g.child instanceof AlternationGrammar) {
            // this(x|y) -> this(x)|this(y)
            const newChildren = g.child.children.map(c => new EndsGrammar(c, g.tapeName));
            return new AlternationGrammar(newChildren);
        }
        
        if (g.child instanceof JoinGrammar) {
            // this(x&y) -> this(x)&this(y)
            const newCond1 = new EndsGrammar(g.child.child1, g.tapeName);
            const newCond2 = new EndsGrammar(g.child.child2, g.tapeName);
            return new JoinGrammar(newCond1, newCond2);
        }
        
        if (g.child instanceof RenameGrammar) {
            const tapeName = g.child.toTape == g.tapeName ? g.child.fromTape 
                                                          : g.tapeName;
            const newCond = new EndsGrammar(g.child.child, tapeName);
            return new RenameGrammar(newCond, g.child.fromTape, g.child.toTape);
        }

        // create the condition
        const dot = new DotGrammar(g.tapeName);
        const dotStar = new RepeatGrammar(dot);
        return new SequenceGrammar([dotStar, g.child ]);
        
    }
    
    public transformContains(g: ContainsGrammar, env: PassEnv): Grammar {

        if (g.child instanceof NegationGrammar) {
            // this(not(x) -> not(this(x))
            const newCond = new ContainsGrammar(g.child.child, g.tapeName);
            return new NegationGrammar(newCond);
        }

        if (g.child instanceof SequenceGrammar && g.child.children.length > 0) {
            // this(x+y) -> x+this(y)
            const newChildren = [...g.child.children]; // clone the children
            const newFirstChild = new EndsGrammar(newChildren[0], g.tapeName);
            newChildren[0] = newFirstChild;
            const newLastChild = new StartsGrammar(newChildren[newChildren.length-1], g.tapeName);
            newChildren[newChildren.length-1] = newLastChild;
            return new SequenceGrammar(newChildren);
        }
        
        if (g.child instanceof AlternationGrammar) {
            // this(x|y) -> this(x)|this(y)
            const newChildren = g.child.children.map(c => new ContainsGrammar(c, g.tapeName));
            return new AlternationGrammar(newChildren);
        }

        if (g.child instanceof JoinGrammar) {
            // this(x&y) -> this(x)&this(y)
            const newCond1 = new ContainsGrammar(g.child.child1, g.tapeName);
            const newCond2 = new ContainsGrammar(g.child.child2, g.tapeName);
            return new JoinGrammar(newCond1, newCond2);
        }
        
        if (g.child instanceof RenameGrammar) {
            const tapeName = g.child.toTape == g.tapeName ? g.child.fromTape 
                                                          : g.tapeName;
            const newCond = new ContainsGrammar(g.child.child, tapeName);
            return new RenameGrammar(newCond, g.child.fromTape, g.child.toTape);
        }
        
        // create the condition
        const dot = new DotGrammar(g.tapeName);
        const dotStar = new RepeatGrammar(dot);
        return new SequenceGrammar([dotStar, g.child, dotStar]);
    }
}
