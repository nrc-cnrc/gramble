import { NsGrammar } from "./grammars";
import { Result } from "./msgs";
import { SILENT, timeIt, VERBOSE_TIME } from "./util";

export class PassEnv {
    verbose: number = SILENT;
    parallelize: boolean = false;
    ns: NsGrammar = new NsGrammar();
}

export abstract class Pass<T1,T2> {

    public go(t: T1, env: PassEnv): Result<T2> {
        const verbose = (env.verbose & VERBOSE_TIME) != 0;
        return timeIt(() => this.transformRoot(t, env), 
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