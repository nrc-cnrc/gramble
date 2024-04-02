import { DEFAULT_MAX_CHARS, DEFAULT_MAX_RECURSION } from "./constants";
import { SILENT } from "./logging";
import { Dict } from "./func";

export const INDICES = {
    HIDE: 0,
    REPLACE: 0,
};

export interface Options {
    maxRecursion: number,
    maxChars: Dict<number> | number,
    priority: string[],
    verbose: number,
    optimizeAtomicity: boolean,
    directionLTR: boolean,
}

export const DEFAULT_OPTIONS: Options = {
    maxRecursion: DEFAULT_MAX_RECURSION, 
    maxChars: DEFAULT_MAX_CHARS,
    priority: [],
    verbose: SILENT,
    optimizeAtomicity: true,
    directionLTR: true,
}

export function Options(opt: Partial<Options> = {}): Options {
    return {...DEFAULT_OPTIONS, ...opt};
}

export class Env<T = any> {

    public opt: Options;

    constructor(
        opt: Partial<Options> = {}
    ) { 
        this.opt = Options(opt);
    }

    public update(t: T): Env<T> {
        return this;
    }

}
