#!/usr/bin/env ts-node-script

import { 
    timeIt,
    SILENT, 
    VERBOSE_STATES,
    VERBOSE_TIME,
    Message,
} from "@gramble/interpreter";

import commandLineArgs from "command-line-args";
import commandLineUsage from "command-line-usage";
import seedrandom from "seedrandom";

import {
    fileExistsOrFail, generateToCSV, generateToJSON,
    getOutputStream, parseQuery, programName, sourceFromFile,
    StringDict, usageError, usageWarn,
} from "./util.js";


/* first - parse the main command */
const commandDefinition = [
    {
        name: "command",
        defaultOption: true
    }
];
const command = commandLineArgs(commandDefinition, {
    stopAtFirstUnknown: true,
});
const argv = command._unknown || [];

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
        description: "test hiding source in options list",
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

        run(options) {
            const command = commands[options.command];
            if (command) {
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
                if (options.command) {
                    usageError(
                        `Unknown command: ${options.command}`,
                        usage()
                    );             
                }
                printUsage();
            }
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
};

function validateGenerateOrSampleOptions(
    options: commandLineArgs.CommandLineOptions
): [commandLineArgs.CommandLineOptions, StringDict] {

    fileExistsOrFail(options.source);

    if (options.symbol == null || options.symbol.trim().length == 0) {
        options.symbol = 'all';
    }

    if (options.max === null || Number.isNaN(options.max)) {
        usageWarn('Missing or invalid count for --max|-m option; using default: Infinity');
        options.max = Infinity;
    }

    if (options.num === null || Number.isNaN(options.num)) {
        usageWarn('Missing or invalid count for --num|-n option; using default: 5');
        options.num = 5;
    }

    if (options.query === null) {
        usageWarn('Missing query string for --query|-q option');
        options.query = "";
    }
    let query: StringDict = parseQuery(options.query);

    return [options, query];
}

function runGenerateOrSampleCmd(
    options: commandLineArgs.CommandLineOptions,
    sample: boolean = false
) {
    let query: StringDict;
    [options, query] = validateGenerateOrSampleOptions(options);

    const command = sample ? "Sampling" : "Generation";
    const outputStream = getOutputStream(options.output);
    const timeVerbose = (options.verbose) ? VERBOSE_TIME|VERBOSE_STATES : SILENT;
    const interpreter = sourceFromFile(options.source, timeVerbose);

    if (options.verbose && options.strict) {
        console.error("Treating Gramble warnings as errors.");
    }
    
    interpreter.devEnv.logErrors();

    let errors = interpreter.devEnv.getErrors();
    if (errors.length > 0) {
        if (!options.strict) {
            errors = errors.filter(m => m.tag == "error");
        }
    }

    if (errors.length > 0) {
        const plural = errors.length > 1 ? "s" : "";
        const text = options.force ? "running even though" : "not run because";
        console.error(`${command} ${text} source has ${errors.length} ` +
                    `Gramble error${plural}.`);
        if (!options.force) return;
    }

    if (sample) {
        if (options.seed !== undefined) {
            if (options.seed === null || options.seed.trim().length == 0) {
                options.seed = 'Seed-2024';
            }
            // Monkey patch Math.random with a seeded PRNG, making Math.random calls
            // deterministic.
            seedrandom(options.seed, { global: true });
        }
    }

    const labels = interpreter.getTapeNames(options.symbol);
    const generator = sample ? interpreter.sampleStream(options.symbol, options.num, query)
                             : interpreter.generateStream(options.symbol, query);

    timeIt(() => {
        if (options.format.toLowerCase() == 'csv') {
            generateToCSV(outputStream, generator, labels, options?.max);
        } else {
            generateToJSON(outputStream, generator, options?.max);
        }
    }, options.verbose, `...${command} complete`, `Starting ${command.toLowerCase()}...`);
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

function usage(): string {
    return commandLineUsage(sections);
}

export function printUsage(error: boolean = false) {
    if (error) {
        console.error(usage());
    } else {
        console.log(usage());
    }
}

/* second - parse the command options */
if (command.command in commands) {
    try {    
        const cmd = commands[command.command];
        const options = commandLineArgs(cmd.options, { argv });
        cmd.run(options);
    } catch (e) {
        const msg = e instanceof Error ? e.message : e instanceof Message ? e.longMsg : "";
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
