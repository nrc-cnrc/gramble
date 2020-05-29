import {GTable, makeTable, flattenToJSON, getTierAsString, Project, TextDevEnvironment} from "@gramble/gramble"
import {parse as papaparse, ParseResult} from 'papaparse';
import {createReadStream, createWriteStream, existsSync} from 'fs';

import {parse as filenameParse} from 'path';
import {Readable, Writable} from 'stream';

import {fromStream} from "./fileIO"

import * as commandLineArgs from "command-line-args";
import * as commandLineUsage from "command-line-usage";

class TextProject extends Project {

    private delim: string = "\t";

    public constructor(
        protected env: TextDevEnvironment
    ) {
        super();
    }

    public addFile(filename: string): Promise<void> { 

        if (filenameParse(filename).ext.toLowerCase() == ".csv") {
            this.delim = ",";
        }
        const readStream = createReadStream(filename, "utf8");
        const basename = filenameParse(filename).name
        return fromStream(readStream,
            (error, l, rownum) => this.addText(l, rownum, basename))
    }

    public addText(text: string, rownum: number, filename: string) {
        papaparse(text, { delimiter: this.delim, 
            complete: (line) => this.addParsedRow(line, rownum, filename)
        });
    }

    public addParsedRow(row: ParseResult, rownum: number, filename: string) {
        for (const data of row.data as string[][]) {  // should always only be one of these
            this.addRow(data, filename, rownum, this.env);
        }
        for (const error of row.errors) {
            this.env.markError(filename, rownum, -1, error.message, "error");
        }
    }

    public parseStream(inputStream: Readable, 
                        outputStream: Writable,
                        asTier: string, 
                        randomize: boolean = false,
                        maxResults: number = -1, 
                        outputTier: string | undefined = undefined,
                        symbolName: string = "MAIN"): Promise<void> {

        return fromStream(inputStream, (error: Error | any, line: string, rownum: number) => {
            const input: GTable = makeTable([[[asTier, line.trim()]]]);
            const result = super.parse(symbolName, input, randomize, maxResults);
            this.writeToOutput(outputStream, result, outputTier);
        });
    }

    public parseStreamTokenized(inputStream: Readable, 
        outputStream: Writable,
        asTier: string, 
        randomize: boolean = false,
        outputTier: string,
        symbolName: string = "MAIN"): Promise<void> {

        return fromStream(inputStream, (error: Error | any, line: string, rownum: number) => {
            for (const token of line.split(" ")) {
                const input: GTable = makeTable([[[asTier, token.trim()]]]);
                const result = super.parse(symbolName, input, randomize, 1);
                outputStream.write(getTierAsString(result, outputTier) + " ");
            }
            outputStream.write("\n");
        });
    }

    public generateStream(outputStream: Writable, 
                            maxResults: number = -1,
                         outputTier: string | undefined = undefined,
                            symbolName: string = "MAIN"): void {
        const result = super.generate(symbolName, false, maxResults);
        this.writeToOutput(outputStream, result, outputTier, "\n");
    }
    
    public sampleStream(outputStream: Writable, 
                        maxResults: number = 1,
                        outputTier: string | undefined = undefined,
                        symbolName: string = "MAIN"): void {
        const result = super.sample(symbolName, maxResults);
        this.writeToOutput(outputStream, result, outputTier, "\n");
    }

    public writeToOutput(outputStream: Writable, result: GTable, outputTier: string | undefined = undefined, delim: string = ", ") {
        if (outputTier != undefined) {
            outputStream.write(getTierAsString(result, outputTier, delim) + "\n");
        } else {
            outputStream.write(flattenToJSON(result) + "\n");
        }
    }
}

function fileExistsOrFail(filename: string) {
    if (!existsSync(filename)) {
        console.error(`Error: Cannot find file ${filename}`);
        process.exit(1);
    }
}

function getInputStream(input: string | undefined): Readable {
    if (input == undefined) {
        return process.stdin;
    }
    fileExistsOrFail(input);
    return createReadStream(input, "utf8");
}

function getOutputStream(output: string | undefined): Writable {
    if (output == undefined) {
        return process.stdout;
    }
    fileExistsOrFail(output);
    return createWriteStream(output, "utf8");
}

const env = new TextDevEnvironment();
const proj = new TextProject(env);

/* first - parse the main command */
const commandDefinition = [
    { name: 'command', defaultOption: true }
]
const command = commandLineArgs(commandDefinition, { stopAtFirstUnknown: true })
const argv = command._unknown || []


/* second - parse the generate command options */
if (command.command === 'generate') {

    const definitions = [
      { name: 'source', defaultOption: true, type: String },
      { name: 'output', alias: "o", type: String },
      { name: 'otier', type: String },
      { name: 'max', alias: 'm', type: Number, defaultValue: -1 }
    ]
    const options = commandLineArgs(definitions, { argv })
    fileExistsOrFail(options.source);
    const outputStream = getOutputStream(options.output);
    proj.addFile(options.source)
        .then(() => env.highlight())
        .then(() => proj.generateStream(outputStream, options.max, options.otier));

} else if (command.command === 'sample') {

    const definitions = [
      { name: 'source', defaultOption: true, type: String },
      { name: 'output', alias: "o", type: String },
      { name: 'otier', type: String },
      { name: 'max', alias: 'm', type: Number, defaultValue: -1 }
    ]
    const options = commandLineArgs(definitions, { argv })
    fileExistsOrFail(options.source);
    const outputStream = getOutputStream(options.output);
    proj.addFile(options.source)
        .then(() => env.highlight())
        .then(() => proj.sampleStream(outputStream, options.max, options.otier));
} else if (command.command === 'parse') {

    const definitions = [
        { name: 'source', defaultOption: true, type: String },
        { name: 'input', alias: 'i', type: String },
        { name: 'output', alias: "o", type: String },
        { name: 'itier', type: String },
        { name: 'otier', type: String },
        { name: 'random', alias: 'r', type: Boolean, defaultValue: false },
        { name: 'max', alias: 'm', type: Number, defaultValue: -1 },
        { name: 'tokenize', alias: 't', type: Boolean, defaultValue: false }
    ]
    const options = commandLineArgs(definitions, { argv });
    fileExistsOrFail(options.source);

    const inputStream = getInputStream(options.input);
    const outputStream = getOutputStream(options.output);

    if (options.itier == undefined) {
        console.error("Error: If you are parsing from a text file, you must specify what tier the text is on, e.g. --itier gloss")
        process.exit(1);
    } 
    if (options.tokenize) {
        if (options.otier == undefined) {
            console.error("Error: If you are parsing tokenized, you must specify what tier the output text should be taken from, e.g. --otier gloss")
            process.exit(1);
        }
        proj.addFile(options.source)
        .then(() => env.highlight())
        .then(() => proj.parseStreamTokenized(inputStream, outputStream, options.itier, options.random, options.otier));      
    } else {
        proj.addFile(options.source)
        .then(() => env.highlight())
        .then(() => proj.parseStream(inputStream, outputStream, options.itier, options.random, options.max, options.otier));
    }
}



/*

const options = commandLineArgs([
    { name: 'source', defaultOption: true, type: String },
    { name: 'input', alias: 'i', type: String },
    { name: 'output', alias: "o", type: String },
    { name: 'itier', type: String },
    { name: 'otier', type: String },
    { name: 'random', alias: 'r', type: Boolean, defaultValue: false },
    { name: 'max', alias: 'm', type: Number, defaultValue: -1 },
    { name: 'tokenize', alias: 't', type: Boolean, defaultValue: false }
])


if (options.command == undefined) {
    console.error("Error: At least one command and source file must be provided");
    process.exit(1);
}

if (options.command )
              
fileExistsOrFail(options.source);

var inputStream : Readable = process.stdin;
if ("input" in options) {
    fileExistsOrFail(options.input);
    inputStream = createReadStream(options.input, "utf8");
} 

var outputStream : Writable = process.stdout;
if ("output" in options) { 
    fileExistsOrFail(options.output);
    createWriteStream(options.output, "utf8");
}

if (options.generate) {
    proj.addFile(options.source)
        .then(() => env.highlight())
        .then(() => proj.generateStream(outputStream, options.otier));
} else if (options.sample) {
    if (options.max == -1) {
        options.max = 1;
    }
    proj.addFile(options.source)
    .then(() => env.highlight())
    .then(() => proj.sampleStream(outputStream, options.max, options.otier));
} else {
    if (options.itier == undefined) {
        console.error("Error: If you are parsing from a text file, you must specify what tier the text is on, e.g. --itier gloss")
        process.exit(1);
    } 
    const inputTier : string = options.itier;
    if (options.tokenize) {
        if (options.otier == undefined) {
            console.error("Error: If you are parsing tokenized, you must specify what tier the output text should be taken from, e.g. --otier gloss")
            process.exit(1);
        }
        proj.addFile(options.source)
        .then(() => env.highlight())
        .then(() => proj.parseStreamTokenized(inputStream, outputStream, inputTier, options.random, options.otier));      
    } else {
        proj.addFile(options.source)
        .then(() => env.highlight())
        .then(() => proj.parseStream(inputStream, outputStream, inputTier, options.random, options.max, options.otier));
    }
}

*/