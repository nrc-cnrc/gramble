import {
    Interpreter,
    SILENT,
    TextDevEnvironment
} from "@gramble/interpreter";

import { createWriteStream, existsSync } from "fs";
import { basename, dirname } from "path";
import { Writable } from "stream";


// Status code of an invalid usage invocation:
// See: man 3 sysexits
export const EXIT_USAGE = 64;
export const programName = "gramble";

export type StringDict = {[key: string]: string};

export function sourceFromFile(
    path: string, 
    verbose: number = SILENT
): Interpreter {
    const dir = dirname(path);
    const sheetName = basename(path, ".csv");
    const devEnv = new TextDevEnvironment(dir);
    const project = Interpreter.fromSheet(devEnv, sheetName, {verbose:verbose});
    return project;
}

/**
 * Parses a query string (e.g. "root:kan, subj:1SG") into a StringDict
 * for restricting the output of generation/sampling
 */
export function parseQuery(str: string): StringDict {
    const parts = splitOnSep(str, ",");
    const results: StringDict = {};
    for (const part of parts) {
        const [key, value] = splitOnSep(part, ":", 1);
        if (key === undefined || value === undefined) {
            usageError(
                "Query must consist of key:value pairs (e.g. \"text:ninapenda\").",
                "Separate multiple pairs by commas (e.g. \"root:pend,subj:1SG\")."
            );
        }
        results[key] = value;
    }
    return results;
}

/**
 * A convenience function for splitting on a one-char separator, without doing a regex split
 * with negative lookbehind.
 */
function splitOnSep(str: string, sep: string, max: number = Infinity): string[] {
    const results: string[] = [];
    let currentResult: string = "";
    let escaped: boolean = false; 
    let found: number = 0;

    for (const c of str) {

        if (escaped && c === sep) {
            currentResult = currentResult + c;
            escaped = false;
            continue;
        }

        if (escaped) {
            currentResult = currentResult + "\\" + c;
            escaped = false;
            continue;
        }

        if (c === sep) {
            // found one
            results.push(currentResult.trim());
            escaped = false;
            currentResult = "";
            found++;
            if (found > max) break;
            continue;
        }

        if (c === "\\") {
            escaped = true;
            continue;
        }
        
        currentResult = currentResult + c;
        escaped = false;
        continue;
    }

    if (currentResult.length > 0) {
        results.push(currentResult.trim());
    }

    return results;
}

export function getOutputStream(output: string | undefined): Writable {
  if (output == undefined) {
      return process.stdout;
  }
  return createWriteStream(output, "utf8");
}

export function fileExistsOrFail(filename: string) {
    if (filename == undefined) {
        usageError(`Must specify a filename`);
    }
    if (!existsSync(filename)) {
        usageError(`Cannot find file ${filename}`);
    }
}

export function usageError(...messages: any[]): never {
    let intro: string = `${programName}: Error: `;
    for (let message of messages) {
        console.error(`${intro}${message}`);
        intro = "";
    }
    process.exit(EXIT_USAGE);
}

export function usageWarn(...messages: string[]) {
    let intro: string = `${programName}: Warning: `;
    for (let message of messages) {
        console.warn(`${intro}${message}`);
        intro = "";
    }
}

type Gen<T> = Generator<T, void, undefined>;

export function generateToCSV(
    outputStream: Writable,    
    generator: Gen<StringDict>, 
    labels: string[],
    max: number = Infinity
): void {
    const replacer = (key: string, value:string | null) => value === null ? '' : value;
    outputStream.write(labels.join(",") + "\n");
    let count: number = 0;
    if (max == 0) return;
    for (const entry of generator) {
        const line = labels.map(label =>  JSON.stringify(entry[label], replacer));
        outputStream.write(line.join(",") + "\n");
        if (++count >= max) break;
    }
}

export function generateToJSON(
    outputStream: Writable,
    generator: Gen<StringDict>,
    max: number = Infinity
): void {
    outputStream.write("[\n");
    let firstLine = true;
    let count: number = 0;
    if (max > 0) {
        for (const entry of generator) {
            if (!firstLine) {
                outputStream.write(",\n");
            }
            firstLine = false;
            const line = JSON.stringify(entry);
            outputStream.write("  " + line);
            if (++count >= max) break;
        }
    }
    outputStream.write("\n]");
}
