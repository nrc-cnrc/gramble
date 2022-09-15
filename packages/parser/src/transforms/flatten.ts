import { Msgs } from "../msgs";
import { 
    AlternationGrammar, EpsilonGrammar, Grammar,
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
export class FlattenTransform extends IdentityTransform {

    public get desc(): string {
        return "Flattening sequences/alternations";
    }

    public transformSequence(g: SequenceGrammar): [Grammar, Msgs] {
        
        const [children, msgs] = this.mapTo(g.children);
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
        const result = new SequenceGrammar(newChildren);
        return [result, msgs];
    }

    
    public transformAlternation(g: AlternationGrammar): [Grammar, Msgs] {
        
        const [children, msgs] = this.mapTo(g.children);
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
        const result = new AlternationGrammar(newChildren);
        return [result, msgs];
    }

}
