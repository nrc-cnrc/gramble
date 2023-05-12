import { Pass, PassEnv } from "../passes";
import { Component } from "../components";
import { TstEmpty } from "../tsts";
import { Grammar, EpsilonGrammar } from "../grammars";
import { Result, result } from "../msgs";
import { CellPos } from "../util";


export abstract class PostPass<T extends Component> extends Pass<T,T> {

    public tryTransform(
        transform: (input: T, env: PassEnv) => T,
        input: T,
        env: PassEnv
    ): Result<T> {
        try {
            const t = transform.bind(this);
            return result(t(input, env));
        } catch (e) {
            if (!(e instanceof Result)) throw e;
            return e.localize(input.pos);
        }
    }

    public transform(g: T, env: PassEnv): Result<T> {
        return this.tryTransform(this.preTransform, g, env)
                   .bind(g => g.mapChildren(this, env) as Result<T>)
                   .bind(g => this.tryTransform(this.postTransform, g, env))
    }

    public preTransform(g: T, env: PassEnv): T {
        return g;
    }

    public postTransform(g: T, env: PassEnv): T {
        return g;
    }

}