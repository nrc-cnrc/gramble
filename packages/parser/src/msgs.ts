import { CellPos } from "./util";

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

    public localize(pos: CellPos): Msg {
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

export function Err(shortMsg: string, longMsg: string): Msg {
    return new Msg("error", shortMsg, longMsg);
}

export function Warn(longMsg: string): Msg {
    return new Msg("warning", "warning", longMsg);
}

export function Success(longMsg: string): Msg {
    return new Msg("info", "success", longMsg);
}
