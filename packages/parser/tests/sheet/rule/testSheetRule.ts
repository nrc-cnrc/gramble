import { 
    testErrors, sheetFromFile, 
    testHasVocab, testGrammar 
} from "../../testUtil";
import * as path from 'path';
import { VERBOSE_DEBUG, VERBOSE_STATES } from "../../../src/util";

const DIR = `${path.dirname(module.filename)}/csvs`;

describe(`${path.basename(module.filename)}`, function() {

    describe('Simple replace', function() {
        const project = sheetFromFile(`${DIR}/sameTapeReplace.csv`);
        testHasVocab(project, {text: 3})
        testErrors(project, []);
        testGrammar(project, [
            {"text":"ava"}
        ]);
    }); 
    
    describe('Simple replace under assignment', function() {
        const project = sheetFromFile(`${DIR}/replaceUnderAssignment.csv`);
        testHasVocab(project, {text: 3})
        testErrors(project, []);
        testGrammar(project, [
            {"text":"ava"}
        ]);
    }); 
    
    describe('Replacing wrong tape', function() {
        const project = sheetFromFile( `${DIR}/replaceWrongTape.csv`);
        testErrors(project, [
            ["replaceWrongTape",3,1,"error"]
        ]);
        testGrammar(project, [
            {"text":"aba"}
        ]);
    }); 

    describe('Replace but the tape is a reserved word', function() {
        const project = sheetFromFile(`${DIR}/replaceReservedWord.csv`);
        testErrors(project, [
            ["replaceReservedWord",3,1,"error"]
        ]);
        testGrammar(project, [
            {"text":"aba"}
        ]);
    }); 

    describe('Simple replace with embed', function() {
        const project = sheetFromFile(`${DIR}/replaceEmbed.csv`);
        testHasVocab(project, {text: 3})
        testErrors(project, []);
        testGrammar(project, [
            {"text":"ava"}
        ]);
    });
    
    describe('Simple replace with two embed', function() {
        const project = sheetFromFile(`${DIR}/replaceTwoEmbed.csv`);
        testHasVocab(project, {text: 3})
        testErrors(project, []);
        testGrammar(project, [
            {"text":"ava"}
        ]);
    });

    describe('Simple replace with two embed 2', function() {
        const project = sheetFromFile(`${DIR}/replaceTwoEmbed2.csv`);
        testHasVocab(project, {text: 3})
        testErrors(project, []);
        testGrammar(project, [
            {"text":"ava"}
        ]);
    });

    describe('Replacing, embedded', function() {
        const project = sheetFromFile(`${DIR}/replaceEmbedded.csv`);
        testHasVocab(project, {text: 3})
        testErrors(project, []);
        testGrammar(project, [
            {"text":"ava"}
        ]);
    });
    
    describe('Rule cascade, embedded', function() {
        const project = sheetFromFile(`${DIR}/cascadeEmbedded.csv`);
        testHasVocab(project, {text: 4})
        testErrors(project, []);
        testGrammar(project, [
            {"text":"awa"}
        ]);
    });

    describe('Replacing an embedded replace', function() {
        const project = sheetFromFile(`${DIR}/replaceEmbeddedReplace.csv`);
        testHasVocab(project, {text: 4})
        testErrors(project, []);
        testGrammar(project, [
            {"text":"awa"}
        ]);
    });
    
    describe('Cascading an embedded casecade', function() {
        const project = sheetFromFile(`${DIR}/cascadeOfCascade.csv`);
        testHasVocab(project, {text: 8})
        testErrors(project, []);
        testGrammar(project, [
            {"text":"ABCD"}
        ]);
    });

    describe('Nested replace', function() {
        const project = sheetFromFile(`${DIR}/nestedSame.csv`);
        testHasVocab(project, {text: 3})
        testErrors(project, []);
        testGrammar(project, [
            {text: "w"}
        ]);
    });
    
    describe('Nested replace under assignment', function() {
        const project = sheetFromFile(`${DIR}/nestedSameUnderAssignment.csv`);
        testHasVocab(project, {text: 3})
        testErrors(project, []);
        testGrammar(project, [
            {text: "w"}
        ]);
    });
    
    describe('Nested replace with some unchanged letters', function() {
        const project = sheetFromFile(`${DIR}/nestedSameWithUnchanged.csv`);
        testHasVocab(project, {text: 5})
        testErrors(project, []);
        testGrammar(project, [
            {text: "awc"}
        ]);
    });

    describe('Nested replace 2', function() {
        const project = sheetFromFile(`${DIR}/nestedSame2.csv`);
        testHasVocab(project, {text: 4})
        testErrors(project, []);
        testGrammar(project, [
            {text: "ev"}
        ]);
    });
    
    describe('Rule cascade', function() {
        const project = sheetFromFile(`${DIR}/ruleCascade.csv`);
        testErrors(project, []);
        testGrammar(project, [
            {text: "w"}
        ]);
    });

    
    describe('Rule cascade 2', function() {
        const project = sheetFromFile(`${DIR}/ruleCascade2.csv`);
        testErrors(project, []);
        testGrammar(project, [
            {text: "ev"}
        ]);
    });
    
    describe('Simple replace with pre', function() {
        const project = sheetFromFile(`${DIR}/ruleWithPre.csv`);
        testErrors(project, []);
        testGrammar(project, [
            {"text":"ava"},
            {"text":"arba"}
        ]);
    });

    describe('Simple replace with post', function() {
        const project = sheetFromFile(`${DIR}/ruleWithPost.csv`);
        testErrors(project, []);
        testGrammar(project, [
            {"text":"ava"},
            {"text":"abra"}
        ]);
    });

    describe('Simple replace with pre and post', function() {
        const project = sheetFromFile(`${DIR}/ruleWithPrePost.csv`);
        testErrors(project, []);
        testGrammar(project, [
            {"text":"ava"},
            {"text":"abra"},
            {"text":"arba"}
        ]);
    });

    describe('Replace with a regex in from', function() {
        const project = sheetFromFile(`${DIR}/ruleFromRegex.csv`);
        testErrors(project, []);
        testGrammar(project, [
            {"text":"ava"}
        ]);
    });

    describe('Replace with a regex in to', function() {
        const project = sheetFromFile(`${DIR}/ruleToRegex.csv`);
        testErrors(project, []);
        testGrammar(project, [
            {"text":"apa"},
            {"text":"ava"}
        ]);
    });

    describe('Replace with a regex in pre', function() {
        const project = sheetFromFile(`${DIR}/rulePreRegex.csv`);
        testErrors(project, []);
        testGrammar(project, [
            {"text":"ava"},
            {"text":"arba"},
            {"text":"iva"}
        ]);
    });

    describe('Replace with a regex in post', function() {
        const project = sheetFromFile(`${DIR}/rulePostRegex.csv`);
        testErrors(project, []);
        testGrammar(project, [
            {"text":"ava"},
            {"text":"abra"},
            {"text":"avi"}
        ]);
    });
    
    describe('Replace with unnamed param', function() {
        const project = sheetFromFile(`${DIR}/replaceWithUnnamedParam.csv`);
        testErrors(project, [
            ["replaceWithUnnamedParam",12,4,"error"],
            ["replaceWithUnnamedParam",12,1,"warning"]
        ]);        
        testGrammar(project, [
            {"text":"foo", "gloss":"run.3SG"},
            {"text":"foobaz", "gloss":"run-2SG"},
            {"text":"foobar", "gloss":"run-1SG"},
            {"text":"moo", "gloss":"jump.3SG"},
            {"text":"moobaz", "gloss":"jump-2SG"},
            {"text":"moobar", "gloss":"jump-1SG"}
        ]);
    });

    describe('Replace with invalid param', function() {
        const project = sheetFromFile(`${DIR}/replaceWithInvalidParam.csv`);
        testErrors(project, [
            ["replaceWithInvalidParam",12,4,"error"],
            ["replaceWithInvalidParam",12,1,"warning"]
        ]);
        testGrammar(project, [
            {"text":"foo", "gloss":"run.3SG"},
            {"text":"foobaz", "gloss":"run-2SG"},
            {"text":"foobar", "gloss":"run-1SG"},
            {"text":"moo", "gloss":"jump.3SG"},
            {"text":"moobaz", "gloss":"jump-2SG"},
            {"text":"moobar", "gloss":"jump-1SG"}
        ]);
    });

    describe('Replace with no sibling', function() {
        const project = sheetFromFile(`${DIR}/replaceWithNoSibling.csv`);
        testErrors(project, [
            ["replaceWithNoSibling",0,1,"error"],
            ["replaceWithNoSibling",0,0,"warning"]
        ]);        
        testGrammar(project, [{}]);
    });
    
    describe('Replace with no sibling bare', function() {
        const project = sheetFromFile(`${DIR}/replaceWithNoSiblingBare.csv`);
        testErrors(project, [
            ["replaceWithNoSiblingBare",0,0,"error"],
            ["replaceWithNoSiblingBare",0,0,"warning"]
        ]);        
        testGrammar(project, [{}]);
    });

    describe('Replace with no child', function() {
        const project = sheetFromFile(`${DIR}/replaceWithNoChild.csv`);
        testErrors(project, [
            ["replaceWithNoChild",3,1,"error"]
        ]);        
        testGrammar(project, [
            {"text":"aba"}
        ]);
    });

    describe('Replace with missing "from" param', function() {
        const project = sheetFromFile(`${DIR}/replaceWithMissingFrom.csv`);
        testErrors(project, [
            ["replaceWithMissingFrom",12,1,"error"]
        ]);        
        testGrammar(project, [
            {"text":"foo", "gloss":"run.3SG"},
            {"text":"foobaz", "gloss":"run-2SG"},
            {"text":"foobar", "gloss":"run-1SG"},
            {"text":"moo", "gloss":"jump.3SG"},
            {"text":"moobaz", "gloss":"jump-2SG"},
            {"text":"moobar", "gloss":"jump-1SG"}
        ]);
    });

    describe('Replace with missing "to" param', function() {
        const project = sheetFromFile(`${DIR}/replaceWithMissingTo.csv`);
        testErrors(project, [
            ["replaceWithMissingTo",12,1,"error"]
        ]);        
        testGrammar(project, [
            {"text":"foo", "gloss":"run.3SG"},
            {"text":"foobaz", "gloss":"run-2SG"},
            {"text":"foobar", "gloss":"run-1SG"},
            {"text":"moo", "gloss":"jump.3SG"},
            {"text":"moobaz", "gloss":"jump-2SG"},
            {"text":"moobar", "gloss":"jump-1SG"}
        ]);
    });

    describe('Rule with an empty to', function() {
        const project = sheetFromFile(
            `${DIR}/blankTo.csv`);
        testHasVocab(project, {text: 2})
        testErrors(project, []);
        testGrammar(project, [
            {"text":"aa"}
        ]);
    });

    describe('Shortening rule', function() {
        const project = sheetFromFile(`${DIR}/shorteningRule.csv`);
        testHasVocab(project, {text: 2})
        testErrors(project, []);
        testGrammar(project, [
            {"text":"aba"}
        ]);
    });

    describe('Shortening rule long', function() {
        const project = sheetFromFile(`${DIR}/shorteningRuleLong.csv`);
        testHasVocab(project, {text: 2})
        testErrors(project, []);
        testGrammar(project, [
            {"text":"aba"}
        ]);
    });
    
    describe('Shortening rule empty to', function() {
        const project = sheetFromFile(`${DIR}/shorteningRuleEmptyTo.csv`);
        testHasVocab(project, {text: 2})
        testErrors(project, []);
        testGrammar(project, [
            {"text":"aa"}
        ]);
    });

    describe('DANGER: Rule with an empty from', function() {
        const project = sheetFromFile(`${DIR}/blankFrom.csv`);
        testHasVocab(project, {text: 3})
        testErrors(project, []);
        testGrammar(project, [
            {"text":"aba"},
            {"text":"abca"},
            {"text":"abaccc"},
            {"text":"acbca"},           
            {"text":"cabac"}
        ]);
    });

    describe('Rule with an empty from, with pre and post', function() {
        const project = sheetFromFile(`${DIR}/blankFromPrePost.csv`);
        testHasVocab(project, {text: 3})
        testErrors(project, []);
        testGrammar(project, [
            {"text":"abca"},
        ]);
    });

    describe('Rule cascade with an empty to', function() {
        const project = sheetFromFile(
            `${DIR}/cascadeBlankTo.csv`);
        testHasVocab(project, {text: 5})
        testErrors(project, []);
        testGrammar(project, [
            {"text":"BC"}
        ]);
    });

    describe('Replace with a symbol in regex in from', function() {
        const project = sheetFromFile(`${DIR}/replaceFromRegexEmbed.csv`);
        testErrors(project, []);
        testGrammar(project, [
            {"text":"aba","surface":"ava"},
            {"text":"apa","surface":"ava"}
        ]);
    });

    /*
    describe('Replace with a symbol in regex in pre', function() {
        const project = sheetFromFile(`${DIR}/replacePreRegexEmbed.csv`);
        testErrors(project, []);
        testGrammar(project, [
            {"text":"aba","surface":"ava"},
            {"text":"arba","surface":"arba"},
            {"text":"iba","surface":"iva"}
        ]);
    });
    
    describe('Replace with a symbol in regex in post', function() {
        const project = sheetFromFile(`${DIR}/replacePostRegexEmbed.csv`);
        testErrors(project, []);
        testGrammar(project, [
            {"text":"aba","surface":"ava"},
            {"text":"abra","surface":"abra"},
            {"text":"abi","surface":"avi"}
        ]);
    });
    
    /*
    describe('Replace with a multi-tape symbol in regex in post', function() {
        const project = sheetFromFile(`${DIR}/replacePostRegexMultiTape.csv`);
        testErrors(project, []);
        testGrammar(project, [
            {"text":"aba","surface":"ava"},
            {"text":"abra","surface":"abra"},
            {"text":"abi","surface":"avi"}
        ]);
    }); */

});