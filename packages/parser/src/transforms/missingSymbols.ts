import { HIDDEN_TAPE_PREFIX } from "../util";
import { 
    CounterStack, EpsilonGrammar, Grammar,
    HideGrammar,
    NsGrammar, RenameGrammar, UnresolvedEmbedGrammar
} from "../grammars";

import { IdentityTransform } from "./transforms";


export class MissingSymbolsTransform extends IdentityTransform {

    public get desc(): string {
        return "Validating tape-rename structure";
    }

    public transformUnresolvedEmbed(g: UnresolvedEmbedGrammar): Grammar {

        g.message({
            type: "error",  
            shortMsg: "Unknown symbol", 
            longMsg: `Undefined symbol: ${g.name}`
        });

        return new EpsilonGrammar(g.cell);
    }
}