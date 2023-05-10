import { Component } from "./components";
import { EpsilonGrammar, Grammar } from "./grammars";
import { Err, Msg, Msgs, Result, Warn, result } from "./msgs";
import { TstEmpty } from "./tsts";
import { 
    Dict, Namespace, 
    SILENT, timeIt, 
    VERBOSE_TIME 
} from "./util";

export class PassEnv {

    constructor(
        public verbose: number = SILENT,
        public parallelize: boolean = false,
        public symbolNS: Namespace<Grammar> = new Namespace()
    ) { }

    public pushSymbols(d: Dict<Grammar>): PassEnv {
        const newSymbolNS = this.symbolNS.push(d);
        return new PassEnv(this.verbose, this.parallelize, 
                        newSymbolNS);
    }

}

export abstract class Pass<T1,T2> {

    public go(t: T1|Result<T1>, env: PassEnv): Result<T2> {

        const msgs: Msgs = [];

        if (t instanceof Result) {
            t = t.msgTo(msgs);     
        }

        const verbose = (env.verbose & VERBOSE_TIME) != 0;
        return timeIt(() => this.transformRoot(t as T1, env).msg(msgs), 
               verbose, this.desc);
    }
    
    /**
     * A wrapper method in case a subclass has special
     * setup/teardown before and after processing the root;
     * override this one rather than go() so you don't have
     * to redo the logging boilerplate.
     */
    public transformRoot(t: T1, env: PassEnv): Result<T2> {
        return this.transform(t, env);
    }

    public get desc(): string { 
        return "Pass base class";
    }

    public abstract transform(t: T1, env: PassEnv): Result<T2>;

    public compose<T3>(other: Pass<T2,T3>): Pass<T1,T3> {
        return new ComposedPass(this, other);
    }
}

export class ComposedPass<T1,T2,T3> extends Pass<T1,T3> {

    constructor(
        public child1: Pass<T1,T2>,
        public child2: Pass<T2,T3>
    ) { 
        super();
    }
    
    public static get desc(): string {
        return 'Composed pass';
    }

    public go(t: T1, env: PassEnv): Result<T3> {
        return new Result<T1>(t)
                    .bind(t => this.child1.go(t, env))
                    .bind(t => this.child2.go(t, env))
    }

    public transform(t: T1, env: PassEnv): Result<T3> {
        throw new Error("calling transform on a composed pass");
    }

}

export function stringToMsg(msg: string): Msg {

    const pieces = msg.split("--");
    if (pieces.length == 1) {
        const shortMsg = msg.slice(0, 20).trim() + "...";
        const longMsg = msg;
        return Err(shortMsg, longMsg);
    }

    const shortMsg = pieces[0].trim();
    const longMsg = pieces.slice(1).join("--").trim();
    
    if (shortMsg.toLowerCase() == "warning") {
        return Warn(longMsg);
    }

    return Err(shortMsg, longMsg);
}

export class PassError<T> {

    constructor(
        public repair: T,
        public msgs: Msg | Msgs
    ) { }
}

export abstract class PostPass<T extends Component> extends Pass<T,T> {

    public transform(g: T, env: PassEnv): Result<T> {
        const newG = g.mapChildren(this, env) as Result<T>;
        return newG.bind(g => {
            try {
                return result(this.postTransform(g, env));
            } catch (e) {
                if (typeof e === "string") {
                    const m = stringToMsg(e).localize(g.pos);
                    return this.getDefaultRepair().msg(m);
                }
                if (!(e instanceof PassError)) throw e;
                return e.repair.msg(e.msgs).localize(g.pos);
            }
        });
    }

    public abstract getDefaultRepair(): T;

    public postTransform(g: T, env: PassEnv): T {
        return g;
    }

}
