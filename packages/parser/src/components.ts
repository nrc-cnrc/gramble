import { 
    Err, Warn, 
    Msg, Msgs, 
    result, Result, 
    ResultVoid 
} from "./msgs";
import { Pass, PassEnv } from "./passes";
import { CellPos, Dict } from "./util";

export class CResult extends Result<Component> { }
export abstract class CPass extends Pass<Component,Component> {}

export abstract class Component {

    public get pos(): CellPos | undefined {
        return undefined;
    }   

    public mapChildren(f: CPass, env: PassEnv): CResult {
        const clone = Object.create(Object.getPrototypeOf(this));
        const msgs: Msgs = [];
        for (const [k, v] of Object.entries(this)) {
            if (!this.hasOwnProperty(k)) continue;
            if (k.startsWith("_")) continue;
            clone[k] = mapAny(v, f, env).msgTo(msgs);
        }
        return clone.msg(msgs);
    }

    public msg(m: Msg | Msgs | ResultVoid = []): CResult {
        return result(this).msg(m);
    }

    public err(shortMsg: string, longMsg: string, pos?: CellPos): CResult {
        const e = Err(shortMsg, longMsg);
        return this.msg(e).localize(pos).localize(this.pos);
    }
    
    public warn(longMsg: string, pos?: CellPos): CResult {
        const e = Warn(longMsg);
        return this.msg(e).localize(pos).localize(this.pos);
    }
}

export function mapAny<T extends Component>(x: any, f: Pass<T,T>, env: PassEnv): Result<any> {
    if (x instanceof Component) {
        return f.transform(x as T, env);
    } else if (Array.isArray(x)) {
        return mapArray(x, f, env);
    } else if (x instanceof Set) {
        return mapSet(x, f, env);
    } else if (x instanceof Object) {
        return mapDict(x, f, env);
    } else {
        return result(x);
    }
}

export function mapSet<T extends Component>(xs: Set<any>, f: Pass<T,T>, env: PassEnv): Result<Set<any>> {
    const results: Set<any> = new Set();
    const msgs: Msgs = [];
    for (const x of xs) {
        const newX = mapAny(x, f, env).msgTo(msgs);
        results.add(newX);
    }
    return result(results).msg(msgs);
}

export function mapArray<T extends Component>(xs: any[], f: Pass<T,T>, env: PassEnv): Result<any[]> {
    const results: any[] = [];
    const msgs: Msgs = [];
    for (const x of xs) {
        const newX = mapAny(x, f, env).msgTo(msgs);
        results.push(newX);
    }
    return result(results).msg(msgs);
}

export function mapDict<T extends Component>(xmap: Dict<any>, f: Pass<T,T>, env: PassEnv): Result<Dict<any>> {
    const results: Dict<any> = {};
    const msgs: Msgs = [];
    for (const [k, v] of Object.entries(xmap)) {
        const newX = mapAny(v, f, env).msgTo(msgs);
        results[k] = newX;
    }
    return result(results).msg(msgs);
}