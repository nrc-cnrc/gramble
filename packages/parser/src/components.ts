import { Err, Msg, Msgs, result, Result, ResultVoid, Warn } from "./msgs";
import { Pass, PassEnv } from "./passes";
import { CellPos } from "./util";

export class CResult extends Result<Component> { }
export abstract class CPass extends Pass<Component,Component> {}

export abstract class Component {

    public get pos(): CellPos | undefined {
        return undefined;
    }   

    public abstract mapChildren(f: CPass, env: PassEnv): CResult;

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