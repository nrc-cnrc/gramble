import { Dict } from "../util";

/**
 * Namespace<T> is a convenience wrapper around Map<string, T> that
 * allows us to rename a given item statelessly.  This is used for Tapes
 * in particular.
 */
export class Namespace<T> {

    constructor(
        public entries: Dict<T> = {},
        public prev: Namespace<T> | undefined = undefined
    ) { }

    public get(key: string): T {
        const result = this.attemptGet(key);
        if (result != undefined) {
            return result;
        }
        throw new Error(`Cannot find ${key} in namespace, candidates: ${Object.keys(this.entries)}`);
    }

    public attemptGet(key: string): T | undefined {
        const result = this.entries[key];
        if (result == undefined && this.prev != undefined) {
            return this.prev.attemptGet(key);
        }
        return result;
    }

    public set(key: string, value: T): void {
        this.entries[key] = value;
    }

    public push(d: Dict<T>): Namespace<T> {
        return new Namespace<T>(d, this);
    }

    public rename(fromKey: string, toKey: string): Namespace<T> {
        if (fromKey == toKey) {
            return this;
        }
        const referent = this.attemptGet(fromKey);
        if (referent == undefined) {
            return this;
        }
        return this.push({[toKey]: referent});
    }

}