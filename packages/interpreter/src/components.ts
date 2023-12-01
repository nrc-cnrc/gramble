import { 
    Err, Warn, 
    Message, 
    msg, Msg, 
    MsgVoid,
    MsgFunc
} from "./utils/msgs";
import { Pass, PassEnv } from "./passes";
import { Dict, update } from "./utils/func";
import { Pos } from "./utils/cell";

export abstract class Component {
    public abstract readonly tag: string;

    public pos: Pos | undefined = undefined;

    public mapChildren(f: Pass<Component,Component>, env: PassEnv): Msg<Component> {
        const clone = Object.create(Object.getPrototypeOf(this));
        const msgs: Message[] = [];
        for (const [k, v] of Object.entries(this)) {
            clone[k] = mapChildrenAny(v, f, env).msgTo(msgs);
        }
        const newMessage: Message[] = msgs.map(m => m.localize(this.pos));
        return clone.msg(newMessage);
    }

    public msg(m: Message | Message[] | MsgVoid = []): Msg<this> {
        return msg(this).msg(m);
    }

    public err(shortMsg: string, longMsg: string): Msg<this> {
        const e = Err(shortMsg, longMsg);
        return this.msg(e);
    }
    
    public warn(longMsg: string): Msg<this> {
        const e = Warn(longMsg);
        return this.msg(e);
    }

    public locate(pos: Pos | undefined): Component {
        if (pos === undefined) return this;
        if (this.pos !== undefined) return this;
        return update(this, { pos: pos });
    }
}

export function mapChildrenAny<T extends Component>(x: any, f: Pass<T,T>, env: PassEnv): Msg<any> {
    if (x instanceof Component) {
        return f.transform(x as T, env);
    } else if (Array.isArray(x)) {
        return mapChildrenArray(x, f, env);
    } else if (x instanceof Set) {
        return mapChildrenSet(x, f, env);
    } else if (x instanceof Object) {
        return mapChildrenObj(x, f, env);
    } else {
        return msg(x);
    }
}

export function mapChildrenSet<T extends Component>(xs: Set<any>, f: Pass<T,T>, env: PassEnv): Msg<Set<any>> {
    const results: Set<any> = new Set();
    const msgs: Message[] = [];
    for (const x of xs) {
        const newX = mapChildrenAny(x, f, env).msgTo(msgs);
        results.add(newX);
    }
    return msg(results).msg(msgs);
}

export function mapChildrenArray<T extends Component>(xs: any[], f: Pass<T,T>, env: PassEnv): Msg<any[]> {
    const results: any[] = [];
    const msgs: Message[] = [];
    for (const x of xs) {
        const newX = mapChildrenAny(x, f, env).msgTo(msgs);
        results.push(newX);
    }
    return msg(results).msg(msgs);
}

export function mapChildrenObj<T extends Component>(x: any, f: Pass<T,T>, env: PassEnv): Msg<Dict<any>> {
    const results: Dict<any> = Object.create(Object.getPrototypeOf(x));
    const msgs: Message[] = [];
    for (const [k, v] of Object.entries(x)) {
        const newX = mapChildrenAny(v, f, env).msgTo(msgs);
        results[k] = newX;
    }
    return msg(results).msg(msgs);
}

/// GETTING CHILDREN

export function getChildren<T extends Component>(c: T): T[] {
    const children: T[] = [];
    for (const [k,v] of Object.entries(c)) {
        if (k == "tag") continue;
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
        if (v instanceof Component) {
            children.push(v as T);
        }
    }
    return children;
}