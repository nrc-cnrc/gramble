#!/usr/bin/env ts-node-script

import {GTable, makeTable, TextProject, TextDevEnvironment} from "@gramble/gramble"
import {parse as papaparse, ParseResult} from 'papaparse';
import {createReadStream, createWriteStream, existsSync} from 'fs';

import {parse as filenameParse} from 'path';
import {Readable, Writable} from 'stream';

import {fromStream} from "./fileIO"

import * as commandLineArgs from "command-line-args";
import * as commandLineUsage from "command-line-usage";

// Status code of an invalid usage invocation:
// See: man 3 sysexits
const EXIT_USAGE = 64;

class NodeTextProject extends TextProject {

    private delim: string = "\t";

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
            this.addRow(data, filename, rownum);
        }
        for (const error of row.errors) {
            this.devEnv.markError(filename, rownum, -1, error.message, "error");
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
            const input = { [asTier] : line.trim() };
            const result = this.parse(input, symbolName, randomize, maxResults, true);
            const resultFlattened = this.flatten(result);
            this.writeToOutput(outputStream, resultFlattened, outputTier);
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
                if (token.startsWith('&') && token.endsWith(';')) {
                    outputStream.write(token + " ");
                    continue;
                }
                if (token[0] !== token[0].toLowerCase()) {
                    outputStream.write(token + " ");
                    continue;
                }
                const input = { [asTier] : token.trim() };
                const result = this.parse(input, symbolName, randomize, 1, true);
                const resultFlattened = this.flatten(result);
                const tierResults = resultFlattened.map((o) => o[outputTier]).join(" ");
                outputStream.write(tierResults + " ");
            }
            outputStream.write("\n");
        });
    }

    public generateStream(outputStream: Writable,
                            maxResults: number = -1,
                         outputTier: string | undefined = undefined,
                            symbolName: string = "MAIN"): void {
        const result = this.generate(symbolName, false, maxResults, true);
        const resultFlattened = this.flatten(result);
        this.writeToOutput(outputStream, resultFlattened, outputTier, "\n");
    }

    public sampleStream(outputStream: Writable,
                        maxResults: number = 1,
                        outputTier: string | undefined = undefined,
                        symbolName: string = "MAIN"): void {
        const result = this.sample(symbolName, maxResults, true);
        const resultFlattened = this.flatten(result);
        this.writeToOutput(outputStream, resultFlattened, outputTier, "\n");
    }

    public writeToOutput(outputStream: Writable, 
                        result: {[key: string]: string}[], 
                        outputTier: string | undefined = undefined, 
                        delim: string = ", ") {
        if (outputTier != undefined) {
            const tierResults = result.map((o) => o[outputTier]).join(delim);
            outputStream.write(tierResults + "\n");
        } else {
            outputStream.write(JSON.stringify(result) + "\n");
        }
    }
}

function fileExistsOrFail(filename: string) {
    if (!existsSync(filename)) {
        usageError(`Cannot find file ${filename}`);
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
    return createWriteStream(output, "utf8");
}

const proj = new NodeTextProject();

/* first - parse the main command */
const commandDefinition = [
    { name: 'command', defaultOption: true }
]
const command = commandLineArgs(commandDefinition, { stopAtFirstUnknown: true })
const argv = command._unknown || []
// TODO: determine from argv?
const programName = 'gramble';

interface Command {
    run(options: commandLineArgs.CommandLineOptions): void;
    synopsis: string | string[];
    options: commandLineArgs.OptionDefinition[] & commandLineUsage.OptionList;
}

const commands: {[name: string]: Command} = {
    help: {
        synopsis: `help [{underline command}]`,
        options: [{ name: 'command', defaultOption: true }],

        run(options) {
            if (options.command) {
                let command = commands[options.command]
                let optionList = command.options;
                let synopses;
                if (typeof command.synopsis == 'string') {
                    synopses = [command.synopsis]
                } else {
                    synopses = command.synopsis;
                }

                let hide = optionList.filter(n => n.defaultOption).map(o => o.name);
                let sections = [
                    { header: 'Synopsis', content: synopses.map(line => `${programName} ${line}`) },
                    { header: 'Options', optionList, hide }
                ];
                console.log(commandLineUsage(sections));
            } else {
                printUsage();
            }
        },
    },

    generate: {
        synopsis: `generate [--max={underline n}][--otier={underline tier}] [--output|-o {underline file}] {underline source}`,
        options: [
            {
                name: 'source',
                type: String,
                defaultOption: true,
            },
            {
                name: 'output',
                alias: "o",
                type: String,
                typeLabel: '{underline file}',
                description: 'write output to {underline file}',
            },
            {
                name: 'otier',
                type: String,
                typeLabel: '{underline tier}',
                description: 'only output {underline tier}, instead of JSON',
            },
            {
                name: 'max',
                alias: 'm',
                type: Number,
                defaultValue: -1,
                typeLabel: '{underline n}',
                description: 'generate at most {underline n} terms [default: unlimited]',
            },
        ],

        run(options: commandLineArgs.CommandLineOptions) {
            fileExistsOrFail(options.source);

            const outputStream = getOutputStream(options.output);
            proj.addFile(options.source)
                .then(() => proj.compile())
                .then(() => proj.devEnv.highlight())
                .then(() => proj.generateStream(outputStream, options.max, options.otier));
        }
    },

    sample: {
        synopsis: 'sample [--output|-o {underline file}] {underline source}',
        options: [
            {
                name: 'source',
                type: String,
                defaultOption: true,
            },
            {
                name: 'output',
                alias: "o",
                type: String,
                typeLabel: '{underline file}',
                description: 'write output to {underline file}',
            },
            {
                name: 'otier',
                type: String,
                typeLabel: '{underline tier}',
                description: 'only output {underline tier}, instead of JSON',
            },
            {
                name: 'max',
                alias: 'm',
                type: Number,
                defaultValue: -1,
                typeLabel: '{underline n}',
                description: 'restrict number of outputs for each word',
            }
        ],

        run(options) {
            fileExistsOrFail(options.source);
            const outputStream = getOutputStream(options.output);
            proj.addFile(options.source)
                .then(() => proj.compile())
                .then(() => proj.devEnv.highlight())
                .then(() => proj.sampleStream(outputStream, options.max, options.otier));
        }
    },

    parse: {
        synopsis: [
            'parse --itier={underline tier} [--otier={underline tier}] [--random] [--max={underline n}] {underline source}',
            'parse --tokenize --itier={underline tier} --otier={underline tier} [--random] {underline source}',
        ],
        options: [
            {
                name: 'source',
                type: String,
                defaultOption: true,
            },
            {
                name: 'input',
                alias: 'i',
                type: String,
                typeLabel: '{underline file}',
                description: 'read input from {underline file}',
            },
            {
                name: 'output',
                alias: "o",
                type: String,
                typeLabel: '{underline file}',
                description: 'write output to {underline file}',
            },
            {
                name: 'itier',
                type: String,
                typeLabel: '{underline tier}',
                description: 'what tier to match the input against (e.g., text, gloss, etc.)',
            },
            {
                name: 'otier',
                type: String,
                typeLabel: '{underline tier}',
                description: 'only output {underline tier}, instead of JSON',
            },
            {
                name: 'random',
                alias: 'r',
                type: Boolean,
                defaultValue: false,
                description: 'sample randomly from possible outputs',
            },
            {
                name: 'max',
                alias: 'm',
                type: Number,
                defaultValue: -1,
                description: 'restrict number of outputs for each word',
            },
            {
                name: 'tokenize',
                alias: 't',
                type: Boolean,
                defaultValue: false,
                description: 'parse lines as whitespace-separated tokens, rather than the whole line',
            }
        ],

        run(options) {
            fileExistsOrFail(options.source);

            const inputStream = getInputStream(options.input);
            const outputStream = getOutputStream(options.output);

            if (options.itier == undefined) {
                usageError("If you are parsing from a text file, you must specify what tier the text is on, e.g. --itier gloss");
            }

            if (options.tokenize) {
                if (options.otier == undefined) {
                    usageError("If you are parsing tokenized, you must specify what tier the output text should be taken from, e.g. --otier gloss")
                }
                proj.addFile(options.source)
                .then(() => proj.compile())
                .then(() => proj.devEnv.highlight())
                .then(() => proj.parseStreamTokenized(inputStream, outputStream, options.itier, options.random, options.otier));
            } else {
                proj.addFile(options.source)
                .then(() => proj.compile())
                .then(() => proj.devEnv.highlight())
                .then(() => proj.parseStream(inputStream, outputStream, options.itier, options.random, options.max, options.otier));
            }
        }
    }
};

const sections = [
    {
        header: programName,
        content: "the grammar table parser/generator/sampler"
    },
    {
        header: "Synopsis",
        content: [
            `$ ${programName} {underline command}`,
        ]
    },
    {
        header: "Commands",
        content: [
            { name: "generate", summary: "produces outputs from the grammar" },
            { name: "help", summary: "display this message and exit" },
            { name: "parse", summary: "attempt to parse input against the grammar" },
            { name: "sample", summary: "sample outputs from the grammar" },
        ]
    }
];

/* second - parse the generate command options */
if (command.command in commands) {
    const cmd = commands[command.command];
    const options = commandLineArgs(cmd.options, { argv })
    commands[command.command].run(options);
} else {
    console.error(`${programName}: invalid command: ${command.command}`);
    printUsage();
    process.exit(EXIT_USAGE);
}

function usageError(message: string): never {
    console.error(`${programName}: Error: ${message}`);
    process.exit(EXIT_USAGE);
}

function printUsage() {
    let usage = commandLineUsage(sections);
    console.log(usage);
}
