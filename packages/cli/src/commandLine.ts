#!/usr/bin/env ts-node-script

import { Message } from "@gramble/interpreter";

import commandLineArgs from "command-line-args";
import commandLineUsage from "command-line-usage";
import { Console } from "console";
import process from "process";

import {
    runGenerateOrSampleCmd,
    runListCmd,
    runTestCmd,
} from "./runCmd.js";
import { programName, usageError } from "./util.js";

type OptionDefinition = commandLineArgs.OptionDefinition & commandLineUsage.OptionDefinition;
interface Command {
  synopsis: string | string[];
  options: OptionDefinition[];
  run(options: commandLineArgs.CommandLineOptions): void;
}

const commonGenerateSampleOptions: OptionDefinition[] = [
    {
        name: "source",
        type: String,
        defaultOption: true,
        description: "Gramble source file in CSV format",
    },
    {
        name: "symbol",
        alias: "s",
        type: String,
        defaultValue: "all",
        typeLabel: "{underline name}",
        description: "symbol to start generation " +
                     "[default: 'all', the default symbol]",
    },
    {
        name: "format",
        alias: "f",
        type: String,
        typeLabel: "csv|json",
        defaultValue: "csv",
        description: "write output in CSV or JSON formats " +
                     "[default: csv]",
    },
    {
        name: "output",
        alias: "o",
        type: String,
        typeLabel: "{underline file}",
        description: "write output to {underline file}",
    },
    {
        name: "query",
        alias: "q",
        type: String,
        defaultValue: "",
        typeLabel: "{underline string}",
        description: "query as key:value pairs, joined by commas, " +
                     "e.g. \"root:kan,subj:1SG\"",
    },
    {
        name: "strict",
        alias: "S",
        type: Boolean,
        defaultValue: false,
        description: "strict mode: treat Gramble warnings in the source as errors",
    },
    {
        name: "force",
        alias: "F",
        type: Boolean,
        defaultValue: false,
        description: "generate/sample even if there are Gramble errors in the source",
    },
    {
        name: "verbose",
        alias: "v",
        type: Boolean,
        defaultValue: false,
        description: "log more detailed info messages",
    },            
];

const commonGenerateSampleOptions_str = "[--symbol|-s {underline name}] " +
    "[--format|-f {underline csv|json}] [--output|-o {underline file}] " +
    "[--query|-q {underline string}] [--strict|-S] [--force|-F] [--verbose|-v] " +
    "{underline source}";


const commands: { [name: string]: Command } = {
    help: {
        synopsis: `help [{underline command}]`,
        options: [
            {
                name: "command",
                defaultOption: true
            }
        ],

        run(options: commandLineArgs.CommandLineOptions) {
            runHelpCmd(options);
        },
    },

    generate: {
        synopsis: `generate [--max|-m {underline n}] ${commonGenerateSampleOptions_str}`,
        options: [
            {
                name: "max",
                alias: "m",
                type: Number,
                defaultValue: Infinity,
                typeLabel: "{underline n}",
                description: "generate at most {underline n} terms " +
                             "[default: unlimited]",
            },
            ...commonGenerateSampleOptions
        ],

        run(options: commandLineArgs.CommandLineOptions) {
            runGenerateOrSampleCmd(options);
        },
    },

    sample: {
        synopsis: "sample [--num|-n {underline n}] [--seed [{underline string}]] " + 
                  `${commonGenerateSampleOptions_str}`,
        options: [ 
            {
                name: "num",
                alias: "n",
                type: Number,
                defaultValue: 5,
                typeLabel: "{underline n}",
                description: "sample {underline n} terms [default: 5]",
            },        
            {
                name: "seed",
                type: String,
                typeLabel: "[{underline string}]",
                description: "use a PRNG initialized with seed {underline string} " +
                             "[default: no seeded PRNG; --seed default: 'Seed-2024']",
            },        
            ...commonGenerateSampleOptions
        ],

        run(options: commandLineArgs.CommandLineOptions) {
            runGenerateOrSampleCmd(options, true);
        },
    },

    list: {
        synopsis: `list [--symbols|-s] [--errors|-e] [--all|-a] {underline source}`,
        options: [
            {
                name: "source",
                type: String,
                defaultOption: true,
                description: "Gramble source file in CSV format",
            },
            {
                name: "symbols",
                alias: "s",
                type: Boolean,
                defaultValue: false,
                description: "list all symbols",
            },            
            {
                name: "errors",
                alias: "e",
                type: Boolean,
                defaultValue: false,
                description: "list all compilation errors and warnings",
            },            
            {
                name: "all",
                alias: "a",
                type: Boolean,
                defaultValue: false,
                description: "list all: equivalent of '--symbols --errors'. [Default]",
            },            
        ],

        run(options: commandLineArgs.CommandLineOptions) {
            runListCmd(options);
        },
    },

    test: {
        synopsis: `test [--symbol|-s {underline name}] {underline source}`,
        options: [
            {
                name: "source",
                type: String,
                defaultOption: true,
                description: "Gramble source file in CSV format",
            },
            {
                name: "symbol",
                alias: "s",
                type: String,
                defaultValue: "all",
                typeLabel: "{underline name}",
                description: "symbol to run tests for " +
                            "[default: 'all', the default symbol]",
            },
            {
                name: "debug",
                alias: "d",
                type: Boolean,
                defaultValue: false,
                description: "turn on VERBOSE_DEBUG",
            },            
        ],

        run(options: commandLineArgs.CommandLineOptions) {
            runTestCmd(options);
        },
    },
};

const overviewSections = [
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
            { name: "list", summary: "list info about a grammar" },
            { name: "test", summary: "run unit tests for a grammar" },
        ],
    },
];

function usage(sections: commandLineUsage.Section[]  = overviewSections): string {
    return commandLineUsage(sections);
}

export function printUsage(
    sections: commandLineUsage.Section[] | undefined = undefined, 
    error: boolean = false
) {
    const logger = error ? console.error : console.log;
    logger(sections ? usage(sections) : usage());
}

function runHelpCmd(
    options: commandLineArgs.CommandLineOptions,
) {
    const command = commands[options.command];
    if (! command) {
        if (options.command) {
            usageError(`Unknown command: ${options.command}`, usage());             
        }
        printUsage();
        return;
    }

    const optionList = command.options;
    const synopses = (typeof command.synopsis == "string") ? 
                    [command.synopsis] : command.synopsis
    const sections = [
        {
            header: "Synopsis",
            content: synopses.map((line) => `${programName} ${line}`),
        },
        {
            header: "Options",
            optionList,
            hide: optionList.filter((n) => n.defaultOption).map((o) => o.name),
        },
    ];
    printUsage(sections);
}


/* First - some housekeeping... */
// Create a new Console instance where stdout is process.stderr
console = new Console(process.stderr);

/* Second - parse the main command */
const commandDefinition: commandLineArgs.OptionDefinition[] = [
    {
        name: "command",
        defaultOption: true,
    }
];
const commandOptions: commandLineArgs.ParseOptions = {
    stopAtFirstUnknown: true,
}
const command = commandLineArgs(commandDefinition, commandOptions);
const argv = command._unknown || [];

/* Third - parse the command options */
if (command.command in commands) {
    try {    
        const cmd: Command = commands[command.command];
        const options = commandLineArgs(cmd.options, { argv });
        cmd.run(options);
    } catch (e) {
        const msg = e instanceof Error ?
                    e.message : e instanceof Message ? e.longMsg : "";
        usageError(
            `Error in ${command.command} command:`,
            msg ? msg : e,
            `For usage info, try: ${programName} help ${command.command}`
        );
    }
} else {
    if (command.command)
        usageError(`Unknown command: ${command.command}`, usage());
    else
        usageError("Must specify a command", usage());
}
