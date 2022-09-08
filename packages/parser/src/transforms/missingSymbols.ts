import { HIDDEN_TAPE_PREFIX } from "../util";
import { 
    CounterStack, EpsilonGrammar, Grammar,
    HideGrammar,
    NsGrammar, RenameGrammar, UnresolvedEmbedGrammar
} from "../grammars";

import { IdentityTransform } from "./transforms";


export class MissingSymbolsTransform extends IdentityTransform<void>{

    public get desc(): string {
        return "Validating tape-rename structure";
    }

    public transformUnresolvedEmbed(g: UnresolvedEmbedGrammar, ns: NsGrammar, args: void): Grammar {

        g.message({
            type: "error",  
            shortMsg: "Unknown symbol", 
            longMsg: `Undefined symbol: ${g.name}`
        });

        return new EpsilonGrammar(g.cell);
    }
}