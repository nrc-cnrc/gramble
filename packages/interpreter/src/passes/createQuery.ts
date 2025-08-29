import { Msg } from "../utils/msgs.js";
import { 
    Grammar, JoinGrammar
} from "../grammars.js";
import { Pass } from "../passes.js";
import { StringDict, dictLen } from "../utils/func.js";
import { Query } from "../grammarConvenience.js";
import { PassEnv } from "../components.js";
import * as Tapes from "../tapes.js";

/**
 * The user can specify a query like `{ class: "v2", subj: "1SG" }`,
 * which will act to restrict the results to only those that match.
 * 
 * To achieve this, we turn that into 
 * `Seq(Lit("class", "v2"), Lit("subj", "1SG"))`
 * and join it with the grammar.
 */
export class CreateQuery extends Pass<Grammar,Grammar> {
    
    constructor(
        public query: Grammar | StringDict[] | StringDict | string = {},
    ) {
        super();
    }
    
    public transformAux(g: Grammar, env: PassEnv): Grammar {

        // if it's an empty query there's nothing to do
        if (Array.isArray(this.query) && this.query.length === 0) 
            return g;

        if (typeof(this.query) === 'string' && this.query.length === 0)
            return g;

        if (typeof(this.query) === 'object' && 
                'dictLen' in this.query && dictLen(this.query) == 0) 
            return g;

        // otherwise turn it into a product of literals and join it
        const querySeq = Query(this.query).tapify(env);
        if (querySeq.tag == "epsilon") {
            return g;
        }
        const result = new JoinGrammar(g, querySeq)
                        .tapify(env);
        return result;
    }
}

