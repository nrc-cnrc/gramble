import { 
    timeIt,
    SILENT,
    VERBOSE_DEBUG,
    VERBOSE_STATES,
    VERBOSE_TIME,
    Message,
} from "@gramble/interpreter";

import commandLineArgs from "command-line-args";
import commandLineUsage from "command-line-usage";
import seedrandom from "seedrandom";

import {
    fileExistsOrFail,
    generateToCSV,
    generateToJSON,
    getOutputStream,
    parseQuery,
    programName,
    sourceFromFile,
    StringDict,
    usageError,
    usageWarn,
} from "./util.js";

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

export function runGenerateOrSampleCmd(
    options: commandLineArgs.CommandLineOptions,
    sample: boolean = false
) {
    let query: StringDict;
    [options, query] = validateGenerateOrSampleOptions(options);

    const command = sample ? "Sampling" : "Generation";
    const outputStream = getOutputStream(options.output);
    const timeVerbose = (options.verbose) ? VERBOSE_TIME|VERBOSE_STATES : SILENT;
    const debugVerbose = (options?.debug) ? VERBOSE_DEBUG : SILENT;
    const interpreter = sourceFromFile(options.source, timeVerbose|debugVerbose);

    if (options.verbose && options.strict) {
        console.info("Treating Gramble warnings as errors.");
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

export function runListCmd(
    options: commandLineArgs.CommandLineOptions,
) {
    if (! (options.symbols || options.errors)) {
        options.all = true;
    }

    fileExistsOrFail(options.source);

    const interpreter = sourceFromFile(options.source);

    if (options.all || options.symbols) {
        const symbols: string[] = interpreter.allSymbols();
        if (symbols.length === 0) {
            usageWarn("No symbols found.");
        } else {
            console.log("Available symbols:");
            console.log(`${JSON.stringify(interpreter.allSymbols())}`);
        }
    }

    if (options.all || options.errors) {
        const errors = interpreter.devEnv.getErrors();
        if (errors.length === 0) {
            console.log("No compilation errors/warnings :)")
        } else {
            console.log("")
            console.log("Compilation errors/warnings:")
            interpreter.devEnv.logErrors();
        }
    }
};


export function runTestCmd(
    options: commandLineArgs.CommandLineOptions,
) {
    fileExistsOrFail(options.source);

    if (options.symbol == null || options.symbol.trim().length == 0) {
        options.symbol = 'all';
    }

    const debugVerbose = (options?.debug) ? VERBOSE_DEBUG : SILENT;
    const interpreter = sourceFromFile(options.source, debugVerbose);

    try {
        interpreter.runTests(options.symbol, options.recursive);
    } catch(e) {
        const msg = e instanceof Error ?
                    e.message : e instanceof Message ? e.longMsg : "";
        usageError(
            `Error in test command:`,
            msg ? msg : e,
        );
    }

    const errorList = interpreter.devEnv.getErrors();
    if (errorList.length === 0) {
        console.log(`No tests found for symbol '${options.symbol}'`);
        return;
    }
    const succeeded: number = errorList.filter(m => m.tag == "success").length;
    const errors = errorList.filter(m => m.tag == "error" &&
                        m.shortMsg.startsWith("Failed unit test"));
    let failed: number = 0;
    let prevId: string | undefined = "";
    for (const err of errors) {
        const id = err.pos?.toString();
        if (id != prevId) {
            failed += 1;
            prevId = id;
        }
    }
    const notRun: number = errorList.filter(m => m.tag == "warning" &&
                                m.shortMsg.startsWith("Test line not run")).length;
    const total: number = succeeded + failed + notRun;
    const detail:string = options.recursive ? "reached from" : "for";
    console.log(`${total} tests ${detail} symbol '${options.symbol}'`)
    console.log(`${succeeded}/${total} tests succeeded`);
    console.log(`${failed}/${total} tests failed`);
    console.log(`${notRun}/${total} tests not run`);
    console.log("Test Results:")
    interpreter.devEnv.logErrors();
};
