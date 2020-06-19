import {Project, TextDevEnvironment} from "../src/spreadsheet";
import 'mocha';
import {testNumResults, testFlattenedOutput} from "./test_util"

const devEnv = new TextDevEnvironment();

function cellSplit(s: string): string[][] {
    return s.split("\n").map((line) => line.split(","));
}




/** 
 * Simple project
 */

 
const ambiguousGrammar = cellSplit(`
    MAIN, text, gloss, text, gloss
        , foo, jump, bar, -1SG
        , foob, run, ar, -3PL.PAST
`);

const ambiguousProject = new Project().addSheet("testSheet", ambiguousGrammar, devEnv);

describe('Project with no variables, parsing foobar', function() {
    const result = ambiguousProject.parseFlatten({text: "foobar"});
    testNumResults(result, 2);
    testFlattenedOutput(result, 0, "gloss", "jump-1SG");
    testFlattenedOutput(result, 1, "gloss", "run-3PL.PAST");
});


describe('Project with no variables, full_parsing unparseable input moobar', function() {
    const result = ambiguousProject.parseFlatten({text: "moobar"});
    testNumResults(result, 0);
});


describe('Project with no variables, full_parsing unparseable input foobaz', function() {
    const result = ambiguousProject.parseFlatten({text: "foobaz"});
    testNumResults(result, 0);
});


describe('Project with no variables, full_parsing an incomplete input "fo"', function() {
    const result = ambiguousProject.parseFlatten({text: "fo"});
    testNumResults(result, 0);
});

describe('Project with no variables, full_parsing an incomplete input "foo"', function() {
    const result = ambiguousProject.parseFlatten({text: "foo"});
    testNumResults(result, 0);
});

/**
 * Flat grammar
 * 
 */

 
const flatGrammar = cellSplit(`
    VROOT, text, gloss
        , foo, jump
        , foob, run

    TENSE, text, gloss
        , bar, -1SG
        , ar, -3PL.PAST

    MAIN, var, var
    , VROOT, TENSE
`);

const flatProject = new Project().addSheet("testSheet", flatGrammar, devEnv);

describe('Flat project, parsing foobar', function() {
    const result = flatProject.parseFlatten({text: "foobar"});
    testNumResults(result, 2);
    testFlattenedOutput(result, 0, "gloss", "jump-1SG");
    testFlattenedOutput(result, 1, "gloss", "run-3PL.PAST");
});


describe('Flat project, full_parsing unparseable input moobar', function() {
    const result = flatProject.parseFlatten({text: "moobar"});
    testNumResults(result, 0);
});


describe('Flat project, full_parsing unparseable input foobaz', function() {
    const result = flatProject.parseFlatten({text: "foobaz"});
    testNumResults(result, 0);
});


describe('Flat project, full_parsing an incomplete input "fo"', function() {
    const result = flatProject.parseFlatten({text: "fo"});
    testNumResults(result, 0);
});

describe('Flat project, full_parsing an incomplete input "foo"', function() {
    const result = flatProject.parseFlatten({text: "foo"});
    testNumResults(result, 0);
});

/**
 * Hierarchical grammar
 */

 
const hierarchicalGrammar = cellSplit(`
    VROOT, text, gloss
        , foo, jump
        , foob, run

    VSTEM, var, text, gloss
        , VROOT, bar, -1SG
        , VROOT, ar, -3PL.PAST

    MAIN, var
    , VSTEM
`);



const hierarchicalProject = new Project().addSheet("testSheet", hierarchicalGrammar, devEnv);


describe('Hierarchical project, parsing foobar', function() {
    const result = hierarchicalProject.parseFlatten({text: "foobar"});
    testNumResults(result, 2);
    testFlattenedOutput(result, 0, "gloss", "jump-1SG");
    testFlattenedOutput(result, 1, "gloss", "run-3PL.PAST");
});

describe('Hierarchical project, full_parsing unparseable input moobar', function() {
    const result = hierarchicalProject.parseFlatten({text: "moobar"});
    testNumResults(result, 0);
});


describe('Hierarchical project, full_parsing unparseable input foobaz', function() {
    const result = hierarchicalProject.parseFlatten({text: "foobaz"});
    testNumResults(result, 0);
});


describe('Hierarchical project, full_parsing an incomplete input "fo"', function() {
    const result = hierarchicalProject.parseFlatten({text: "fo"});
    testNumResults(result, 0);
});

describe('Hierarchical project, full_parsing an incomplete input "foo"', function() {
    const result = hierarchicalProject.parseFlatten({text: "foo"});
    testNumResults(result, 0);
});
