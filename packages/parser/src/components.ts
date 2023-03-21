import { Err, Msg, Msgs, result, Result, Warn } from "./msgs";
import { Pass, PassEnv } from "./passes";
import { CellPos } from "./util";

export class CResult extends Result<Component> { }
export abstract class CPass extends Pass<Component,Component> {}

export abstract class Component {

    public get pos(): CellPos | undefined {
        return undefined;
    }   

    public abstract mapChildren(f: CPass, env: PassEnv): CResult;

    public msg(m: Msg | Msgs = []): CResult {
        return result(this).msg(m);
    }

    public err(shortMsg: string, longMsg: string): CResult {
        const e = Err(shortMsg, longMsg, this.pos);
        return this.msg(e);
    }
    
    public warn(longMsg: string): CResult {
        const e = Warn(longMsg, this.pos);
        return this.msg(e);
    }
}