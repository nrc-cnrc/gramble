import { foldLeft } from "../util";
import { 
    AlternationGrammar, CounterStack, EpsilonGrammar, Grammar,
    NsGrammar, NullGrammar, SequenceGrammar
} from "../grammars";
import { IdentityTransform } from "./transforms";

/**
 * The FlattenTransform takes the grammar made by the tabular syntax tree and
 * cleans up some of the little quirks due to the implementation of that algorithm
 * 
 *   (1) TST.toGrammar() results in left-branching binary trees for Sequences.  It does 
 *      seem to matter, a bit, what direction Sequences branch, depending on whether 
 *      we're executing LTR and RTL, and I didn't like this being up to a quirk in the
 *      parsing algorithm.  So this flattens nested Sequences (and Alternations) down
 *      to a flat structure.
 * 
 *   (2) It also results in an epsilon at the beginning of every sequence.  There are a 
 *      few things this messes up (it results in counterintuitive results when adjusting
 *      scope in ends/contains), so this tranform removes them.
 */
export class FlattenTransform extends IdentityTransform<void> {

    public get desc(): string {
        return "Flattening sequences/alternations";
    }

    public transformSequence(g: SequenceGrammar, ns: NsGrammar, args: void): Grammar {
        
        const children = g.children.map(c => c.accept(this, ns, args));
        const newChildren: Grammar[] = [];
        for (const child of children) {
            if (child instanceof SequenceGrammar) {
                newChildren.push(...child.children);
                continue;
            }
            if (child instanceof EpsilonGrammar) {
                continue;
            }
            newChildren.push(child);
        }
        return new SequenceGrammar(g.cell, newChildren);
    }

    
    public transformAlternation(g: AlternationGrammar, ns: NsGrammar, args: void): Grammar {
        
        const children = g.children.map(c => c.accept(this, ns, args));
        const newChildren: Grammar[] = [];
        for (const child of children) {
            if (child instanceof AlternationGrammar) {
                newChildren.push(...child.children);
                continue;
            }
            if (child instanceof NullGrammar) {
                continue;
            }
            newChildren.push(child);
        }
        return new AlternationGrammar(g.cell, newChildren);
    }

}
