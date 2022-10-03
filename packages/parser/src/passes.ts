import { Result } from "./msgs";
import { SILENT, timeIt, VERBOSE_TIME } from "./util";

export class PassEnv {
    verbose: number = SILENT;
    parallelize: boolean = false;
    //ns: {[name: string]: Grammar} = {}
}

export abstract class Pass<T1,T2> {

    public transformAndLog(t: T1, env: PassEnv): Result<T2> {
        const verbose = (env.verbose & VERBOSE_TIME) != 0;
        return timeIt(() => this.transform(t, env), 
               verbose, this.desc);
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

    public transformAndLog(t: T1, env: PassEnv): Result<T3> {
        return new Result<T1>(t)
                    .bind(t => this.child1.transformAndLog(t, env))
                    .bind(t => this.child2.transformAndLog(t, env))
    }

    public transform(t: T1, env: PassEnv): Result<T3> {
        return new Result<T1>(t)
                .bind(t => this.child1.transform(t, env))
                .bind(t => this.child2.transform(t, env));
    }

}