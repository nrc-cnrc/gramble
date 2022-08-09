import { foldLeft } from "../util";
import { 
    AlternationGrammar, CounterStack, EpsilonGrammar, Grammar,
    NsGrammar, NullGrammar, ParallelGrammar, SequenceGrammar
} from "../grammars";
import { IdentityTransform } from "./transforms";

export class ParallelizeTransform extends IdentityTransform<void> {

    public get desc(): string {
        return "Parallelizing sequences";
    }

    public transformSequence(g: SequenceGrammar, ns: NsGrammar, args: void): Grammar {
        
        const newChildren: Grammar[] = [];
        for (const child of g.children) {
            const newChild = child.accept(this, ns, args);
            newChild.calculateTapes(new CounterStack(2));
            const prevChild = newChildren.pop();
            if (prevChild == undefined) {
                newChildren.push(newChild);
                continue;
            }
            newChildren.push(...combineIfPossible(prevChild, newChild));
        }

        return new SequenceGrammar(g.cell, newChildren);
    }

}

function combineIfPossible(g1: Grammar, g2: Grammar): Grammar[] {

    // Two one-tape grammars can be parallelized
    if (g1.tapes.length == 1 && 
                g2.tapes.length == 1 &&
                g1.tapes[0] != g2.tapes[0]) {
        const result = new ParallelGrammar(g1.cell, [g1, g2]);
        result.calculateTapes(new CounterStack(2));
        return [result];
    }

    // A ParallelGrammar and a one-tape grammar can be parallelized
    // if the parallel doesn't already have that tape
    if (g1 instanceof ParallelGrammar && 
            g2.tapes.length == 1 && 
            g1.tapes.indexOf(g2.tapes[0]) == -1) {
        const newChildren = [... g1.children, g2];
        const result = new ParallelGrammar(g1.cell, newChildren);
        result.calculateTapes(new CounterStack(2));
        return [result];
    }
    
    // But if the parallel already DOES have that tape, you can
    // sequence it with the appropriate child.
    if (g1 instanceof ParallelGrammar && 
            g2.tapes.length == 1) {
        
        const newChildren: Grammar[] = [];
        for (const child of g1.children) {
            if (child.tapes.length == 1 && 
                    child.tapes[0] == g2.tapes[0]) {
                const newChild = new SequenceGrammar(g1.cell, [child, g2]);
                newChildren.push(newChild);
                continue;
            }
            newChildren.push(child);
        }
        const result = new ParallelGrammar(g1.cell, newChildren);
        result.calculateTapes(new CounterStack(2));
        return [result];
    }

    return [g1, g2];
}

