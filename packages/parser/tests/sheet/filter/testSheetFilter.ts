import { 
    testProject, ProjectTest, 
    Error, Warning 
} from "../testSheetUtil";

const DIR = "filter";

function test(params: Partial<ProjectTest>): () => void {
    return function() {
        return testProject({ dir: DIR, ...params });
    };
}

describe(`Sheets ${DIR}`, function() {

    describe('1. Simple equals', test({
        id: "1",
        results: [
            { pos:"v", text:"goo"},
            { pos:"v", text:"foo"}
        ]
    }));

    describe('2. Equals with an empty-string condition', test({
        id: "2",
        results: [
            { text:"mooba", gloss:"jump"},
            { text:"fooba", gloss:"run"},
        ]
    }));

    describe('4. Equals to the left of a sequence', test({
        id: "4",
        results: [
            { text: "foobaz", gloss: "run[2SG]", subj: "[2SG]" },
            { text: "moobaz", gloss: "jump[2SG]", subj: "[2SG]" }
        ]
    }));
    
    describe('5. Equals containing escaped parens', test({
        id: "5",
        results: [
            { text: "foobaz", gloss: "run(2SG)", subj: "(2SG)" },
            { text: "moobaz", gloss: "jump(2SG)", subj: "(2SG)" }
        ]
    }));

    describe('6. Nested equals', test({
        id: "6",
        results: [
            { text: "foobaz", gloss: "run[2SG]", subj: "[2SG]", trans: "INTR" },
            { text: "moobaz", gloss: "jump[2SG]", subj: "[2SG]", trans: "INTR" }
        ]
    }));
    
    describe('7. Equals with alt value', test({
        id: "7",
        results: [
            { text: "foobaz", gloss: "run[2SG]", subj: "[2SG]" },
            { text: "moobaz", gloss: "jump[2SG]", subj: "[2SG]" },
            { text: "foo", gloss: "run[3SG]", subj: "[3SG]" },
            { text: "moo", gloss: "jump[3SG]", subj: "[3SG]" }
        ]
    }));

    describe('8. Equals with an alt and empty-string', test({
        id: "8",
        results: [
            { text: "foobaz", gloss: "run[2SG]", subj: "[2SG]" },
            { text: "moobaz", gloss: "jump[2SG]", subj: "[2SG]" },
            { text:"mooba", gloss:"jump"},
            { text:"fooba", gloss:"run"}
        ]
    }));

    describe('9. Equals with a sequence', test({
        id: "9",
        results: [
            { text: "foobaz", gloss: "run[2SG]", subj: "[2SG]" },
            { text: "moobaz", gloss: "jump[2SG]", subj: "[2SG]" }
        ]
    }));

    describe('10. Equals with a sequence with alt', test({
        id: "10",
        results: [
            { text:"moobar", gloss:"jump[1SG]", subj:"[1SG]"},
            { text:"moobaz", gloss:"jump[2SG]", subj:"[2SG]"},
            { text:"foobar", gloss:"run[1SG]", subj:"[1SG]"},
            { text:"foobaz", gloss:"run[2SG]", subj:"[2SG]"}
        ]
    }));


    describe('11. Equals with a sequence with not', test({
        id: "11",
        results: [
            { text:"moobar", gloss:"jump[1SG]", subj:"[1SG]"},
            { text:"moobaz", gloss:"jump[2SG]", subj:"[2SG]"},
            { text:"foobar", gloss:"run[1SG]", subj:"[1SG]"},
            { text:"foobaz", gloss:"run[2SG]", subj:"[2SG]"}
        ]
    }));

    describe('12. Equals with a repetition', test({
        id: "12",
        results: [
            { gloss:"be" },
            { text:"foo", gloss:"run"},
            { text:"foofoo", gloss:"run.impf"}
        ]
    }));

    describe('13. Equals with a sequence with repetition', test({
        id: "13",
        results: [
            { text:"bar", gloss:"be"},
            { text:"foobar", gloss:"run"},
            { text:"foofoobar", gloss:"run.impf"}
        ]
    }));


    describe('14. Equals with a question', test({
        id: "14",
        results: [
            { gloss:"be" },
            { text:"foo", gloss:"run"},
        ]
    }));
    

    describe('15. Equals with a sequence with question', test({
        id: "15",
        results: [
            { text:"bar", gloss:"be"},
            { text:"foobar", gloss:"run"},
        ]
    }));

    
    describe('16. Equals with a plus', test({
        id: "16",
        results: [
            { text:"foo", gloss:"run"},
            { text:"foofoo", gloss:"run.impf"}
        ]
    }));


    describe('17. Equals with a sequence with plus', test({
        id: "17",
        results: [
            { text:"foobar", gloss:"run"},
            { text:"foofoobar", gloss:"run.impf"}
        ]
    }));
    
    describe('18. Equals with not value', test({
        id: "18",
        results: [
            { text: "foobaz", gloss: "run[2SG]", subj: "[2SG]" },
            { text: "moobaz", gloss: "jump[2SG]", subj: "[2SG]" },
            { text: "foo", gloss: "run[3SG]", subj: "[3SG]" },
            { text: "moo", gloss: "jump[3SG]", subj: "[3SG]" }
        ]
    }));

    describe('19. Equals with escaped ~', test({
        id: "19",
        results: [
            { gloss:"jump~[1SG]", text:"moobap", subj:"~[1SG]"},
            { gloss:"run~[1SG]",  text:"foobap", subj:"~[1SG]"}
        ]
    }));

    describe('20. Equals with neither value', test({
        id: "20",
        results: [
            { text: "foobaz", gloss: "run[2SG]", subj: "[2SG]" },
            { text: "moobaz", gloss: "jump[2SG]", subj: "[2SG]" }
        ]
    }));

    describe('21. Equals with a slash header', test({
        id: "21",
        errors: [ Error(6,3), Error(7,3) ],
        results: [
            {"text":"goo","pos":"v","class":"n"},
            {"text":"moo","pos":"n","class":"n"},
            {"text":"foo","pos":"v","class":"v"}
        ]
    }));

    describe('22. Equals with dot', test({
        id: "22",
        results: [
            { text: "foo", gloss: "run" },
            { text: "moo", gloss: "eat" },
            { text: "goo", gloss: "jump" },
        ]
    }));

    describe('23. Equals with dot in parens', test({
        id: "23",
        results: [
            { text: "foo", gloss: "run" },
            { text: "moo", gloss: "eat" },
            { text: "goo", gloss: "jump" },
        ]
    }));

    describe('24. Equals with dot star', test({
        id: "24",
        results: [
            { text: "foo", gloss: "run" },
            { text: "foofoo", gloss: "run.impf" },
        ]
    }));

    describe('25. Equals embed', test({
        id: "25",
        results: [
            { text: "foobaz", gloss: "run[2SG]", subj: "[2SG]" },
            { text: "moobaz", gloss: "jump[2SG]", subj: "[2SG]" },
            { text: "foo", gloss: "run[3SG]", subj: "[3SG]" },
            { text: "moo", gloss: "jump[3SG]", subj: "[3SG]" }
        ]
    }));

    describe('26. Equals embed with a join', test({
        id: "26",
        errors: [ Error(13,3) ],
        results: [
            {"gloss":"[3SG]","subj":"[3SG]"},
            {"gloss":"[2SG]","subj":"[2SG]","text":"baz"},
            {"gloss":"[1SG]","subj":"[1SG]","text":"bar"}   
        ]
    }));

    describe('27. Equals embed where the symbol is defined later', test({
        id: "27",
        results: [
            {"text":"foobask","gloss":"climb[1SG]"},
            {"text":"foobazk","gloss":"jump[1SG]"},
            {"text":"foobarq","gloss":"run[1SG]"}
        ]
    }));

    describe('28. Equals with not embed', test({
        id: "28",
        results: [
            {gloss: "run[1SG]", subj: "[1SG]", text: "foobar"},
            {gloss: "jump[1SG]", subj: "[1SG]", text: "moobar"}
        ]
    }));

    describe('29. starts', test({
        id: "29",
        results: [
            { text: "umfoo", gloss: "[1SG]run" },
            { text: "ungoo", gloss: "[1SG]climb" }
        ]
    }));

    describe('30. starts empty string', test({
        id: "30",
        results: [
            { text: "unfoo", gloss: "[1SG]run" },
            { text: "ungoo", gloss: "[1SG]climb" }  
        ]
    }));
    
    describe('31. starts with alt value', test({
        id: "31",
        results: [
            { text: "umfoo", gloss: "[1SG]run" },
            { text: "ummoo", gloss: "[1SG]jump" },
            { text: "ungoo", gloss: "[1SG]climb" }  
        ]
    }));
    
    describe('32. starts with not value', test({
        id: "32",
        results: [
            { text: "umfoo", gloss: "[1SG]run" },
            { text: "ummoo", gloss: "[1SG]jump" },
            { text: "ungoo", gloss: "[1SG]climb" }
        ]
    }));

    describe('33. starts with not value, embedded', test({
        id: "33",
        results: [
            { text: "umfoo", gloss: "[1SG]run" },
            { text: "ummoo", gloss: "[1SG]jump" },
            { text: "ungoo", gloss: "[1SG]climb" }
        ]
    }));

    describe('34. starts and equals modifying same embed', test({
        id: "34",
        results: [
            { text: "umfoo", gloss: "[1SG]run", trans: "[INTR]" },
            { text: "ungoo", gloss: "[1SG]climb", trans: "[INTR]" },
            { text: "moo", gloss: "[1SG]see", trans: "[TR]" } 
        ]
    }));
    
    describe('35. starts embed', test({
        id: "35",
        results: [
            { text: "umfoo", gloss: "[1SG]run" },
            { text: "ummoo", gloss: "[1SG]jump" },
            { text: "ungoo", gloss: "[1SG]climb" }
        ]
    }));

    describe('36. starts embed where the symbol is defined later', test({
        id: "36",
        results: [
            { text: "umfoo", gloss: "[1SG]run" },
            { text: "ummoo", gloss: "[1SG]jump" },
            { text: "ungoo", gloss: "[1SG]climb" }        
        ]
    }));

    describe('37. starts negated embed', test({
        id: "37",
        results: [
            { text: "umfoo", gloss: "[1SG]run" },
            { text: "ummoo", gloss: "[1SG]jump" },
            { text: "ungoo", gloss: "[1SG]climb" }   
        ]
    }));
    
    describe('38. starts embed with a hidden join', test({
        id: "38",
        errors: [ Error(15,4) ],
        results: [
            {"text":"umgoo","gloss":"[1SG]climb"},
            {"text":"ummoo","gloss":"[1SG]jump"},
            {"text":"umfoo","gloss":"[1SG]run"} 
        ]
    }));

    describe('39. equals and starts modifying same embed', test({
        id: "39",
        results: [
            { text: "umfoo", gloss: "[1SG]run", trans: "[INTR]" },
            { text: "ungoo", gloss: "[1SG]climb", trans: "[INTR]" },
            { text: "moo", gloss: "[1SG]see", trans: "[TR]" },
        ]
    }));
    
    describe('40. ends', test({
        id: "40",
        results: [
            { text: "foobarq", gloss: "run[1SG]" },
            { text: "foobazk", gloss: "jump[1SG]" }        
        ]
    }));

    describe('41. ends empty string', test({
        id: "41",
        results: [
            { text: "foobarq", gloss: "run[1SG]" },
            { text: "foobazq", gloss: "jump[1SG]" }
        ]
    }));

    describe('42. ends with alt value', test({
        id: "42",
        results: [
            { text: "foobarq", gloss: "run[1SG]" },
            { text: "foobazk", gloss: "jump[1SG]" },
            { text: "foobask", gloss: "climb[1SG]" }           
        ]
    }));

    describe('43. ends with not value', test({
        id: "43",
        results: [
            { text: "foobarq", gloss: "run[1SG]" },
            { text: "foobazk", gloss: "jump[1SG]" },
            { text: "foobask", gloss: "climb[1SG]" }      
        ]
    }));

    describe('44. ends and equals modifying same embed', test({
        id: "44",
        results: [
            { text: "foobarq", gloss: "run[1SG]", trans: "INTR" },
            { text: "foobazk", gloss: "jump[1SG]", trans: "INTR" },
            { text: "foobas", gloss: "see[1SG]", trans: "TR" }      
        ]
    }));
    
    describe('45. equals and ends modifying same embed', test({
        id: "45",
        results: [
            { text: "foobarq", gloss: "run[1SG]", trans: "INTR" },
            { text: "foobazk", gloss: "jump[1SG]", trans: "INTR" },
            { text: "foobas", gloss: "see[1SG]", trans: "TR" }       
        ]
    }));

    describe('46. starts and ends modifying same embed', test({
        id: "46",
        results: [
            { text: "umfooz", gloss: "[1SG]jump" }
        ]
    }));

    describe('47. ends embed', test({
        id: "47",
        results: [
            { text: "foobarq", gloss: "run[1SG]" },
            { text: "foobazk", gloss: "jump[1SG]" },
            { text: "foobask", gloss: "climb[1SG]" }
        ]
    }));

    describe('48. ends embed where the symbol is defined later', test({
        id: "48",
        results: [
            { text: "foobarq", gloss: "run[1SG]" },
            { text: "foobazk", gloss: "jump[1SG]" },
            { text: "foobask", gloss: "climb[1SG]" }           
        ]
    }));

    describe('49. ends negated embed', test({
        id: "49",
        results: [
            { text: "foobar", gloss: "run[1SG]" },
            { text: "foobor", gloss: "jump[1SG]" },
            { text: "foobaru", gloss: "climb[1SG]" }     
        ]
    }));

    describe('50. ends complex embed', test({
        id: "50",
        results: [
            { text: "foobar", gloss: "run[1SG]" },
            { text: "foobor", gloss: "jump[1SG]" },
            { text: "foobart", gloss: "climb[1SG]" },
            { text: "foobatu", gloss: "eat[1SG]" }      
        ]
    }));
    
    describe('51. Contains', test({
        id: "51",
        results: [
            { text: "foobaz", gloss: "run[2SG.SUBJ]", subj: "[2SG.SUBJ]" },
            { text: "moobaz", gloss: "jump[2SG.SUBJ]", subj: "[2SG.SUBJ]" }
        ]
    }));

    describe('52. Contains empty string', test({
        id: "52",
        results: [
            { text:"moobaz", gloss:"jump[2SG.SUBJ]", subj:"[2SG.SUBJ]"},
            { text:"moobar", gloss:"jump[1SG.SUBJ]", subj:"[1SG.SUBJ]"},
            { text:"foobaz", gloss:"run[2SG.SUBJ]", subj:"[2SG.SUBJ]"},
            { text:"foobar", gloss:"run[1SG.SUBJ]", subj:"[1SG.SUBJ]"}
        ]
    }));

    describe('53. Contains with alt value', test({
        id: "53",
        results: [
            { text: "foobaz", gloss: "run[2SG.SUBJ]", subj: "[2SG.SUBJ]" },
            { text: "moobaz", gloss: "jump[2SG.SUBJ]", subj: "[2SG.SUBJ]" },
            { text: "foo", gloss: "run[3SG.SUBJ]", subj: "[3SG.SUBJ]" },
            { text: "moo", gloss: "jump[3SG.SUBJ]", subj: "[3SG.SUBJ]" }   
        ]
    }));
    
    describe('54. Contains with embed', test({
        id: "54",
        results: [
            { text: "foobaz", gloss: "run[2SG.SUBJ]", subj: "[2SG.SUBJ]" },
            { text: "moobaz", gloss: "jump[2SG.SUBJ]", subj: "[2SG.SUBJ]" },
            { text: "foo", gloss: "run[3SG.SUBJ]", subj: "[3SG.SUBJ]" },
            { text: "moo", gloss: "jump[3SG.SUBJ]", subj: "[3SG.SUBJ]" }
        ]
    }));

    describe('55. Contains where the condition is defined after', test({
        id: "55",
        results: [
            { text: "foobaz", gloss: "run[2SG.SUBJ]", subj: "[2SG.SUBJ]" },
            { text: "moobaz", gloss: "jump[2SG.SUBJ]", subj: "[2SG.SUBJ]" },
            { text: "foo", gloss: "run[3SG.SUBJ]", subj: "[3SG.SUBJ]" },
            { text: "moo", gloss: "jump[3SG.SUBJ]", subj: "[3SG.SUBJ]" }
        ]
    }));

    /*
    describe('HighVowel tests 1', test({
        id: "11",
        results: [
            
        ]
    }));
    function() {
        const project = sheetFromFile(`${DIR}/highVowel1.csv`);
        testErrors(project, []);
        testGenerate(project, [
            {"gloss":"[3SG]sing","text":"umurf"},
            {"gloss":"[3SG]climb","text":"umirf"},
            {"gloss":"[2PL]sing","text":"omurf"},
            {"gloss":"[2PL]climb","text":"omirf"},
            {"gloss":"[2SG]sing","text":"imurf"},
            {"gloss":"[2SG]climb","text":"imirf"},
            {"gloss":"[1PL]sing","text":"emurf"},
            {"gloss":"[1PL]climb","text":"emirf"},
            {"gloss":"[1SG]sing","text":"amurf"},
            {"gloss":"[1SG]climb","text":"amirf"}
        ]);
    }); 
    
    describe('HighVowel tests 2', test({
        id: "11",
        results: [
            
        ]
    }));
    function() {
        const project = sheetFromFile(`${DIR}/highVowel2.csv`);
        testErrors(project, []);
        testGenerate(project, [
            {"gloss":"[3SG]sing","text":"umurf"},
            {"gloss":"[3SG]climb","text":"umirf"},
            {"gloss":"[2SG]sing","text":"imurf"},
            {"gloss":"[2SG]climb","text":"imirf"}
        ]);
    }); 

    describe('HighVowel tests 2b', test({
        id: "11",
        results: [
            
        ]
    }));
    function() {
        const project = sheetFromFile(`${DIR}/highVowel2b.csv`);
        testErrors(project, []);
        testGenerate(project, [
            {"gloss":"[3SG]sing","text":"umurf"},
            {"gloss":"[3SG]climb","text":"umirf"},
            {"gloss":"[2SG]sing","text":"imurf"},
            {"gloss":"[2SG]climb","text":"imirf"}
        ]);
    }); 

    describe('HighVowel tests 3', test({
        id: "11",
        results: [
            
        ]
    }));
    function() {
        const project = sheetFromFile(`${DIR}/highVowel3.csv`);
        testErrors(project, []);
        testGenerate(project, [
            {"gloss":"[2PL]sing","text":"omurf"},
            {"gloss":"[2PL]climb","text":"omirf"},
            {"gloss":"[1PL]sing","text":"emurf"},
            {"gloss":"[1PL]climb","text":"emirf"},
            {"gloss":"[1SG]sing","text":"amurf"},
            {"gloss":"[1SG]climb","text":"amirf"}
        ]);
    }); 

    describe('HighVowel tests 3b', test({
        id: "11",
        results: [
            
        ]
    }));
    function() {
        const project = sheetFromFile(`${DIR}/highVowel3b.csv`);
        testErrors(project, []);
        testGenerate(project, [
            {"gloss":"[2PL]sing","text":"omurf"},
            {"gloss":"[2PL]climb","text":"omirf"},
            {"gloss":"[1PL]sing","text":"emurf"},
            {"gloss":"[1PL]climb","text":"emirf"},
            {"gloss":"[1SG]sing","text":"amurf"},
            {"gloss":"[1SG]climb","text":"amirf"}
        ]);
    }); 
    
    describe('HighVowel tests 4', test({
        id: "11",
        results: [
            
        ]
    }));
    function() {
        const project = sheetFromFile(`${DIR}/highVowel4.csv`, VERBOSE_DEBUG);
        testErrors(project, []);
        testGenerate(project, [
            {"gloss":"[2PL]sing","text":"omurf"},
            {"gloss":"[2PL]climb","text":"omirf"},
            {"gloss":"[1PL]sing","text":"emurf"},
            {"gloss":"[1PL]climb","text":"emirf"},
            {"gloss":"[1SG]sing","text":"amurf"},
            {"gloss":"[1SG]climb","text":"amirf"}
        ]);
    }); 

    describe('HighVowel tests 4b', test({
        id: "11",
        results: [
            
        ]
    }));
    function() {
        const project = sheetFromFile(`${DIR}/highVowel4b.csv`);
        testErrors(project, []);
        testGenerate(project, [
            {"gloss":"[2PL]sing","text":"omurf"},
            {"gloss":"[2PL]climb","text":"omirf"},
            {"gloss":"[1PL]sing","text":"emurf"},
            {"gloss":"[1PL]climb","text":"emirf"},
            {"gloss":"[1SG]sing","text":"amurf"},
            {"gloss":"[1SG]climb","text":"amirf"}
        ]);
    }); 

    /*
    describe('Contains with not value', test({
        id: "11",
        results: [
            
        ]
    }));
    function() {
        const project = sheetFromFile(`${DIR}/containsNot.csv`);
        testErrors(project, []);
        testGenerate(project, [
            { text: "foobaz", gloss: "run[2SG.SUBJ]", subj: "[2SG.SUBJ]" },
            { text: "moobaz", gloss: "jump[2SG.SUBJ]", subj: "[2SG.SUBJ]" },
            { text: "foo", gloss: "run[3SG.SUBJ]", subj: "[3SG.SUBJ]" },
            { text: "moo", gloss: "jump[3SG.SUBJ]", subj: "[3SG.SUBJ]" }
        ]);
    }); 
    */

    /*
    describe('Contains with negated embed', test({
        id: "11",
        results: [
            
        ]
    }));
    function() {

        const project = sheetFromFile(`${DIR}/containsNegatedEmbed.csv`);
        testErrors(project, []);
        testGenerate(project, [
            { text: "foobar", gloss: "run[1SG.SUBJ]", subj: "[1SG.SUBJ]" },
            { text: "moobar", gloss: "jump[1SG.SUBJ]", subj: "[1SG.SUBJ]" },
        ]);
    });

    */

    
    describe('E1. Equals with an ill-formed filter', test({
        id: "E1",
        errors: [ Error(7,3) ],
        results: [
            { text:"goo", pos:"v"},
            { text:"moo", pos:"n"},
            { text:"foo", pos:"v"}
        ]
    }));
    
    describe('E2. Equals where the filter references a non-existent tape', test({
        id: "E2",
        errors: [ Error(7,3) ],
        results: [
            { text:"goo"},
            { text:"moo"},
            { text:"foo"}
        ]
    }));
    
    describe('E3. Starts with an ill-formed filter', test({
        id: "E3",
        errors: [ Error(7,3) ],
        results: [
            { text:"goo", pos:"verb"},
            { text:"moo", pos:"noun"},
            { text:"foo", pos:"verb"}
        ]
    }));
    
    describe('E4. Starts where the filter references a non-existent tape', test({
        id: "E4",
        errors: [ Error(7,3) ],
        results: [
            { text:"goo"},
            { text:"moo"},
            { text:"foo"}
        ]
    }));

    describe('E5. Ends with an ill-formed filter', test({
        id: "E5",
        errors: [ Error(7,3) ],
        results: [
            { text:"goo", pos:"verb"},
            { text:"moo", pos:"noun"},
            { text:"foo", pos:"verb"}
        ]
    }));
    
    describe('E6. Ends where the filter references a non-existent tape', test({
        id: "E6",
        errors: [ Error(7,3) ],
        results: [
            { text:"goo"},
            { text:"moo"},
            { text:"foo"}
        ]
    }));
});


