import { 
    Err, Warn, 
    Msg, Msgs, 
    result, Result, 
    ResultVoid
} from "./utils/msgs";
import { Pass, PassEnv } from "./passes";
import { Dict, update } from "./utils/func";
import { Pos } from "./utils/cell";

export abstract class Component {
    public abstract readonly tag: string;

    public pos: Pos | undefined = undefined;

    public mapChildren(f: Pass<Component,Component>, env: PassEnv): Result<Component> {
        const clone = Object.create(Object.getPrototypeOf(this));
        const msgs: Msgs = [];
        for (const [k, v] of Object.entries(this)) {
            if (!this.hasOwnProperty(k)) continue;
            if (k.startsWith("_")) continue;
            clone[k] = mapAny(v, f, env).msgTo(msgs);
        }
        const newMsgs = msgs.map(m => m.localize(this.pos));
        return clone.msg(newMsgs);
    }

    public msg(m: Msg | Msgs | ResultVoid = []): Result<this> {
        return result(this).msg(m);
    }

    public err(shortMsg: string, longMsg: string): Result<this> {
        const e = Err(shortMsg, longMsg);
        return this.msg(e);
    }
    
    public warn(longMsg: string): Result<this> {
        const e = Warn(longMsg);
        return this.msg(e);
    }

    public locate(pos: Pos | undefined): Component {
        if (pos === undefined) return this;
        if (this.pos !== undefined) return this;
        return update(this, { pos: pos });
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
        return mapObj(x, f, env);
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

export function mapObj<T extends Component>(x: any, f: Pass<T,T>, env: PassEnv): Result<Dict<any>> {
    const results: Dict<any> = Object.create(Object.getPrototypeOf(x));
    const msgs: Msgs = [];
    for (const [k, v] of Object.entries(x)) {
        if (!x.hasOwnProperty(k)) continue;
        const newX = mapAny(v, f, env).msgTo(msgs);
        results[k] = newX;
    }
    return result(results).msg(msgs);
}

/// GETTING CHILDREN

export function getChildren<T extends Component>(c: T): T[] {
    const children: T[] = [];
    for (const [k,v] of Object.entries(c)) {
        if (!c.hasOwnProperty(k)) continue;
        if (k == "tag") continue;
        if (k.startsWith("_")) continue;
        if (Array.isArray(v)) {
            children.push(...getChildrenFromArray<T>(v));
        } else if (v instanceof Component) {
            children.push(v as T);
        } else if (v instanceof Object) {
            children.push(...getChildrenObj<T>(v));
        }
    }
    return children;
}

function getChildrenFromArray<T extends Component>(c: any[]): T[] {
    return c.filter(v => v instanceof Component);
}

function getChildrenObj<T extends Component>(c: Object): T[] {
    const children: T[] = [];
    for (const [k,v] of Object.entries(c)) {
        if (!c.hasOwnProperty(k)) continue;
        if (k == "tag") continue;
        if (k.startsWith("_")) continue;
        if (v instanceof Component) {
            children.push(v as T);
        }
    }
    return children;
}