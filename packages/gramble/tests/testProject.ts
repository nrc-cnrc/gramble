import {Project, TextDevEnvironment} from "../src/spreadsheet";
import 'mocha';
import {testNumResults, testFlattenedOutput, cellSplit} from "./test_util"

const devEnv = new TextDevEnvironment();


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


describe('Project with no variables, generating', function() {
    const result = ambiguousProject.generateFlatten();
    testNumResults(result, 2);
    testFlattenedOutput(result, 0, "gloss", "jump-1SG");
    testFlattenedOutput(result, 1, "gloss", "run-3PL.PAST");
});


describe('Project with no variables, generating 1', function() {
    const result = ambiguousProject.generateFlatten('MAIN', false, 1, true);
    testNumResults(result, 1);
    testFlattenedOutput(result, 0, "gloss", "jump-1SG");
});


describe('Project with no variables, sampling', function() {
    const result = ambiguousProject.sampleFlatten();
    testNumResults(result, 1);
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

describe('Project with no variables, gloss->text', function() {
    const result = ambiguousProject.parseFlatten({gloss: "jump-1SG"});
    testNumResults(result, 1);
    testFlattenedOutput(result, 0, "text", "foobar");
});

describe('Project with no variables, with max_results=1', function() {
    const result = ambiguousProject.parseFlatten({text: "foobar"}, 'MAIN', false, 1);
    testNumResults(result, 1);
    testFlattenedOutput(result, 0, "gloss", "jump-1SG");
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


describe('Flat project, gloss->text', function() {
    const result = flatProject.parseFlatten({gloss: "jump-1SG"});
    testNumResults(result, 1);
    testFlattenedOutput(result, 0, "text", "foobar");
});

describe('Flat project, with max_results=1', function() {
    const result = flatProject.parseFlatten({text: "foobar"}, 'MAIN', false, 1);
    testNumResults(result, 1);
    testFlattenedOutput(result, 0, "gloss", "jump-1SG");
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


describe('Hierarchical project, gloss->text', function() {
    const result = hierarchicalProject.parseFlatten({gloss: "jump-1SG"});
    testNumResults(result, 1);
    testFlattenedOutput(result, 0, "text", "foobar");
});

describe('Hierarchical project, with max_results=1', function() {
    const result = hierarchicalProject.parseFlatten({text: "foobar"}, 'MAIN', false, 1);
    testNumResults(result, 1);
    testFlattenedOutput(result, 0, "gloss", "jump-1SG");
});

/**
 * Testing "maybe <literal>" tier
 */

const maybeGlossGrammar = cellSplit(`
MAIN, text, gloss, maybe gloss, text, gloss
    , foo, jump, -INDIC, bar, -1SG
`);

const maybeGlossProject = new Project().addSheet("testSheet", maybeGlossGrammar, devEnv);

describe('Maybe <literal> parser', function() {
    const result = maybeGlossProject.parseFlatten({text: "foobar"});
    testNumResults(result, 2);
    testFlattenedOutput(result, 0, "gloss", "jump-INDIC-1SG");
    testFlattenedOutput(result, 1, "gloss", "jump-1SG");
});

/**
 * Testing "maybe <var>" tier
 */

const maybeVarGrammar = cellSplit(`
ROOT,    text,   gloss
     ,   foo,     jump

SUFFIX,  text,   gloss
      ,  bar,    -1SG
MAIN,   var,    maybe var
    ,   ROOT,   SUFFIX
`)

const maybeVarProject = new Project().addSheet("testSheet", maybeVarGrammar, devEnv);

describe('Maybe <var> parser, parsing input with no suffix', function() {
    const result = maybeVarProject.parseFlatten({text: "foo"});
    testNumResults(result, 1);
    testFlattenedOutput(result, 0, "gloss", "jump");
});


describe('Maybe <var> parser, parsing input with suffix', function() {
    const result = maybeVarProject.parseFlatten({text: "foobar"});
    testNumResults(result, 1);
    testFlattenedOutput(result, 0, "gloss", "jump-1SG");
});

/**
 * "x/y" tier parser
 */

const slashGrammar = cellSplit(`
MAIN,   text/root, gloss, text, gloss
    ,    foo,    jump, bar, -1SG
    ,    foob, run, ar, -3PL.PAST
`);

const slashProject = new Project().addSheet("testSheet", slashGrammar, devEnv);


describe('Project with text/root tier, transducing from text', function() {
    const result =  slashProject.parseFlatten({text: "foobar"});
    testNumResults(result, 2);
    testFlattenedOutput(result, 0, "root", "foo");
    testFlattenedOutput(result, 1, "root", "foob");
});

describe('Project with text/root tier, transducing from gloss', function() {
    const result =  slashProject.parseFlatten({gloss: "jump-1SG"});
    testNumResults(result, 1);
    testFlattenedOutput(result, 0, "root", "foo");
});

describe('Project with text/root tier, transducing from root', function() {
    const result =  slashProject.parseFlatten({root: "foo"});
    testNumResults(result, 1);
    testFlattenedOutput(result, 0, "text", "foobar");
    testFlattenedOutput(result, 0, "gloss", "jump-1SG");
});


/**
 * Testing to make sure empty cells in the grammar work
 */

const grammarWithEmptyCell = cellSplit(`
VROOT, text, gloss
    , foo, jump

VSTEM, var, text, gloss
    , VROOT, bar, -1SG
    , VROOT,    , .3PL

MAIN, var
    , VSTEM
`);

const projectWithEmptyCell = new Project().addSheet("testSheet", grammarWithEmptyCell, devEnv);


describe('Project with empty cell, transducing from text', function() {
    const result =  projectWithEmptyCell.parseFlatten({text: "foobar"});
    testNumResults(result, 1);
    testFlattenedOutput(result, 0, "gloss", "jump-1SG");
});


describe('Project with empty cell, transducing from text', function() {
    const result =  projectWithEmptyCell.parseFlatten({text: "foo"});
    testNumResults(result, 1);
    testFlattenedOutput(result, 0, "gloss", "jump.3PL");
});


describe('Project with empty cell, transducing from gloss', function() {
    const result =  projectWithEmptyCell.parseFlatten({gloss: "jump-1SG"});
    testNumResults(result, 1);
    testFlattenedOutput(result, 0, "text", "foobar");
});

describe('Project with empty cell, transducing from gloss', function() {
    const result =  projectWithEmptyCell.parseFlatten({gloss: "jump.3PL"});
    testNumResults(result, 1);
    testFlattenedOutput(result, 0, "text", "foo");
});
