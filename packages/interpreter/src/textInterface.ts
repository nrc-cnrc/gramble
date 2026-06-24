import { readFileSync, existsSync } from "fs";
import { join } from "path";

import { SimpleDevEnvironment } from "./devEnv.js";
import * as Messages from "./utils/msgs.js";
import { Options } from "./utils/options.js";
import { parseCSV } from "./utils/strings.js";

export class TextDevEnvironment extends SimpleDevEnvironment {

    constructor(
        public dirname: string,
        opt: Partial<Options>
    ) { 
        super(opt);
    }

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
            return parseCSV(text);
        }
    }

    public alert(msg: string): void {
        console.log(msg);
    }
}

// TestTextDevEnvironment tracks test execution messages as well as Error and
// Warning messages.
export class TestTextDevEnvironment extends TextDevEnvironment {

    constructor(
        public dirname: string,
        opt: Partial<Options>
    ) { 
        super(dirname, opt);
    }

    public message(msg: any): void {
        switch (msg.tag) {
            case Messages.Tag.Error:        return this.markNote(msg);
            case Messages.Tag.Warning:      return this.markNote(msg);
            case Messages.Tag.TestFailed:   return this.markNote(msg);
            case Messages.Tag.TestPassed:   return this.markNote(msg);
            case Messages.Tag.TestSkipped:  return this.markNote(msg);
        }
    }
}
