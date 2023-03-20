import { testGrammar, testErrors, sheetFromFile, testHasVocab } from "../../testUtil";
import * as path from 'path';
import { SILENT, VERBOSE_DEBUG, VERBOSE_GRAMMAR } from "../../../src/util";

const DIR = `${path.dirname(module.filename)}/csvs`;

describe(`${path.basename(module.filename)}`, function() {

    describe('Simple equals', function() {
        const project = sheetFromFile(`${DIR}/simpleEquals.csv`);
        testErrors(project, []);
        testGrammar(project, [
            { pos:"v", text:"goo"},
            { pos:"v", text:"foo"}
        ]);
    });

    describe('Equals with an empty-string condition', function() {
        const project = sheetFromFile(`${DIR}/equalsEmptyString.csv`);
        testErrors(project, []);
        testGrammar(project, [
            { text:"mooba", gloss:"jump"},
            { text:"fooba", gloss:"run"},
        ]);
    });

    describe('Equals with an ill-formed filter', function() {
        const project = sheetFromFile(`${DIR}/illFormedFilter.csv`);
        testErrors(project, [
            ["illFormedFilter", 7, 3, "error"]
        ]);
        testGrammar(project, [
            { text:"goo", pos:"v"},
            { text:"moo", pos:"n"},
            { text:"foo", pos:"v"}
        ]);
    });

    describe('Equals to the left of a sequence', function() {
        const project = sheetFromFile(`${DIR}/equalsGrammar.csv`);
        testErrors(project, []);
        testGrammar(project, [
            { text: "foobaz", gloss: "run[2SG]", subj: "[2SG]" },
            { text: "moobaz", gloss: "jump[2SG]", subj: "[2SG]" }
        ]);
    });

    describe('Equals containing escaped parens', function() {
        const project = sheetFromFile(`${DIR}/equalsWithEscapes.csv`);
        testErrors(project, []);
        testGrammar(project, [
            { text: "foobaz", gloss: "run(2SG)", subj: "(2SG)" },
            { text: "moobaz", gloss: "jump(2SG)", subj: "(2SG)" }
        ]);
    });

    describe('Nested equals', function() {
        const project = sheetFromFile(`${DIR}/nestedEquals.csv`);
        testErrors(project, []);
        testGrammar(project, [
            { text: "foobaz", gloss: "run[2SG]", subj: "[2SG]", trans: "INTR" },
            { text: "moobaz", gloss: "jump[2SG]", subj: "[2SG]", trans: "INTR" }
        ]);
    });
    
    describe('Equals with alt value', function() {
        const project = sheetFromFile(`${DIR}/equalsOr.csv`);
        testErrors(project, []);
        testGrammar(project, [
            { text: "foobaz", gloss: "run[2SG]", subj: "[2SG]" },
            { text: "moobaz", gloss: "jump[2SG]", subj: "[2SG]" },
            { text: "foo", gloss: "run[3SG]", subj: "[3SG]" },
            { text: "moo", gloss: "jump[3SG]", subj: "[3SG]" }
        ]);
    });

    describe('Equals with an alt and empty-string', function() {
        const project = sheetFromFile(`${DIR}/equalsOrEmptyString.csv`);
        testErrors(project, []);
        testGrammar(project, [
            { text: "foobaz", gloss: "run[2SG]", subj: "[2SG]" },
            { text: "moobaz", gloss: "jump[2SG]", subj: "[2SG]" },
            { text:"mooba", gloss:"jump"},
            { text:"fooba", gloss:"run"},
        ]);
    });

    describe('Equals with a sequence', function() {
        const project = sheetFromFile(`${DIR}/equalsSeq.csv`);
        testErrors(project, []);
        testGrammar(project, [
            { text: "foobaz", gloss: "run[2SG]", subj: "[2SG]" },
            { text: "moobaz", gloss: "jump[2SG]", subj: "[2SG]" }
        ]);
    });
    
    describe('Equals with a sequence with alt', function() {
        const project = sheetFromFile(`${DIR}/equalsSeqOr.csv`);
        testErrors(project, []);
        testGrammar(project, [
            { text:"moobar", gloss:"jump[1SG]", subj:"[1SG]"},
            { text:"moobaz", gloss:"jump[2SG]", subj:"[2SG]"},
            { text:"foobar", gloss:"run[1SG]", subj:"[1SG]"},
            { text:"foobaz", gloss:"run[2SG]", subj:"[2SG]"}
        ]);
    });

    describe('Equals with a sequence with not', function() {
        const project = sheetFromFile(`${DIR}/equalsSeqNot.csv`);
        testErrors(project, []);
        testGrammar(project, [
            { text:"moobar", gloss:"jump[1SG]", subj:"[1SG]"},
            { text:"moobaz", gloss:"jump[2SG]", subj:"[2SG]"},
            { text:"foobar", gloss:"run[1SG]", subj:"[1SG]"},
            { text:"foobaz", gloss:"run[2SG]", subj:"[2SG]"}
        ]);
    });

    describe('Equals with a repetition', function() {
        const project = sheetFromFile(`${DIR}/equalsRep.csv`);
        testErrors(project, []);
        testGrammar(project, [
            { gloss:"be" },
            { text:"foo", gloss:"run"},
            { text:"foofoo", gloss:"run.impf"}
        ]);
    });

    describe('Equals with a sequence with repetition', function() {
        const project = sheetFromFile(`${DIR}/equalsSeqRep.csv`);
        testErrors(project, []);
        testGrammar(project, [
            { text:"bar", gloss:"be"},
            { text:"foobar", gloss:"run"},
            { text:"foofoobar", gloss:"run.impf"}
        ]);
    });

    describe('Equals with a question', function() {
        const project = sheetFromFile(`${DIR}/equalsQues.csv`);
        testErrors(project, []);
        testGrammar(project, [
            { gloss:"be" },
            { text:"foo", gloss:"run"},
        ]);
    });

    describe('Equals with a sequence with question', function() {
        const project = sheetFromFile(`${DIR}/equalsSeqQues.csv`);
        testErrors(project, []);
        testGrammar(project, [
            { text:"bar", gloss:"be"},
            { text:"foobar", gloss:"run"},
        ]);
    });

    describe('Equals with a plus', function() {
        const project = sheetFromFile(`${DIR}/equalsPlus.csv`);
        testErrors(project, []);
        testGrammar(project, [
            { text:"foo", gloss:"run"},
            { text:"foofoo", gloss:"run.impf"}
        ]);
    });

    describe('Equals with a sequence with plus', function() {
        const project = sheetFromFile(`${DIR}/equalsSeqPlus.csv`);
        testErrors(project, []);
        testGrammar(project, [
            { text:"foobar", gloss:"run"},
            { text:"foofoobar", gloss:"run.impf"}
        ]);
    });

    
    describe('Equals with not value', function() {
        const project = sheetFromFile(`${DIR}/equalsNot.csv`);
        testErrors(project, []);
        testGrammar(project, [
            { text: "foobaz", gloss: "run[2SG]", subj: "[2SG]" },
            { text: "moobaz", gloss: "jump[2SG]", subj: "[2SG]" },
            { text: "foo", gloss: "run[3SG]", subj: "[3SG]" },
            { text: "moo", gloss: "jump[3SG]", subj: "[3SG]" }
        ]);
    });

    describe('Equals with escaped ~', function() {
        const project = sheetFromFile(`${DIR}/equalsEscapedNot.csv`);
        testErrors(project, []);
        testGrammar(project, [
            { gloss:"jump~[1SG]", text:"moobap", subj:"~[1SG]"},
            { gloss:"run~[1SG]",  text:"foobap", subj:"~[1SG]"}
        ]);
    });

    describe('Equals with neither value', function() {
        const project = sheetFromFile(`${DIR}/equalsNotOr.csv`);
        testErrors(project, []);
        testGrammar(project, [
            { text: "foobaz", gloss: "run[2SG]", subj: "[2SG]" },
            { text: "moobaz", gloss: "jump[2SG]", subj: "[2SG]" }
        ]);
    });

    describe('Equals with a slash header', function() {
        const project = sheetFromFile(`${DIR}/equalsSlash.csv`);
        testErrors(project, [
            ["equalsSlash", 6, 3, "error"],
            ["equalsSlash", 7, 3, "error"],
        ]);
        testGrammar(project, [
            {"text":"goo","pos":"v","class":"n"},
            {"text":"moo","pos":"n","class":"n"},
            {"text":"foo","pos":"v","class":"v"}
        ]);
    });

    describe('Equals with dot', function() {
        const project = sheetFromFile(`${DIR}/equalsDot.csv`);
        testErrors(project, []);
        testGrammar(project, [
            { text: "foo", gloss: "run" },
            { text: "moo", gloss: "eat" },
            { text: "goo", gloss: "jump" },
        ]);
    });

    describe('Equals with dot in parens', function() {
        const project = sheetFromFile(`${DIR}/equalsDotInParens.csv`);
        testErrors(project, []);
        testGrammar(project, [
            { text: "foo", gloss: "run" },
            { text: "moo", gloss: "eat" },
            { text: "goo", gloss: "jump" },
        ]);
    });

    describe('Equals with dot star', function() {
        const project = sheetFromFile(`${DIR}/equalsDotStar.csv`);
        testErrors(project, []);
        testGrammar(project, [
            { text: "foo", gloss: "run" },
            { text: "foofoo", gloss: "run.impf" },
        ]);
    });

    describe('Equals embed', function() {
        const project = sheetFromFile(`${DIR}/equalsEmbed.csv`);
        testErrors(project, []);
        testGrammar(project, [
            { text: "foobaz", gloss: "run[2SG]", subj: "[2SG]" },
            { text: "moobaz", gloss: "jump[2SG]", subj: "[2SG]" },
            { text: "foo", gloss: "run[3SG]", subj: "[3SG]" },
            { text: "moo", gloss: "jump[3SG]", subj: "[3SG]" }
        ]);
    }); 

    describe('Equals embed with a join', function() {
        const project = sheetFromFile(`${DIR}/equalsEmbedJoin.csv`, VERBOSE_GRAMMAR|VERBOSE_DEBUG);
        testErrors(project, []);
        testHasVocab(project, {text: 2, subj: 3});
        testGrammar(project, [
            { text: "baz", gloss: "[2SG]", subj: "[2SG]" },
        ]);
    }); 

    describe('Equals embed where the symbol is defined later', function() {
        const project = sheetFromFile(`${DIR}/equalsEmbedAfter.csv`);
        testErrors(project, []);
        testGrammar(project, [
            { text: "foobaz", gloss: "run[2SG]", subj: "[2SG]" },
            { text: "moobaz", gloss: "jump[2SG]", subj: "[2SG]" },
            { text: "foo", gloss: "run[3SG]", subj: "[3SG]" },
            { text: "moo", gloss: "jump[3SG]", subj: "[3SG]" }
        ]);
    });

    describe('Equals with not embed', function() {
        const project = sheetFromFile(`${DIR}/equalsNegatedEmbed.csv`);
        testErrors(project, []);
        testGrammar(project, [
            {gloss: "run[1SG]", subj: "[1SG]", text: "foobar"},
            {gloss: "jump[1SG]", subj: "[1SG]", text: "moobar"}
        ]);
    });

    describe('starts', function() {
        const project = sheetFromFile(`${DIR}/startsGrammar.csv`);
        testErrors(project, []);
        testGrammar(project, [
            { text: "umfoo", gloss: "[1SG]run" },
            { text: "ungoo", gloss: "[1SG]climb" }
        ]);
    });

    describe('starts empty string', function() {
        const project = sheetFromFile(`${DIR}/startsEmptyString.csv`);
        testErrors(project, []);
        testGrammar(project, [
            { text: "unfoo", gloss: "[1SG]run" },
            { text: "ungoo", gloss: "[1SG]climb" }
        ]);
    });
    
    describe('starts with alt value', function() {
        const project = sheetFromFile(`${DIR}/startsOr.csv`);
        testErrors(project, []);
        testGrammar(project, [
            { text: "umfoo", gloss: "[1SG]run" },
            { text: "ummoo", gloss: "[1SG]jump" },
            { text: "ungoo", gloss: "[1SG]climb" }
        ]);
    });
    
    describe('starts with not value', function() {
        const project = sheetFromFile(`${DIR}/startsNot.csv`);
        testErrors(project, []);
        testGrammar(project, [
            { text: "umfoo", gloss: "[1SG]run" },
            { text: "ummoo", gloss: "[1SG]jump" },
            { text: "ungoo", gloss: "[1SG]climb" }
        ]);
    });

    describe('starts with not value, embedded', function() {
        const project = sheetFromFile(`${DIR}/embeddedStartsNot.csv`);
        testErrors(project, []);
        testGrammar(project, [
            { text: "umfoo", gloss: "[1SG]run" },
            { text: "ummoo", gloss: "[1SG]jump" },
            { text: "ungoo", gloss: "[1SG]climb" }
        ]);
    });

    describe('starts and equals modifying same embed', function() {
        const project = sheetFromFile(`${DIR}/startsEquals.csv`);
        testErrors(project, []);
        testGrammar(project, [
            { text: "umfoo", gloss: "[1SG]run", trans: "[INTR]" },
            { text: "ungoo", gloss: "[1SG]climb", trans: "[INTR]" },
            { text: "moo", gloss: "[1SG]see", trans: "[TR]" }
        ]);
    });
    
    describe('starts embed', function() {
        const project = sheetFromFile(`${DIR}/startsEmbed.csv`);
        testErrors(project, []);
        testGrammar(project, [
            { text: "umfoo", gloss: "[1SG]run" },
            { text: "ummoo", gloss: "[1SG]jump" },
            { text: "ungoo", gloss: "[1SG]climb" }
        ]);
    });

    describe('starts embed where the symbol is defined later', function() {
        const project = sheetFromFile(`${DIR}/startsEmbedAfter.csv`);
        testErrors(project, []);
        testGrammar(project, [
            { text: "umfoo", gloss: "[1SG]run" },
            { text: "ummoo", gloss: "[1SG]jump" },
            { text: "ungoo", gloss: "[1SG]climb" }
        ]);
    }); 

    describe('starts negated embed', function() {
        const project = sheetFromFile(`${DIR}/startsNegatedEmbed.csv`);
        testErrors(project, []);
        testGrammar(project, [
            { text: "umfoo", gloss: "[1SG]run" },
            { text: "ummoo", gloss: "[1SG]jump" },
            { text: "ungoo", gloss: "[1SG]climb" }
        ]);
    });
    
    describe('starts embed with a hidden join', function() {
        const project = sheetFromFile(`${DIR}/startsEmbedJoin.csv`);
        testErrors(project, []);
        testGrammar(project, [
            { text: "umfoo", gloss: "[1SG]run" },
        ]);
    });

    describe('equals and starts modifying same embed', function() {
        const project = sheetFromFile(`${DIR}/equalsStarts.csv`);
        testErrors(project, []);
        testGrammar(project, [
            { text: "umfoo", gloss: "[1SG]run", trans: "[INTR]" },
            { text: "ungoo", gloss: "[1SG]climb", trans: "[INTR]" },
            { text: "moo", gloss: "[1SG]see", trans: "[TR]" },
        ]);
    });
    
    describe('ends', function() {
        const project = sheetFromFile(`${DIR}/endsGrammar.csv`);
        testErrors(project, []);
        testGrammar(project, [
            { text: "foobarq", gloss: "run[1SG]" },
            { text: "foobazk", gloss: "jump[1SG]" }
        ]);
    });

    describe('ends empty string', function() {
        const project = sheetFromFile(`${DIR}/endsEmptyString.csv`);
        testErrors(project, []);
        testGrammar(project, [
            { text: "foobarq", gloss: "run[1SG]" },
            { text: "foobazq", gloss: "jump[1SG]" }
        ]);
    });

    describe('ends with alt value', function() {
        const project = sheetFromFile(`${DIR}/endsOr.csv`);
        testErrors(project, []);
        testGrammar(project, [
            { text: "foobarq", gloss: "run[1SG]" },
            { text: "foobazk", gloss: "jump[1SG]" },
            { text: "foobask", gloss: "climb[1SG]" }
        ]);
    });

    describe('ends with not value', function() {
        const project = sheetFromFile(`${DIR}/endsNot.csv`);
        testErrors(project, []);
        testGrammar(project, [
            { text: "foobarq", gloss: "run[1SG]" },
            { text: "foobazk", gloss: "jump[1SG]" },
            { text: "foobask", gloss: "climb[1SG]" }
        ]);
    });

    describe('ends and equals modifying same embed', function() {
        const project = sheetFromFile(`${DIR}/endsEquals.csv`);
        testErrors(project, []);
        testGrammar(project, [
            { text: "foobarq", gloss: "run[1SG]", trans: "INTR" },
            { text: "foobazk", gloss: "jump[1SG]", trans: "INTR" },
            { text: "foobas", gloss: "see[1SG]", trans: "TR" }
        ]);
    });
    
    describe('equals and ends modifying same embed', function() {
        const project = sheetFromFile(`${DIR}/equalsEnds.csv`);
        testErrors(project, []);
        testGrammar(project, [
            { text: "foobarq", gloss: "run[1SG]", trans: "INTR" },
            { text: "foobazk", gloss: "jump[1SG]", trans: "INTR" },
            { text: "foobas", gloss: "see[1SG]", trans: "TR" }
        ]);
    });

    describe('starts and ends modifying same embed', function() {
        const project = sheetFromFile(`${DIR}/startsEnds.csv`);
        testErrors(project, []);
        testGrammar(project, [
            { text: "umfooz", gloss: "[1SG]jump" }
        ]);
    });
    describe('ends embed', function() {
        const project = sheetFromFile(`${DIR}/endsEmbed.csv`);
        testErrors(project, []);
        testGrammar(project, [
            { text: "foobarq", gloss: "run[1SG]" },
            { text: "foobazk", gloss: "jump[1SG]" },
            { text: "foobask", gloss: "climb[1SG]" }
        ]);
    });

    describe('ends embed where the symbol is defined later', function() {
        const project = sheetFromFile(`${DIR}/endsEmbedAfter.csv`);
        testErrors(project, []);
        testGrammar(project, [
            { text: "foobarq", gloss: "run[1SG]" },
            { text: "foobazk", gloss: "jump[1SG]" },
            { text: "foobask", gloss: "climb[1SG]" }
        ]);
    });

    describe('ends negated embed', function() {
        const project = sheetFromFile(`${DIR}/endsEmbedNot.csv`);
        testErrors(project, []);
        testGrammar(project, [
            { text: "foobar", gloss: "run[1SG]" },
            { text: "foobor", gloss: "jump[1SG]" },
            { text: "foobaru", gloss: "climb[1SG]" }
        ]);
    });

    describe('ends complex embed', function() {
        const project = sheetFromFile(`${DIR}/endsComplexEmbed.csv`);
        testErrors(project, []);
        testGrammar(project, [
            { text: "foobar", gloss: "run[1SG]" },
            { text: "foobor", gloss: "jump[1SG]" },
            { text: "foobart", gloss: "climb[1SG]" },
            { text: "foobatu", gloss: "eat[1SG]" }
        ]);
    });
    
    describe('Contains', function() {
        const project = sheetFromFile(`${DIR}/containsGrammar.csv`);
        testErrors(project, []);
        testGrammar(project, [
            { text: "foobaz", gloss: "run[2SG.SUBJ]", subj: "[2SG.SUBJ]" },
            { text: "moobaz", gloss: "jump[2SG.SUBJ]", subj: "[2SG.SUBJ]" }
        ]);
    });

    describe('Contains empty string', function() {
        const project = sheetFromFile(`${DIR}/containsEmptyString.csv`);
        testErrors(project, []);
        testGrammar(project, [
            { text:"moobaz", gloss:"jump[2SG.SUBJ]", subj:"[2SG.SUBJ]"},
            { text:"moobar", gloss:"jump[1SG.SUBJ]", subj:"[1SG.SUBJ]"},
            { text:"foobaz", gloss:"run[2SG.SUBJ]", subj:"[2SG.SUBJ]"},
            { text:"foobar", gloss:"run[1SG.SUBJ]", subj:"[1SG.SUBJ]"}
        ]);
    });

    describe('Contains with alt value', function() {
        const project = sheetFromFile(`${DIR}/containsOr.csv`);
        testErrors(project, []);
        testGrammar(project, [
            { text: "foobaz", gloss: "run[2SG.SUBJ]", subj: "[2SG.SUBJ]" },
            { text: "moobaz", gloss: "jump[2SG.SUBJ]", subj: "[2SG.SUBJ]" },
            { text: "foo", gloss: "run[3SG.SUBJ]", subj: "[3SG.SUBJ]" },
            { text: "moo", gloss: "jump[3SG.SUBJ]", subj: "[3SG.SUBJ]" }
        ]);
    });
    
    describe('Contains with embed', function() {
        const project = sheetFromFile(`${DIR}/containsEmbed.csv`);
        testErrors(project, []);
        testGrammar(project, [
            { text: "foobaz", gloss: "run[2SG.SUBJ]", subj: "[2SG.SUBJ]" },
            { text: "moobaz", gloss: "jump[2SG.SUBJ]", subj: "[2SG.SUBJ]" },
            { text: "foo", gloss: "run[3SG.SUBJ]", subj: "[3SG.SUBJ]" },
            { text: "moo", gloss: "jump[3SG.SUBJ]", subj: "[3SG.SUBJ]" }
        ]);
    });

    describe('Contains where the condition is defined after', function() {
        const project = sheetFromFile(`${DIR}/containsEmbedAfter.csv`);
        testErrors(project, []);
        testGrammar(project, [
            { text: "foobaz", gloss: "run[2SG.SUBJ]", subj: "[2SG.SUBJ]" },
            { text: "moobaz", gloss: "jump[2SG.SUBJ]", subj: "[2SG.SUBJ]" },
            { text: "foo", gloss: "run[3SG.SUBJ]", subj: "[3SG.SUBJ]" },
            { text: "moo", gloss: "jump[3SG.SUBJ]", subj: "[3SG.SUBJ]" }
        ]);
    }); 

    /*
    describe('Contains with not value', function() {
        const project = sheetFromFile(`${DIR}/containsNot.csv`);
        testErrors(project, []);
        testGrammar(project, [
            { text: "foobaz", gloss: "run[2SG.SUBJ]", subj: "[2SG.SUBJ]" },
            { text: "moobaz", gloss: "jump[2SG.SUBJ]", subj: "[2SG.SUBJ]" },
            { text: "foo", gloss: "run[3SG.SUBJ]", subj: "[3SG.SUBJ]" },
            { text: "moo", gloss: "jump[3SG.SUBJ]", subj: "[3SG.SUBJ]" }
        ]);
    }); 
    */

    /*
    describe('Contains with negated embed', function() {
        const project = sheetFromFile(`${DIR}/containsNegatedEmbed.csv`);
        testErrors(project, []);
        testGrammar(project, [
            { text: "foobar", gloss: "run[1SG.SUBJ]", subj: "[1SG.SUBJ]" },
            { text: "moobar", gloss: "jump[1SG.SUBJ]", subj: "[1SG.SUBJ]" },
        ]);
    });

    */
});


