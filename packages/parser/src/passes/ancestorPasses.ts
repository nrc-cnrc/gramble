import { PassError, PostPass, stringToMsg } from "../passes";
import { Component } from "../components";
import { TstEmpty } from "../tsts";
import { Grammar, EpsilonGrammar } from "../grammars";

export class PostComponentPass extends PostPass<Component> {

    public getDefaultRepair(): Component {
        return new TstEmpty();
    }
}

export class PostGrammarPass extends PostPass<Grammar> {

    public getDefaultRepair(): Grammar {
        return new EpsilonGrammar();
    }
}

export function GrammarError(
    msg: string,
    repair: Grammar = new EpsilonGrammar()
): PassError<Grammar> { 
    return new PassError(repair, stringToMsg(msg));
}

export function TstError(
    msg: string,
    repair: Component = new TstEmpty(),
): PassError<Component> { 
    return new PassError(repair, stringToMsg(msg));
}

