#!/usr/bin/env ts-node-script

import { 
    SILENT, 
    timeIt,
    VERBOSE_TIME,
    VERBOSE_STATES
} from "@gramble/interpreter";
import { parse } from "path";
import * as commandLineArgs from "command-line-args";
import * as commandLineUsage from "command-line-usage";
import { EXIT_USAGE, fileExistsOrFail, generateToCSV, generateToJSON, getOutputStream, parseQuery, programName, sheetFromSymbol, StringDict } from "./util";
import { StringDecoder } from "string_decoder";


/* first - parse the main command */
const commandDefinition = [{ name: "command", defaultOption: true }];
const command = commandLineArgs(commandDefinition, {
    stopAtFirstUnknown: true,
});
const argv = command._unknown || [];

interface Command {
  run(options: commandLineArgs.CommandLineOptions): void;
  synopsis: string | string[];
  options: (commandLineArgs.OptionDefinition & commandLineUsage.OptionDefinition)[];
}


const commands: { [name: string]: Command } = {
    help: {
        synopsis: `help [{underline command}]`,
        options: [{ name: "command", defaultOption: true }],

        run(options) {
            if (options.command) {
                let command = commands[options.command];
                let optionList = command.options;
                let synopses;
                if (typeof command.synopsis == "string") {
                    synopses = [command.synopsis];
                } else {
                    synopses = command.synopsis;
                }

                let hide = optionList.filter((n) => n.defaultOption).map((o) => o.name);
                let sections = [
                    {
                        header: "Synopsis",
                        content: synopses.map((line) => `${programName} ${line}`),
                    },
                    { header: "Options", optionList, hide },
                ];
                console.log(commandLineUsage(sections));
            } else {
                printUsage();
            }
        },
    },

    generate: {
        synopsis: "generate [--symbol|-s {underline name}] [--format|-f {underline csv|json}] " + 
                  "[--max|-m {underline n}] [--output|-o {underline file}] {underline source}",
        options: [
            {
                name: "source",
                type: String,
                defaultOption: true,
            },
            {
                name: "symbol",
                alias: "s",
                type: String,
                defaultValue: "all",
                typeLabel: "{underline name}",
                description: "symbol to start generation. Defaults to 'all', the default symbol",
            },
            {
                name: "output",
                alias: "o",
                type: String,
                typeLabel: "{underline file}",
                description: "write output to {underline file}",
            },
            {
                name: "format",
                alias: "f",
                type: String,
                typeLabel: "csv|json",
                defaultValue: "csv",
                description: "write output in CSV or JSON formats",
            },
            {
                name: "max",
                alias: "m",
                type: Number,
                defaultValue: Infinity,
                typeLabel: "{underline n}",
                description:
                "generate at most {underline n} terms [default: unlimited]",
            },
            {
                name: "verbose",
                alias: "v",
                type: Boolean,
                defaultValue: false,
                description:
                "log error and info messages",
            },            
            {
                name: "query",
                alias: "q",
                type: String,
                defaultValue: "",
                typeLabel: "{underline string}",
                description: "Query as key:value pairs, joined by commas, e.g. {underline \"root:kan,subj:1SG\"}"
            }
        ],

        run(options: commandLineArgs.CommandLineOptions) {
            fileExistsOrFail(options.source);

            if (options.symbol.trim().length == 0) {
                const filename = parse(options.source).name  
                options.symbol = filename + ".All";
            }

            const outputStream = getOutputStream(options.output);
            const timeVerbose = (options.verbose) ? VERBOSE_TIME|VERBOSE_STATES : SILENT;
            const interpreter = sheetFromSymbol(options.source, timeVerbose);

            if (options.verbose) {
                //interpreter.runChecks();
                interpreter.devEnv.logErrors();
            }

            let query: StringDict = parseQuery(options.query);

            const labels = interpreter.getTapeNames(options.symbol);
            const generator = interpreter.generateStream(options.symbol, query);
            timeIt(() => {
                if (options.format.toLowerCase() == 'csv') {
                    generateToCSV(outputStream, generator, labels);
                } else {
                    generateToJSON(outputStream, generator);
                }
            }, options.verbose, "Generation complete", "Starting generation");
        },
    },

    sample: {
        synopsis: "sample [--symbol|-s {underline name}] [--format|-f {underline csv|json}] " +
                  "[--num|-n {underline n}] [--output|-o {underline file}] {underline source}`",
        options: [
            {
                name: "source",
                type: String,
                defaultOption: true,
            },
            {
                name: "symbol",
                alias: "s",
                type: String,
                defaultValue: "all",
                typeLabel: "{underline name}",
                description: "symbol to start generation. Defaults to 'all', the default symbol",
            },
            {
                name: "output",
                alias: "o",
                type: String,
                typeLabel: "{underline file}",
                description: "write output to {underline file}",
            },        
            {
                name: "format",
                alias: "f",
                type: String,
                typeLabel: "csv|json",
                defaultValue: "csv",
                description: "write output in CSV or JSON formats",
            },
            {
                name: "num",
                alias: "n",
                type: Number,
                defaultValue: 5,
                typeLabel: "{underline n}",
                description: "sample {underline n} terms [default: 5]",
            },        
            {
                name: "verbose",
                alias: "v",
                type: Boolean,
                defaultValue: false,
                description:
                "log error and info messages",
            },
            {
                name: "query",
                alias: "q",
                type: String,
                defaultValue: "",
                typeLabel: "{underline string}",
                description: "Query as key:value pairs, joined by commas, e.g. {underline \"root:kan,subj:1SG\"}"
            }
        ],

        run(options: commandLineArgs.CommandLineOptions) {
            fileExistsOrFail(options.source);

            if (options.symbol.trim().length == 0) {
                const filename = parse(options.source).name  
                options.symbol = filename + ".All";
            }

            const outputStream = getOutputStream(options.output);
            const timeVerbose = (options.verbose) ? VERBOSE_TIME|VERBOSE_STATES : SILENT;
            const interpreter = sheetFromSymbol(options.source, timeVerbose);

            if (options.verbose) {
                //interpreter.runChecks();
                interpreter.devEnv.logErrors();
            }
            
            let query: StringDict = parseQuery(options.query);

            const labels = interpreter.getTapeNames(options.symbol);
            const generator = interpreter.sampleStream(options.symbol, options.num, query);
            timeIt(() => {
                if (options.format.toLowerCase() == 'csv') {
                    generateToCSV(outputStream, generator, labels);
                } else {
                    generateToJSON(outputStream, generator);
                }
            }, options.verbose, "Sampling commplete", "Started sampling");
        },
    },
};

const sections = [
    {
        header: programName,
        content: "the grammar table generator/sampler",
    },
    {
        header: "Synopsis",
        content: [`$ ${programName} {underline command}`],
    },
    {
        header: "Commands",
        content: [
            { name: "generate", summary: "produces outputs from the grammar" },
            { name: "sample", summary: "sample outputs from the grammar" },
            { name: "help", summary: "display this message and exit" },
            { name: "help {underline command}", summary: "get help on a specific command" },
        ],
    },
];

export function printUsage() {
    let usage = commandLineUsage(sections);
    console.log(usage);
}

/* second - parse the generate command options */
if (command.command in commands) {
    try {    
        const cmd = commands[command.command];
        const options = commandLineArgs(cmd.options, { argv });
        commands[command.command].run(options);
    } catch (e) {
        const msg = (e instanceof Error) ? e.message : String(e);
        console.error(`${programName}: unknown ${command.command} option: ${msg}`);
        console.error(`For usage info, try: ${programName} help ${command.command}`);
    }
} else {
    console.error(`${programName}: unknown command: ${command.command}`);
    printUsage();
    process.exit(EXIT_USAGE);
}