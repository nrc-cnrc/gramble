import { 
    CounterStack,
    EpsilonGrammar,
    FilterGrammar,
    Grammar,
    JoinGrammar,
    ReplaceBlockGrammar, 
    ReplaceGrammar,
    SequenceGrammar,
} from "../grammars";

import { PassEnv } from "../passes";
import { PostPass } from "./ancestorPasses";

/**
 * There are a few sanity checks we want to do for replacement rules.
 * 
 * We want to throw errors when:
 * 
 *   * The rule invokes too many/few tapes
 * 
 * We want to warn when:
 * 
 *   * Make sure that, in obligatory rules, the from-tape material (pre-from-post)
 *     isn't nullable.
 * 
 *   * Make sure that the to-tape material isn't infinite.
 * 
 * We can't know these with 100% certainty, so both of these is a warning
 * rather than an error.
 */

export class ProcessFilters extends PostPass<Grammar> {

    public get desc(): string {
        return "Processing filters";
    }
    
    public postTransform(g: Grammar, env: PassEnv): Grammar {
        switch (g.tag) {
            case "filter":  return this.handleFilter(g, env);
            default:        return g;
        }
    }

    public handleFilter(g: FilterGrammar, env: PassEnv): Grammar {

        g.calculateTapes(new CounterStack(2), env);
        const conditionTapes = g.child2.tapes;
        if (conditionTapes.length === 0) return g.child1; // it's an epsilon or failure and caught elsewhere
        if (conditionTapes.length > 1) {
            throw g.child1.err("Filters must be single-tape", 
            `A filter like equals, starts, etc. should only reference a single tape.  ID: ${g.child2.id}`);
        }
        const childTapes = new Set(g.child1.tapes);
        if (!(childTapes.has(conditionTapes[0]))) {
            throw g.child1.err("Filtering non-existent tape", `This filter references a tape ${conditionTapes[0]} that does not exist`);
        }
        return new JoinGrammar(g.child1, g.child2);

    }

}