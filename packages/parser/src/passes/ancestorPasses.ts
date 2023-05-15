import { Pass, PassEnv } from "../passes";
import { Component } from "../components";
import { Result, result } from "../msgs";

export abstract class CatchingPass<T1 extends Component, 
                T2 extends Component> extends Pass<T1,T2> {

    public transform(c: T1, env: PassEnv): Result<T2> {
        return this.tryTransform(this.transformAux, c, env)
                   .localize(c.pos);
    }

    public abstract transformAux(t: T1, env: PassEnv): T2|Result<T2>;

}

export abstract class PostPass<T extends Component> extends Pass<T,T> {

    public tryTransform(
        transform: (input: T, env: PassEnv) => T,
        input: T,
        env: PassEnv
    ): Result<T> {
        try {
            const t = transform.bind(this);
            return result(t(input, env)).localize(input.pos);
        } catch (e) {
            if (!(e instanceof Result)) throw e;
            return e.localize(input.pos);
        }
    }

    public transform(c: T, env: PassEnv): Result<T> {
        return this.tryTransform(this.preTransform, c, env)
                   .bind(g => g.mapChildren(this, env).localize(g.pos) as Result<T>)
                   .bind(g => this.tryTransform(this.postTransform, g, env))
    }

    public preTransform(g: T, env: PassEnv): T {
        return g;
    }

    public postTransform(g: T, env: PassEnv): T {
        return g;
    }

}