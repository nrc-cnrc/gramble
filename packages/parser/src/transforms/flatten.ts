import { 
    AlternationGrammar, CounterStack, EpsilonGrammar, Grammar,
    NsGrammar, NullGrammar, SequenceGrammar
} from "../grammars";
import { IdentityTransform } from "./transforms";

export class FlattenTransform extends IdentityTransform<void> {

    public transform(g: Grammar): Grammar {
        g.calculateTapes(new CounterStack(2));
        return g.accept(this, g as NsGrammar, null);
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
