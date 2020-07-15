import {Project, TextDevEnvironment} from "../src/spreadsheet";
import 'mocha';
import {testNumResults, testFlattenedOutput, cellSplit} from "./test_util"

const devEnv = new TextDevEnvironment();


/** 
 * Simple after project
 */

 
const afterGrammar = cellSplit(`
VROOT, add, text, gloss
    , , foo, jump
    , , foot, run

TENSE, add, not after text, after text, text, gloss
     , , t             ,           , bar , -1SG
     , ,               , t         , ar  , -1SG

MAIN, add, var, var
, , VROOT, TENSE
`);

const afterProject = new Project().addSheet("testSheet", afterGrammar, devEnv);

describe('Project with after transducers, generating', function() {
    const result = afterProject.generateFlatten();
    testNumResults(result, 2);
    testFlattenedOutput(result, 0, "text", "foobar");
    testFlattenedOutput(result, 0, "gloss", "jump-1SG");
    testFlattenedOutput(result, 1, "text", "footar");
    testFlattenedOutput(result, 1, "gloss", "run-1SG");
});


describe('Project with after transducers, parsing foobar', function() {
    const result = afterProject.parseFlatten({text: "foobar"});
    testNumResults(result, 1);
    
    testFlattenedOutput(result, 0, "text", "foobar");
    testFlattenedOutput(result, 0, "gloss", "jump-1SG");
});


describe('Project with after transducers, parsing footar', function() {
    const result = afterProject.parseFlatten({text: "footar"});
    testNumResults(result, 1);
    testFlattenedOutput(result, 0, "text", "footar");
    testFlattenedOutput(result, 0, "gloss", "run-1SG");
});


describe('Project with after transducers, parsing unparseable input moobar', function() {
    const result = afterProject.parseFlatten({text: "moobar"});
    testNumResults(result, 0);
});


/** 
 * Complex after project
 */

 
const complexAfterGrammar = cellSplit(`
V_OR_T, add, text
      ,,  t
      , , d
VROOT, add, text, gloss
    , , foo, jump
    , , foot, run

TENSE, add, not after var, after var, text, gloss
     , , V_OR_T       ,           , bar , -1SG
     , ,              , V_OR_T    , ar  , -1SG

MAIN, add, var, var
    , , VROOT, TENSE
`);

const complexAfterProject = new Project().addSheet("testSheet", complexAfterGrammar, devEnv);

describe('Project with complex after transducers, generating', function() {
    const result = complexAfterProject.generateFlatten();
    testNumResults(result, 2);
    testFlattenedOutput(result, 0, "text", "foobar");
    testFlattenedOutput(result, 0, "gloss", "jump-1SG");
    testFlattenedOutput(result, 1, "text", "footar");
    testFlattenedOutput(result, 1, "gloss", "run-1SG");
});


describe('Project with complex after transducers, parsing foobar', function() {
    const result = complexAfterProject.parseFlatten({text: "foobar"});
    testNumResults(result, 1);
    testFlattenedOutput(result, 0, "text", "foobar");
    testFlattenedOutput(result, 0, "gloss", "jump-1SG");
});


describe('Project with complex after transducers, parsing footar', function() {
    const result = complexAfterProject.parseFlatten({text: "footar"});
    testNumResults(result, 1);
    testFlattenedOutput(result, 0, "text", "footar");
    testFlattenedOutput(result, 0, "gloss", "run-1SG");
});


describe('Project with complex after transducers, parsing unparseable input moobar', function() {
    const result = complexAfterProject.parseFlatten({text: "moobar"});
    testNumResults(result, 0);
});


/** 
 * Complex after project
 */

 
const afterAltGrammar = cellSplit(`

VROOT, add, text, gloss
    , , foo, jump
    , , foot, run

TENSE, add, not after alt text, after alt text, text, gloss
     , , t|d       ,           , bar , -1SG
     , ,              , t|d    , ar  , -1SG

MAIN, add, var, var
, , VROOT, TENSE
`);

const afterAltProject = new Project().addSheet("testSheet", afterAltGrammar, devEnv);

describe('Project with complex after transducers, generating', function() {
    const result = afterAltProject.generateFlatten();
    testNumResults(result, 2);
    testFlattenedOutput(result, 0, "text", "foobar");
    testFlattenedOutput(result, 0, "gloss", "jump-1SG");
    testFlattenedOutput(result, 1, "text", "footar");
    testFlattenedOutput(result, 1, "gloss", "run-1SG");
});


describe('Project with complex after transducers, parsing foobar', function() {
    const result = afterAltProject.parseFlatten({text: "foobar"});
    testNumResults(result, 1);
    testFlattenedOutput(result, 0, "text", "foobar");
    testFlattenedOutput(result, 0, "gloss", "jump-1SG");
});


describe('Project with complex after transducers, parsing footar', function() {
    const result = afterAltProject.parseFlatten({text: "footar"});
    testNumResults(result, 1);
    testFlattenedOutput(result, 0, "text", "footar");
    testFlattenedOutput(result, 0, "gloss", "run-1SG");
});


describe('Project with complex after transducers, parsing unparseable input moobar', function() {
    const result = afterAltProject.parseFlatten({text: "moobar"});
    testNumResults(result, 0);
});


const altAfterGrammar = cellSplit(`

VROOT, add, text, gloss
    , , foo, jump
    , , foot, run

TENSE, add, not alt after text, alt after text, text, gloss
     , , t|d       ,           , bar , -1SG
     , ,              , t|d    , ar  , -1SG

MAIN, add, var, var
, , VROOT, TENSE
`);


const altAfterProject = new Project().addSheet("testSheet", altAfterGrammar, devEnv);

describe('Project with complex after transducers, generating', function() {
    const result = altAfterProject.generateFlatten();
    testNumResults(result, 2);
    testFlattenedOutput(result, 0, "text", "foobar");
    testFlattenedOutput(result, 0, "gloss", "jump-1SG");
    testFlattenedOutput(result, 1, "text", "footar");
    testFlattenedOutput(result, 1, "gloss", "run-1SG");
});


describe('Project with complex after transducers, parsing foobar', function() {
    const result = altAfterProject.parseFlatten({text: "foobar"});
    testNumResults(result, 1);
    testFlattenedOutput(result, 0, "text", "foobar");
    testFlattenedOutput(result, 0, "gloss", "jump-1SG");
});


describe('Project with complex after transducers, parsing footar', function() {
    const result = altAfterProject.parseFlatten({text: "footar"});
    testNumResults(result, 1);
    testFlattenedOutput(result, 0, "text", "footar");
    testFlattenedOutput(result, 0, "gloss", "run-1SG");
});


describe('Project with complex after transducers, parsing unparseable input moobar', function() {
    const result = altAfterProject.parseFlatten({text: "moobar"});
    testNumResults(result, 0);
});


/** 
 * Complex before project
 */

 
const complexBeforeGrammar = cellSplit(`
B_OR_G, add, text
      , , b
      , , g

VROOT, add, text, gloss, before var, before not var
    , , foo, jump, B_OR_G,
    , , foot, run,  , B_OR_G

TENSE, add, text, gloss
     , , bar , -1SG
     , , ar  , -1SG

MAIN, add, var, var
    , , VROOT, TENSE
`);

const complexBeforeProject = new Project().addSheet("testSheet", complexBeforeGrammar, devEnv);

describe('Project with complex before transducers, generating', function() {
    const result = complexBeforeProject.generateFlatten();
    testNumResults(result, 2);
    testFlattenedOutput(result, 0, "text", "foobar");
    testFlattenedOutput(result, 0, "gloss", "jump-1SG");
    testFlattenedOutput(result, 1, "text", "footar");
    testFlattenedOutput(result, 1, "gloss", "run-1SG");
});


describe('Project with complex transducers, parsing foobar', function() {
    const result = complexBeforeProject.parseFlatten({text: "foobar"});
    testNumResults(result, 1);
    
    testFlattenedOutput(result, 0, "text", "foobar");
    testFlattenedOutput(result, 0, "gloss", "jump-1SG");
});



/** 
 * Complex before project
 */

 
const altBeforeGrammar = cellSplit(`

VROOT, add, text, gloss, before alt text, before not alt text
    , , foo, jump, b|g,
    , , foot, run,  , b|g

TENSE, add, text, gloss
     , , bar , -1SG
     , , ar  , -1SG

MAIN, add, var, var
    , , VROOT, TENSE
`);

const altBeforeProject = new Project().addSheet("testSheet", altBeforeGrammar, devEnv);

describe('Project with complex before transducers, generating', function() {
    const result = altBeforeProject.generateFlatten();
    testNumResults(result, 2);
    testFlattenedOutput(result, 0, "text", "foobar");
    testFlattenedOutput(result, 0, "gloss", "jump-1SG");
    testFlattenedOutput(result, 1, "text", "footar");
    testFlattenedOutput(result, 1, "gloss", "run-1SG");
});


describe('Project with complex transducers, parsing foobar', function() {
    const result = altBeforeProject.parseFlatten({text: "foobar"});
    testNumResults(result, 1);
    
    testFlattenedOutput(result, 0, "text", "foobar");
    testFlattenedOutput(result, 0, "gloss", "jump-1SG");
});


describe('Project with complex transducers, parsing footar', function() {
    const result = altBeforeProject.parseFlatten({text: "footar"});
    testNumResults(result, 1);
    testFlattenedOutput(result, 0, "text", "footar");
    testFlattenedOutput(result, 0, "gloss", "run-1SG");
});


describe('Project with complex transducers, parsing unparseable input moobar', function() {
    const result = altBeforeProject.parseFlatten({text: "moobar"});
    testNumResults(result, 0);
});
