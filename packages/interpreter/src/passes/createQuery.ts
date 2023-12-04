import { Msg } from "../utils/msgs";
import { 
    Grammar, JoinGrammar
} from "../grammars";
import { Pass } from "../passes";
import { StringDict, dictLen } from "../utils/func";
import { Query } from "../grammarConvenience";
import { PassEnv } from "../components";

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
        public query: | StringDict | StringDict[] = {},
    ) {
        super();
    }
    
    public transformAux(g: Grammar, env: PassEnv): Grammar {

        // if it's an empty query there's nothing to do
        if (Array.isArray(this.query) && this.query.length === 0) 
            return g;
        
        if (!Array.isArray(this.query) && dictLen(this.query) == 0) 
            return g;

        // otherwise turn it into a product of literals and join it
        const querySeq = Query(this.query);
        return new JoinGrammar(g, querySeq)
                        .tapify(env);
    }
}

