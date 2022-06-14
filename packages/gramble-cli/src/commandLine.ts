#!/usr/bin/env ts-node-script

import { 
    Interpreter, 
    TextDevEnvironment,
    timeIt
} from "@gramble/parser";
import { createWriteStream, existsSync } from "fs";
import { basename, dirname } from "path";
import { Writable } from "stream";
import * as commandLineArgs from "command-line-args";
import * as commandLineUsage from "command-line-usage";

// Status code of an invalid usage invocation:
// See: man 3 sysexits
const EXIT_USAGE = 64;

type StringDict = {[key: string]: string};

export function sheetFromFile(path: string, verbose: boolean): Interpreter {

    const dir = dirname(path);
    const sheetName = basename(path, ".csv");
    const devEnv = new TextDevEnvironment(dir);
    const project = Interpreter.fromSheet(devEnv, sheetName, verbose);
    return project;
}

function fileExistsOrFail(filename: string) {
    if (filename == undefined) {
        usageError(`Must provide a filename`);
    }
    if (!existsSync(filename)) {
        usageError(`Cannot find file ${filename}`);
    }
}

function getOutputStream(output: string | undefined): Writable {
  if (output == undefined) {
    return process.stdout;
  }
  return createWriteStream(output, "utf8");
}

/* first - parse the main command */
const commandDefinition = [{ name: "command", defaultOption: true }];
const command = commandLineArgs(commandDefinition, {
  stopAtFirstUnknown: true,
});
const argv = command._unknown || [];
// TODO: determine from argv?
const programName = "gramble";

interface Command {
  run(options: commandLineArgs.CommandLineOptions): void;
  synopsis: string | string[];
  options: commandLineArgs.OptionDefinition[] & commandLineUsage.OptionList;
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
    synopsis: `generate [--symbol|-s {underline name}] [--max={underline n}][--otier={underline tier}] [--output|-o {underline file}] {underline source}`,
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
            defaultValue: "",
            typeLabel: "{underline name}",
            description: "symbol to start generation. Defaults to '', the default symbol",
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
    ],

    run(options: commandLineArgs.CommandLineOptions) {
        fileExistsOrFail(options.source);

        const outputStream = getOutputStream(options.output);
        const interpreter = sheetFromFile(options.source, options.verbose);

        if (options.verbose) {
            interpreter.runChecks();
            interpreter.devEnv.logErrors();
        }

        const labels = interpreter.getTapeNames(options.symbol);
        const generator = interpreter.generateStream(options.symbol, {});
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
    synopsis: "sample [--output|-o {underline file}] {underline source}",
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
        defaultValue: "",
        typeLabel: "{underline name}",
        description: "symbol to start generation. Defaults to '', the default symbol",
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
    ],

    run(options: commandLineArgs.CommandLineOptions) {
        fileExistsOrFail(options.source);

        const outputStream = getOutputStream(options.output);
        const interpreter = sheetFromFile(options.source, options.verbose);

        if (options.verbose) {
            interpreter.runChecks();
            interpreter.devEnv.logErrors();
        }

        const labels = interpreter.getTapeNames(options.symbol);
        const generator = interpreter.sampleStream(options.symbol, options.num, {});
        timeIt(() => {
            if (options.format.toLowerCase() == 'csv') {
                generateToCSV(outputStream, generator, labels);
            } else {
                generateToJSON(outputStream, generator);
            }
        }, options.verbose, "Sampling commplete", "Started sampling");
    },
  },
/*
  parse: {
    synopsis: [
      "parse --itier={underline tier} [--otier={underline tier}] [--random] [--max={underline n}] {underline source}",
      "parse --tokenize --itier={underline tier} --otier={underline tier} [--random] {underline source}",
    ],
    options: [
      {
        name: "source",
        type: String,
        defaultOption: true,
      },
      {
        name: "input",
        alias: "i",
        type: String,
        typeLabel: "{underline file}",
        description: "read input from {underline file}",
      },
      {
        name: "output",
        alias: "o",
        type: String,
        typeLabel: "{underline file}",
        description: "write output to {underline file}",
      },
      {
        name: "itier",
        type: String,
        typeLabel: "{underline tier}",
        description:
          "what tier to match the input against (e.g., text, gloss, etc.)",
      },
      {
        name: "otier",
        type: String,
        typeLabel: "{underline tier}",
        description: "only output {underline tier}, instead of JSON",
      },
      {
        name: "random",
        alias: "r",
        type: Boolean,
        defaultValue: false,
        description: "sample randomly from possible outputs",
      },
      {
        name: "max",
        alias: "m",
        type: Number,
        defaultValue: -1,
        description: "restrict number of outputs for each word",
      },
      {
        name: "tokenize",
        alias: "t",
        type: Boolean,
        defaultValue: false,
        description:
          "parse lines as whitespace-separated tokens, rather than the whole line",
      },
    ],

    run(options) {
      fileExistsOrFail(options.source);

      const inputStream = getInputStream(options.input);
      const outputStream = getOutputStream(options.output);

      if (options.itier == undefined) {
        usageError(
          "If you are parsing from a text file, you must specify what tier the text is on, e.g. --itier gloss"
        );
      }

      if (options.tokenize) {
        if (options.otier == undefined) {
          usageError(
            "If you are parsing tokenized, you must specify what tier the output text should be taken from, e.g. --otier gloss"
          );
        }
        proj
          .addFile(options.source)
          .then(() => proj.compile())
          .then(() => proj.devEnv.highlight())
          .then(() =>
            proj.parseStreamTokenized(
              inputStream,
              outputStream,
              options.itier,
              options.random,
              options.otier
            )
          );
      } else {
        proj
          .addFile(options.source)
          .then(() => proj.compile())
          .then(() => proj.devEnv.highlight())
          .then(() =>
            proj.parseStream(
              inputStream,
              outputStream,
              options.itier,
              options.random,
              options.max,
              options.otier
            )
          );
      }
    },
  },

  */
};

const sections = [
  {
    header: programName,
    content: "the grammar table parser/generator/sampler",
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

/* second - parse the generate command options */
if (command.command in commands) {
  const cmd = commands[command.command];
  const options = commandLineArgs(cmd.options, { argv });
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

function resultToCSV(labels: string[], entry: StringDict): string {
    const replacer = (key: string, value:string | null) => value === null ? '' : value;
    return labels.map(label => JSON.stringify(entry[label], replacer)).join(',');
}

type Gen<T> = Generator<T, void, undefined>;

function generateToCSV(
    outputStream: Writable,    
    generator: Gen<StringDict>, 
    labels: string[]
): void {
    const replacer = (key: string, value:string | null) => value === null ? '' : value;
    outputStream.write(labels.join(",") + "\n");
    for (const entry of generator) {
        const line = labels.map(label => 
            JSON.stringify(entry[label], replacer));
        outputStream.write(line.join(",") + "\n");
    }
}

function generateToJSON(
    outputStream: Writable,
    generator: Gen<StringDict>
): void {
    outputStream.write("[\n");
    let firstLine = true;
    for (const entry of generator) {
        if (!firstLine) {
            outputStream.write(",\n");
        }
        firstLine = false;
        const line = JSON.stringify(entry);
        outputStream.write("  " + line);
    }
    outputStream.write("\n]");
}