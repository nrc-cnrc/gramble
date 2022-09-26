import { CellPos, Positioned } from "./util";

type MsgType = "error" | "warning" | "info" | 
                "command" | "header" | "comment" | "content"

/**
 * Msg ("message") is a communication between the compiler and 
 * the dev environment -- errors, unit test success and failure, 
 * etc.  
 * 
 * These need to have a relatively flat and simple interface 
 * because many implementations of DevEnvironment will be in vanilla
 * JavaScript.  DevEnvironment implementations need to be able to
 * just look up msg["row"] or whatever, not have to know about the 
 * class hierarchy and such.
 */
export class Msg {

    constructor(
        public type: MsgType,
        public shortMsg: string,
        public longMsg: string,
        public pos: CellPos | undefined = undefined
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

    public localize(pos?: CellPos): Msg {
        if (this.pos != undefined) {
            return this;
        }
        this.pos = pos;
        return this;
    }

};

export type Msgs = Msg[];

export class MissingSymbolError extends Msg {
    constructor(
        public symbol: string
    ) {
        super("error", "Undefined symbol", 
            `Undefined symbol: ${symbol}`)
    }
}

export class CommandMsg extends Msg  {
    constructor() {
        super("command", "", "");
    }
}

export class CommentMsg extends Msg  {
    constructor() {
        super("comment", "", "");
    }
}

export class ContentMsg extends Msg  {
    constructor(
        color: string,
        fontColor: string
    ) {
        super("content", "", "");
    }
}

export class HeaderMsg extends Msg  {
    constructor(
        public color: string
    ) {
        super("header", "", "");
    }
}

export function Err(shortMsg: string, longMsg: string, pos?: CellPos): Msg {
    return new Msg("error", shortMsg, longMsg, pos);
}

export function Warn(longMsg: string, pos?: CellPos): Msg {
    return new Msg("warning", "warning", longMsg, pos);
}

export function Success(longMsg: string, pos?: CellPos): Msg {
    return new Msg("info", "success", longMsg, pos);
}

function isPositioned(p: any): p is Positioned {
    return p.pos !== undefined;
}

export type Func<T1,T2> = (input: T1) => (T2|Result<T2>);

export class Result<T> {

    constructor(
        protected item: T,
        protected msgs: Msgs = []
    ) { }

    public destructure(): [T, Msgs] {
        return [this.item, this.msgs];
    }

    public bind<T2>(f: Func<T,T2>): Result<T2> {
        let result = f(this.item);
        if (!(result instanceof Result)) {
            result = new Result(result);
        }
        return result.msg(this.msgs);
    }

    public msg(ms: Msgs): Result<T> {
        return new Result(this.item, this.msgs.concat(ms));
    }

    public err(shortMsg: string, longMsg: string): Result<T> {
        const e = Err(shortMsg, longMsg);
        if (isPositioned(this.item)) {
            return this.msg([e.localize(this.item.pos)]);
        }
        return this.msg([e]);
    }
    
    public warn(longMsg: string): Result<T> {
        const e = Warn(longMsg);
        if (isPositioned(this.item)) {
            return this.msg([e.localize(this.item.pos)]);
        }
        return this.msg([e]);
    }

    public log(): Result<T> {
        for (const msg of this.msgs) {
            console.log(msg);
        }
        return this;
    }

    public localize(pos: CellPos): Result<T> {
        const [item, msgs] = this.destructure();
        const newMsgs = msgs.map(m => m.localize(pos));
        return new Result(item, newMsgs);
    }
}

export class ResultList<T> extends Result<T[]> {

    constructor(
        items: T[],
        msgs: Msgs = []
    ) { 
        super(items, msgs);
    }

    public map<T2>(f: Func<T,T2>): ResultList<T2> {
        const items: T2[] = [];
        const msgs: Msgs = [];
        for (const item of this.item) {
            let result = f(item);
            if (!(result instanceof Result)) {
                result = new Result(result);
            }
            const [newItem,newMsgs] = result.destructure();
            items.push(newItem);
            msgs.push(...newMsgs);
        }
        return new ResultList(items, msgs);
    }
}

export function resultList<T>(items: T[]): ResultList<T> {
    return new ResultList(items);
}