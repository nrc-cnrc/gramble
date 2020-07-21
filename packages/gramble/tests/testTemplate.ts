import {TextProject} from "../src/spreadsheet";
import 'mocha';
import {testNumResults, testFlattenedOutput, cellSplit, testNoErrors} from "./test_util"

/** 
 * Simple project
 */

 
const templateGrammar = cellSplit(`
    rootTemplate, template, text, eng, engform
        ,         , \${text}, \${eng_simple}, simple
        ,         , \${text}, \${eng_past}, past
        ,         , \${text}, \${eng_part}, part
        ,         , \${text}, \${eng_gerund}, gerund

    VERB, rootTemplate, text, eng_simple, eng_past, eng_part, eng_gerund
        ,             , foo, break, broke, broken, breaking
        ,             , moo, eat,   ate,   eaten,  eating

    MAIN, add, var
        ,    , VERB
`);

const templateProject = new TextProject().addSheet("testSheet", templateGrammar);

describe('Project with template', function() {
    testNoErrors(templateProject);
});

describe('Project with template, parsing foo', function() {
    const result = templateProject.parseFlatten({text: "foo"});
    testNumResults(result, 4);
    testFlattenedOutput(result, 0, "eng", "break");
    testFlattenedOutput(result, 0, "engform", "simple");
    testFlattenedOutput(result, 1, "eng", "broke");
    testFlattenedOutput(result, 1, "engform", "past");
    testFlattenedOutput(result, 2, "eng", "broken");
    testFlattenedOutput(result, 2, "engform", "part");
    testFlattenedOutput(result, 3, "eng", "breaking");
    testFlattenedOutput(result, 3, "engform", "gerund");
});


describe('Project with template, generating', function() {
    const result = templateProject.generateFlatten();
    testNumResults(result, 8);
});


const templateGrammar2 = cellSplit(`
    rootTemplate, template, text, eng, enggloss
        ,         , \${text}, \${eng_simple}, \${eng_simple}
        ,         , \${text}, \${eng_past}, \${eng_simple}-past
        ,         , \${text}, \${eng_part}, \${eng_simple}-part
        ,         , \${text}, \${eng_gerund}, \${eng_simple}-ger

    VERB, rootTemplate, text, eng_simple, eng_past, eng_part, eng_gerund
        ,             , foo, break, broke, broken, breaking
        ,             , moo, eat,   ate,   eaten,  eating

    MAIN, add, var
        ,    , VERB
`);

const templateProject2 = new TextProject().addSheet("testSheet", templateGrammar2);

describe('Template with variable and literal content in same cell', function() {
    testNoErrors(templateProject2);
});

describe('Template with variable and literal content in same cell, parsing foo', function() {
    const result = templateProject2.parseFlatten({text: "foo"});
    testNumResults(result, 4);
    testFlattenedOutput(result, 0, "eng", "break");
    testFlattenedOutput(result, 0, "enggloss", "break");
    testFlattenedOutput(result, 1, "eng", "broke");
    testFlattenedOutput(result, 1, "enggloss", "break-past");
    testFlattenedOutput(result, 2, "eng", "broken");
    testFlattenedOutput(result, 2, "enggloss", "break-part");
    testFlattenedOutput(result, 3, "eng", "breaking");
    testFlattenedOutput(result, 3, "enggloss", "break-ger");
});


describe('Template with variable and literal content in same cell, generating', function() {
    const result = templateProject2.generateFlatten();
    testNumResults(result, 8);
});


const templateGrammar3 = cellSplit(`
    rootTemplate, template, text, eng, gloss
        ,         , \${text}, \${eng_simple}, \${text}-\${eng_simple}
        ,         , \${text}, \${eng_past}, \${text}-\${eng_simple}-past
        ,         , \${text}, \${eng_part}, \${text}-\${eng_simple}-part
        ,         , \${text}, \${eng_gerund}, \${text}-\${eng_simple}-ger

    VERB, rootTemplate, text, eng_simple, eng_past, eng_part, eng_gerund
        ,             , foo, break, broke, broken, breaking
        ,             , moo, eat,   ate,   eaten,  eating

    MAIN, add, var
        ,    , VERB
`);

const templateProject3 = new TextProject().addSheet("testSheet", templateGrammar3);

describe('Template with multiple variables in one cell', function() {
    testNoErrors(templateProject3);
});

describe('Template with multiple variables in one cell, parsing foo', function() {
    const result = templateProject3.parseFlatten({text: "foo"});
    testNumResults(result, 4);
    testFlattenedOutput(result, 0, "eng", "break");
    testFlattenedOutput(result, 0, "gloss", "foo-break");
    testFlattenedOutput(result, 1, "eng", "broke");
    testFlattenedOutput(result, 1, "gloss", "foo-break-past");
    testFlattenedOutput(result, 2, "eng", "broken");
    testFlattenedOutput(result, 2, "gloss", "foo-break-part");
    testFlattenedOutput(result, 3, "eng", "breaking");
    testFlattenedOutput(result, 3, "gloss", "foo-break-ger");
});


describe('Template with multiple variables in one cell, generating', function() {
    const result = templateProject3.generateFlatten();
    testNumResults(result, 8);
});
