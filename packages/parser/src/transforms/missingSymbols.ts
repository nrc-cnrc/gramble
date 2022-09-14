import { Msg, Msgs, unlocalizedError } from "../util";
import { 
    EpsilonGrammar, Grammar, UnresolvedEmbedGrammar
} from "../grammars";

import { IdentityTransform } from "./transforms";


export class MissingSymbolsTransform extends IdentityTransform {

    public get desc(): string {
        return "Validating tape-rename structure";
    }

    public transformUnresolvedEmbed(g: UnresolvedEmbedGrammar): [Grammar, Msgs] {

        const err: Msg = unlocalizedError(
            "Undefined symbol", 
            `Undefined symbol: ${g.name}`
        );

        const result = new EpsilonGrammar();
        return [result, [err]];
    }
}