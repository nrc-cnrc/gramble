import { Pass, PassEnv, PassError, stringToMsg } from "../passes";
import { Component } from "../components";
import { TstEmpty } from "../tsts";
import { Grammar, EpsilonGrammar } from "../grammars";
import { Result, result } from "../msgs";
import { CellPos } from "../util";

function catchPassError<T>(
    e: any, 
    defaultRepair: T,
    pos: CellPos | undefined
): Result<T> {
    if (typeof e === "string") {
        const m = stringToMsg(e).localize(pos);
        return result(defaultRepair).msg(m);
    }
    if (!(e instanceof PassError)) throw e;
    return result(e.repair).msg(e.msgs).localize(pos);
}

export abstract class PostPass<T extends Component> extends Pass<T,T> {

    public transform(g: T, env: PassEnv): Result<T> {

        let resultGrammar: Result<T>;
        try {
            resultGrammar = result(this.preTransform(g, env));
        } catch (e) {
            resultGrammar = catchPassError(e, this.getDefaultRepair(), g.pos);
        }

        return resultGrammar
                .bind(g => g.mapChildren(this, env) as Result<T>)
                .bind(g => {
                    try {
                        return result(this.postTransform(g, env));
                    } catch (e) {
                        return catchPassError(e, this.getDefaultRepair(), g.pos);
                    }
        });
    }

    public abstract getDefaultRepair(): T;
    

    public preTransform(g: T, env: PassEnv): T {
        return g;
    }

    public postTransform(g: T, env: PassEnv): T {
        return g;
    }

}

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

