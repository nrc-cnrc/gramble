import { DevEnvironment, posToStr, SyntaxError, cellSplit, SimpleDevEnvironment } from "./devEnv";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

/**
 * TODO: Replace the naive CSV handling of cellSplit() with the robust
 * CSV parsing of papaparse.
 */
export class TextDevEnvironment extends SimpleDevEnvironment {

    constructor(
        public dirname: string 
    ) { 
        super();
    }

    protected errors: {[key: string]: SyntaxError[]} = {};

    public hasSource(sheet: string): boolean {
        if (super.hasSource(sheet)) {
            return true;
        }
        const path = join(this.dirname, sheet + ".csv");
        return existsSync(path);
    }

    public loadSource(sheet: string): string[][] {
        try {
            return super.loadSource(sheet);
        } catch {
            const path = join(this.dirname, sheet + ".csv");
            const text = readFileSync(path, 'utf8');
            return cellSplit(text);
        }
    }

    public alert(msg: string): void {
        console.log(msg);
    }
}
