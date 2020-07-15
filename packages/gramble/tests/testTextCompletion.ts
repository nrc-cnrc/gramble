import {Project, TextDevEnvironment} from "../src/spreadsheet";
import 'mocha';
import {testNumResults, testFlattenedOutput, cellSplit} from "./test_util"

const devEnv = new TextDevEnvironment();


/** 
 * Simple project
 */

 
const ambiguousGrammar = cellSplit(`
    MAIN, add, text, gloss, text, gloss
        , , foo, jump, bar, -1SG
        , , foob, run, az, -3PL.PAST
`);

const ambiguousProject = new Project().addSheet("testSheet", ambiguousGrammar, devEnv);

describe('Project with no variables, parsing fo*', function() {
    const result = ambiguousProject.completeFlatten({text: "fo"});
    testNumResults(result, 2);
    testFlattenedOutput(result, 0, "text", "foobar");
    testFlattenedOutput(result, 0, "gloss", "jump-1SG");
    testFlattenedOutput(result, 1, "text", "foobaz");
    testFlattenedOutput(result, 1, "gloss", "run-3PL.PAST");
});


describe('Project with no variables, parsing foo*', function() {
    const result = ambiguousProject.completeFlatten({text: "foo"});
    testNumResults(result, 2);
    testFlattenedOutput(result, 0, "text", "foobar");
    testFlattenedOutput(result, 0, "gloss", "jump-1SG");
    testFlattenedOutput(result, 1, "text", "foobaz");
    testFlattenedOutput(result, 1, "gloss", "run-3PL.PAST");
});


describe('Project with no variables, parsing foob*', function() {
    const result = ambiguousProject.completeFlatten({text: "foob"});
    testNumResults(result, 2);
    testFlattenedOutput(result, 0, "text", "foobar");
    testFlattenedOutput(result, 0, "gloss", "jump-1SG");
    testFlattenedOutput(result, 1, "text", "foobaz");
    testFlattenedOutput(result, 1, "gloss", "run-3PL.PAST");
});

describe('Project with no variables, parsing foobar*', function() {
    const result = ambiguousProject.completeFlatten({text: "foobar"});
    testNumResults(result, 1);
    testFlattenedOutput(result, 0, "text", "foobar");
    testFlattenedOutput(result, 0, "gloss", "jump-1SG");
});


describe('Project with no variables, full_parsing unparseable input moo*', function() {
    const result = ambiguousProject.completeFlatten({text: "moo"});
    testNumResults(result, 0);
});
