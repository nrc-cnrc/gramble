import { Grammar } from "./grammars";
import { Msgs, Result, result } from "./msgs";
import { 
    Dict, Options, 
    Namespace, 
    Env
} from "./util";
import { VERBOSE_TIME, timeIt } from "./utils/logging";

export class PassEnv extends Env {

    constructor(
        opt: Partial<Options> = {},
        public symbolNS: Namespace<Grammar> = new Namespace()
    ) { 
        super(opt);
    }

    public pushSymbols(d: Dict<Grammar>): PassEnv {
        const newSymbolNS = this.symbolNS.push(d);
        return new PassEnv(this.opt, newSymbolNS);
    }

}

export abstract class Pass<T1,T2> {

    public go(t: T1|Result<T1>, env: PassEnv): Result<T2> {

        const msgs: Msgs = [];

        if (t instanceof Result) {
            t = t.msgTo(msgs);     
        }

        const verbose = (env.opt.verbose & VERBOSE_TIME) != 0;
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
            return result(t(c, env));
        } catch (e) {
            if (!(e instanceof Result)) throw e;
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