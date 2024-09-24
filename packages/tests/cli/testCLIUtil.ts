import { assert, expect } from "chai";

import { spawnSync } from "child_process";

import {
    DEFAULT_MAX_CHARS,
    DEFAULT_MAX_RECURSION
} from "../../interpreter/src/utils/constants";
import {
    timeIt, SILENT,
    VERBOSE_DEBUG,
} from "../../interpreter/src/utils/logging";
import { Options } from "../../interpreter/src/utils/options";

import {
    testSuiteName, verbose,
    VERBOSE_TEST_L2    
} from '../testUtil';

export function cliTestSuiteName(mod: NodeModule): string {
    return `CLI ${testSuiteName(mod)}`
}

export interface CLITestAux extends Options {
    command: string,
    results: string[],
    errors: number | string[],
    sample: number,     // expected number of samples
    shortDesc: string,
};

export function testCLIAux({
    // Specific to testing the Gramble CLI
    command,
    results,
    errors = 0,
    sample = undefined,
    shortDesc = "",

    // General options
    verbose = SILENT,
    directionLTR = true,
    optimizeAtomicity = true,
    maxRecursion = DEFAULT_MAX_RECURSION,
    maxChars = DEFAULT_MAX_CHARS,
    priority = [],
}: Partial<CLITestAux>): void {

    const opt = Options({
        verbose: verbose,
        directionLTR: directionLTR,
        optimizeAtomicity: optimizeAtomicity,
        maxRecursion: maxRecursion,
        maxChars: maxChars,
        priority: priority,
    });

    if (command === undefined || command.length === 0){
        it("command must be defined and non-empty", function() {
            expect(command).to.not.be.undefined;
            expect(command?.length).to.not.equal(0);
        });
        return;
    }

    timeIt(() => {
        const tmpPATH = "PATH=../../node_modules/.bin:$PATH";

        let ex_results;
        try {
            ex_results = spawnSync(`${tmpPATH} ${command}`, {shell: true, encoding: "utf8"});
            // ex_results = spawnSync(`${tmpPATH} ${command}`, {encoding: "utf8"});
        }
        catch(e) {
            it(`Unexpected Exception from spawnSync for command '${command}'`, function() {
                console.log("");
                console.log(`[${this.test?.fullTitle()}]`);
                console.log(e);
                assert.fail(JSON.stringify(e));
            });
            return;
        }

        if (ex_results.signal != null || ex_results.status == null ||
                ex_results.stdout == null || ex_results.stderr == null) {
            it(`Unexpected error for command '${command}'`, function(){
                console.log("");
                console.log(`[${this.test?.fullTitle()}]`);
                console.log(ex_results.error);
                expect(ex_results.signal, "ex_results.signal").to.equal(null);
                expect(ex_results.status, "ex_results.status").to.not.equal(null);
                expect(ex_results.stdout, "ex_results.stdout").to.not.equal(null);
                expect(ex_results.stderr, "ex_results.stderr").to.not.equal(null);
            });
            return;
        }

        const outputs_str = ex_results.stdout.trim();
        const outputs = outputs_str ? outputs_str.split(/\r?\n/) : [];
        const err_outputs_str = ex_results.stderr.trim();
        const err_outputs = err_outputs_str ? err_outputs_str.split(/\r?\n/) : [];

        const expectedNumLines = sample !== undefined ? sample + 1 :
                                 results !== undefined ? results.length : 0;
        testNumOutputLines(outputs, expectedNumLines);

        if (results !== undefined) {
            testMatchOutputLines(outputs, results, command);
        } else {
            it("skipping match outputs", function() {
                expect(results).to.not.be.undefined;
            });
        }

        const expectedNumErrorLines = typeof errors == 'number' ? errors : errors.length;
        testNumOutputLines(err_outputs, expectedNumErrorLines, true);

        if (typeof errors != 'number') {
            testMatchOutputLines(err_outputs, errors, command, true);
        }
    }, VERBOSE_TEST_L2, `${shortDesc} testCLI '${command}'`);
}

export interface CLITest extends CLITestAux{
    desc: string,
    test: testFunctionType,
    msg: string,
}

type testFunctionType = (params: Partial<CLITest>) => () => void;

function testDefault(params: Partial<CLITest>): () => void {
    let msg = params["msg"];
    if (msg === undefined) {
        // output the test description be default for verbose testing.
        if (params["desc"] !== undefined)
            msg = `-- ${params["desc"]}`;
    }
    if (msg !== undefined && params["verbose"] !== undefined)
        verbose(params["verbose"], msg);
    const shortDesc = (params["desc"] !== undefined) ?
                      params["desc"].split(" ")[0] : "";

    return function() {
        if (params["shortDesc"] !== undefined)
            return testCLIAux({...params});
        else
            return testCLIAux({...params, shortDesc: shortDesc});
    };
}

export function testCLI(params: Partial<CLITest>): void {
    if (params['desc'] === undefined) {
        it(`desc must be defined`, function() {
            expect(params['desc']).to.not.be.undefined;
        });
        return;
    }

    const test = params['test'] === undefined ?
                 testDefault : params['test'];
    params['test'] = undefined;

    describe(params['desc'], test(params));
}

function testNumOutputLines(
    outputs: string[],
    expectedNum: number,
    testingErrors: boolean = false,
    warningOnly: boolean = false,
) {
    const resType: string = testingErrors ? "error" : "result";
    const testName: string = `should have ${expectedNum} ${resType}(s)`;
    it(`${testName}`, function() {
        try {
            expect(outputs.length).to.equal(expectedNum);
        } catch (e) {
            console.log("");
            console.log(`[${this.test?.fullTitle()}]`);
            console.log(`${outputs.length} ${resType} outputs: ${JSON.stringify(outputs)}`);
            if (warningOnly && outputs.length > expectedNum) {
                console.log(`Warning: should have ${expectedNum} ${resType}(s), ` +
                            `but found ${outputs.length}.`)
            } else {
                throw e;
            }
        }
    });
}

function testMatchOutputLines(
    outputs: string[],
    expectedOutputs: string[],
    command: string = '',
    testingErrors: boolean = false,
) {
    const words = command.split(' ', 2);
    const gramble_cmd = words[0];
    const gramble_subcmd = words[1];
    const resType: string = testingErrors ? "error" : "result";
    const testName: string = `should match ${expectedOutputs.length} expected ${resType}(s)`;
    it(`${testName}`, function() {
        try {
            if (testingErrors || gramble_cmd != 'gramble' || gramble_subcmd == 'help') {
                expect(outputs).to.deep.equal(expectedOutputs);
            } else {
                // subcmd == 'generate' || subcmd == 'sample')
                expect(outputs[0]).to.deep.equal(expectedOutputs[0]);
                const content = outputs.slice(1).sort();
                const expectedContent = expectedOutputs.slice(1).sort();
                expect(content).to.deep.include.members(expectedContent);
                expect(expectedContent).to.deep.include.members(content);
            }
        } catch (e) {
            console.log("");
            console.log(`[${this.test?.fullTitle()}]`);
            console.log(`${outputs.length} ${resType} outputs: ${JSON.stringify(outputs)}`);
            console.log(`${expectedOutputs.length} ${resType} expectedOutputs: ` +
                        `${JSON.stringify(expectedOutputs)}`);
            throw e;
        }
    });
}
