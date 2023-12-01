import { Grammar } from "./grammars";
import { Message, Msg, msg } from "./utils/msgs";
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

    public transform(c: T1, env: PassEnv): Msg<T2> {
        let result = this.tryTransform(this.transformAux, c, env)
        if (hasPos(c)) return result.localize(c.pos);
        return result;
    }

    public transformAux(c: T1, env: PassEnv): T2|Msg<T2> {
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
        transform: (c: T1, env: PassEnv) => T2|Msg<T2>,
        c: T1,
        env: PassEnv
    ): Msg<T2> {
        try {
            const t = transform.bind(this);
            let res = msg(t(c, env));
            if (hasPos(c)) return res.localize(c.pos);
            return res;
        } catch (e) {
            if (!(e instanceof Msg)) throw e;
            if (hasPos(c)) return e.localize(c.pos);
            return e;
        }
    }
}

export class TimerPass<T1,T2> extends Pass<T1,T2> {

    constructor(
        public desc: string,
        public child: Pass<T1,T2>
    ) { 
        super();
    }

    public transform(c: T1, env: PassEnv): Msg<T2> {
        // execute the transformation, printing the desc and elapsed
        // time if requested
        const verbose = (env.opt.verbose & VERBOSE_TIME) != 0;
        return timeIt(() => this.child.transform(c, env), 
               verbose, this.desc);
    }
}

export class ComposedPass<T1,T2,T3> extends Pass<T1,T3> {

    constructor(
        public child1: Pass<T1,T2>,
        public child2: Pass<T2,T3>
    ) { 
        super();
    }

    public transform(t: T1, env: PassEnv): Msg<T3> {
        return msg(t)
                    .bind(t => this.child1.transform(t, env))
                    .bind(t => this.child2.transform(t, env))
    }

}

export abstract class AutoPass<T extends Component> extends Pass<T,T> {

    public transformAux(c: T, env: PassEnv): Msg<T> {
        return this.tryTransform(this.preTransform, c, env)
                   .bind(c => c.mapChildren(this, env).localize(c.pos) as Msg<T>)
                   .bind(c => this.tryTransform(this.postTransform, c, env))
    }

    public preTransform(g: T, env: PassEnv): T|Msg<T> {
        return g;
    }

    public postTransform(g: T, env: PassEnv): T|Msg<T> {
        return g;
    }

}