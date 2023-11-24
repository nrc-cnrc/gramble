import { Grammar } from "./grammars";
import { Msgs, Result, result } from "./utils/msgs";
import { 
    Dict, update
} from "./utils/func";
import { VERBOSE_TIME, timeIt } from "./utils/logging";
import { Env, Options } from "./utils/options";
import { hasPos } from "./utils/cell";
import { Component } from "./components";

export class PassEnv extends Env {

    constructor(
        opt: Partial<Options> = {},
        public symbolNS: Dict<Grammar> = {}
    ) { 
        super(opt);
    }

    public setSymbols(d: Dict<Grammar>): PassEnv {
        return update(this, {symbolNS: d});
    }
}

export abstract class Pass<T1,T2> {

    public go(c: T1|Result<T1>, env: PassEnv): Result<T2> {

        const msgs: Msgs = [];

        if (c instanceof Result) {
            c = c.msgTo(msgs);     
        }

        const verbose = (env.opt.verbose & VERBOSE_TIME) != 0;
        return timeIt(() => this.transform(c as T1, env).msg(msgs), 
               verbose, this.desc);
    }

    public get desc(): string { 
        return "Pass base class";
    }

    public transform(c: T1, env: PassEnv): Result<T2> {
        let result = this.tryTransform(this.transformAux, c, env)
        if (hasPos(c)) return result.localize(c.pos);
        return result;
    }

    public transformAux(c: T1, env: PassEnv): T2|Result<T2> {
        throw new Error("not implemented");
    }

    public compose<T3>(other: Pass<T2,T3>): Pass<T1,T3> {
        return new ComposedPass(this, other);
    }

    /**
     * A convenience method for descendant classes, that catches
     * thrown results and handles re-integrating them into the 
     * messaging/localization system.
     */
    public tryTransform(
        transform: (c: T1, env: PassEnv) => T2|Result<T2>,
        c: T1,
        env: PassEnv
    ): Result<T2> {
        try {
            const t = transform.bind(this);
            let res = result(t(c, env));
            if (hasPos(c)) return res.localize(c.pos);
            return res;
        } catch (e) {
            if (!(e instanceof Result)) throw e;
            if (hasPos(c)) return e.localize(c.pos);
            return e;
        }
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

export abstract class AutoPass<T extends Component> extends Pass<T,T> {

    public transformAux(c: T, env: PassEnv): Result<T> {
        return this.tryTransform(this.preTransform, c, env)
                   .bind(c => c.mapChildren(this, env) as Result<T>)
                   .bind(c => this.tryTransform(this.postTransform, c, env))
    }

    public preTransform(g: T, env: PassEnv): T|Result<T> {
        return g;
    }

    public postTransform(g: T, env: PassEnv): T|Result<T> {
        return g;
    }

}