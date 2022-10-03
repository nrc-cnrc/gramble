import { Msgs } from "../msgs";
import { 
    CounterStack, Grammar,
    GrammarResult,
    ParallelGrammar, SequenceGrammar
} from "../grammars";
import { IdentityTransform } from "./transforms";
import { TransEnv } from "../transforms";

export class ParallelizeTransform extends IdentityTransform {

    public get desc(): string {
        return "Parallelizing sequences";
    }

    public transformSequence(g: SequenceGrammar, env: TransEnv): GrammarResult {
        
        const newChildren: Grammar[] = [];
        const msgs: Msgs = [];
        for (const child of g.children) {
            const newChild = child.accept(this, env).msgTo(msgs);
            newChild.calculateTapes(new CounterStack(2));
            const prevChild = newChildren.pop();
            if (prevChild == undefined) {
                newChildren.push(newChild);
                continue;
            }
            newChildren.push(...combineIfPossible(prevChild, newChild));
        }

        return new SequenceGrammar(newChildren).msg(msgs);
    }

}

function combineIfPossible(g1: Grammar, g2: Grammar): Grammar[] {

    // Two one-tape grammars can be parallelized
    if (g1.tapes.length == 1 && 
                g2.tapes.length == 1 &&
                g1.tapes[0] != g2.tapes[0]) {
        const result = new ParallelGrammar([g1, g2]);
        result.calculateTapes(new CounterStack(2));
        return [result];
    }

    // A ParallelGrammar and a one-tape grammar can be parallelized
    // if the parallel doesn't already have that tape
    if (g1 instanceof ParallelGrammar && 
            g2.tapes.length == 1 && 
            g1.tapes.indexOf(g2.tapes[0]) == -1) {
        const newChildren = [... g1.children, g2];
        const result = new ParallelGrammar(newChildren);
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
                const newChild = new SequenceGrammar([child, g2]);
                newChildren.push(newChild);
                continue;
            }
            newChildren.push(child);
        }
        const result = new ParallelGrammar(newChildren);
        result.calculateTapes(new CounterStack(2));
        return [result];
    }

    return [g1, g2];
}

