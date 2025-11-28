import { Dict, Func } from "./func.js";
import { Pos } from "./cell.js";


export const enum Tag {
    Error = "error",
    Warning = "warning",
    Success = "success",
    Op = "op",
    Header = "header",
    Comment = "comment",
    Content = "content"
}

/**
 * Message is a communication between the compiler and 
 * the dev environment -- errors, unit test success and failure, 
 * etc.  
 * 
 * These need to have a relatively flat and simple interface 
 * because many implementations of DevEnvironment will be in vanilla
 * JavaScript.  DevEnvironment implementations need to be able to
 * just look up msg["row"] or whatever, not have to know about the 
 * class hierarchy and such.
 */
export abstract class Message {
    public abstract tag: Tag;

    constructor(
        public shortMsg: string = "",
        public longMsg: string = "",
        public pos: Pos | undefined = undefined
    ) {}

    public get sheet(): string | undefined {
        return this.pos?.sheet;
    }

    public get row(): number | undefined {
        return this.pos?.row;
    }

    public get col(): number | undefined {
        return this.pos?.col;
    }

    public localize(pos?: Pos): Message {
        if (this.pos != undefined) {
            return this;
        }
        this.pos = pos;
        return this;
    }
    
    /** 
     * This function provides a way to get rid of the messages
     * and only consider the item, by providing a callback that
     * handles them as a side effect.
     */
     public msgTo(f: Message[] | MsgCallback, pos?: Pos): void {
        const msg = this.localize(pos);
        if (Array.isArray(f)) {
            f.push(msg);
            return;
        }
        f(msg);
    }
};

export class Error extends Message {
    public readonly tag = Tag.Error;
}

export class Warning extends Message {
    public readonly tag = Tag.Warning;
}

export class Success extends Message {
    public readonly tag = Tag.Success;
}

export class MissingSymbolError extends Error {
    public readonly tag = Tag.Error;

    constructor(
        public symbol: string
    ) {
        super(`Undefined symbol: '${symbol}'`, 
            `'${symbol}' is a reference to a symbol that has not been defined.`)
    }
}

export class OpMsg extends Message  {
    public readonly tag = Tag.Op;
}

export class CommentMsg extends Message  {
    public readonly tag = Tag.Comment;
}

export class ContentMsg extends Message  {
    public readonly tag = Tag.Content;

    constructor(
        public color: string,
        public fontColor: string
    ) {
        super();
    }
}

export class HeaderMsg extends Message  {
    public readonly tag = Tag.Header;

    constructor(
        public color: string
    ) {
        super();
    }
}

export function Err(shortMsg: string, longMsg: string): Message {
    return new Error(shortMsg, longMsg);
}

export function Warn(longMsg: string): Message {
    return new Warning("warning", longMsg);
}

export function Succeed(longMsg: string): Message {
    return new Success("success", longMsg);
}

type MsgCallback = Func<Message, void>;
export type MsgFunc<T1,T2> = Func<T1,T2|Msg<T2>>;

export class Msg<T> {

    constructor(
        protected item: T,
        protected msgs: Message[] = []
    ) { }

    public destructure(): [T, Message[]] {
        return [this.item, this.msgs];
    }

    public ignoreMessages(): T {
        return this.item;
    }

    public bind<T2>(f: MsgFunc<T,T2>): Msg<T2> {
        try {
            let result = f(this.item);
            if (!(result instanceof Msg)) {
                result = new Msg(result);
            }
            return result.msg(this.msgs);
        } catch (e) {
            if (!(e instanceof Msg)) throw e;
            throw e.msg(this.msgs)
        }
    }

    public msg(m: Message | Message[] | MsgVoid = []): Msg<T> {
        if (m instanceof Msg) {
            return new Msg(this.item, this.msgs.concat(m.msgs));
        }
        return new Msg(this.item, this.msgs.concat(m));
    }

    public err(shortMsg: string, longMsg: string): Msg<T> {
        const e = Err(shortMsg, longMsg);
        return this.msg(e);
    }
    
    public warn(longMsg: string): Msg<T> {
        const e = Warn(longMsg);
        return this.msg(e);
    }

    public log(): Msg<T> {
        for (const msg of this.msgs) {
            console.log(msg);
        }
        return this;
    }

    public localize(pos: Pos | undefined): Msg<T> {
        const [item, msgs] = this.destructure();
        const newMessages: Message[] = msgs.map(m => m.localize(pos));
        return new Msg(item, newMessages);
    }

    /** 
     * This function provides a way to get rid of the messages
     * and only consider the item, by providing a callback that
     * handles them as a side effect.
     */
    public msgTo(f: Message[] | MsgCallback): T {
        if (Array.isArray(f)) {
            f.push(...this.msgs);
            return this.item;
        }

        for (const m of this.msgs) {
            f(m);
        }
        return this.item;
    }
}


export class MsgList<T> extends Msg<T[]> {

    constructor(
        items: T[],
        msgs: Message[] = []
    ) { 
        super(items, msgs);
    }

    public map<T2>(f: MsgFunc<T,T2>): MsgList<T2> {
        const items: T2[] = [];
        const msgs: Message[] = [];
        for (const item of this.item) {
            let result = f(item);
            if (!(result instanceof Msg)) {
                result = new Msg(result);
            }
            const [newItem,newMsgs] = result.destructure();
            items.push(newItem);
            msgs.push(...newMsgs);
        }
        return new MsgList(items, msgs);
    }
}

export class MsgDict<T> extends Msg<Dict<T>> {

    constructor(
        items: Dict<T>,
        msgs: Message[] = []
    ) { 
        super(items, msgs);
    }

    public map<T2>(f: MsgFunc<T,T2>): MsgDict<T2> {
        const items: Dict<T2> = {};
        const msgs: Message[] = [];
        for (const [k,v] of Object.entries(this.item)) {
            let newV = f(v);
            if (!(newV instanceof Msg)) {
                newV = new Msg(newV);
            }
            const [newItem,newMsgs] = newV.destructure();
            items[k] = newItem;
            msgs.push(...newMsgs);
        }
        return new MsgDict(items, msgs);
    }
}

export class MsgVoid extends Msg<void> {
    constructor(msgs: Message[] = []) { 
        super(void(0), msgs);
    }
}

export function msg<T>(
    item: T|Msg<T>
): Msg<T> {
    if (item instanceof Msg) {
        return item;
    }
    return new Msg(item);
}

export function msgList<T>(xs: (T|Msg<T>)[]): MsgList<T> {
    const msgs: Message[] = [];
    const items: T[] = [];
    for (const x of xs) {
        if (!(x instanceof Msg)) {
            items.push(x);
            continue;
        }
        const item = x.msgTo(msgs);
        items.push(item);
    }
    return new MsgList(items, msgs);
}

export function msgDict<T>(items: Dict<T>): MsgDict<T> {
    return new MsgDict(items);
}

export const unit = new MsgVoid();

export function THROWER(m: Message): void {
    throw m;
}
