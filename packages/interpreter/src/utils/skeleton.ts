import { Pass, PassEnv } from "../passes";
import { Component } from "../components";
import { Dict } from "./func";
import { Message, Msg, msg } from "./msgs";

export type Skeleton<G extends Component, T> = {
    [K in keyof G]: G[K] extends Component ? T : 
                    G[K] extends Component[] ? T[] :
                    G[K] extends Dict<Component> ? Dict<T> :
                    G[K] extends Set<Component> ? Set<T> :
                    G[K]
};

export function skeletize<T1 extends Component,T2 extends T1,T3>(
    o: T2, 
    f: Pass<T1,T3>,
    env: PassEnv,
): Msg<Skeleton<T2,T3>> {
    const results: any = { };
    const msgs: Message[] = [];
    for (const [k,v] of Object.entries(o)) {
        if (v instanceof Component) {
            results[k] = f.transform(v as T1, env)
                          .msgTo(msgs);
        }
        results[k] = v;
    }
    return msg(results as Skeleton<T2,T3>).msg(msgs);
}