import { testRuleContextID } from "./testParseUtils";

describe(`Parse rule context`, function() {

    // simple contexts
    testRuleContextID("1a", "a_b", "CONTEXT[a,b]");
    testRuleContextID("1b", "#a_b", "CONTEXT[#,a,b]");
    testRuleContextID("1c", "a_b#", "CONTEXT[a,b,#]");
    testRuleContextID("1d", "#a_b#", "CONTEXT[#,a,b,#]");

    // contexts with empty elements
    testRuleContextID("2a", "_b", "CONTEXT[,b]");
    testRuleContextID("2b", "#_b", "CONTEXT[#,,b]");
    testRuleContextID("2c", "_b#", "CONTEXT[,b,#]");
    testRuleContextID("2d", "#_b#", "CONTEXT[#,,b,#]");
    testRuleContextID("2e", "a_", "CONTEXT[a,]");
    testRuleContextID("2f", "#a_", "CONTEXT[#,a,]");
    testRuleContextID("2g", "a_#", "CONTEXT[a,,#]");
    testRuleContextID("2h", "#a_#", "CONTEXT[#,a,,#]");
    testRuleContextID("2i", "_", "CONTEXT[,]");
    testRuleContextID("2j", "#_", "CONTEXT[#,,]");
    testRuleContextID("2k", "_#", "CONTEXT[,,#]");
    testRuleContextID("2l", "#_#", "CONTEXT[#,,,#]");

    // regexes in the elements
    testRuleContextID("3a", "a*_b|c", "CONTEXT[STAR[a],OR[b,c]]");
    testRuleContextID("3b", "a|b_c*", "CONTEXT[OR[a,b],STAR[c]]");

    // escaped octothorpe or underscore in the regexes
    testRuleContextID("4a", "\\__b", "CONTEXT[_,b]");
    testRuleContextID("4b", "a_\\_", "CONTEXT[a,_]");
    testRuleContextID("4c", "\\__\\_", "CONTEXT[_,_]");
    testRuleContextID("4d", "\\#_b", "CONTEXT[#,b]");
    testRuleContextID("4e", "a_\\#", "CONTEXT[a,#]");
    testRuleContextID("4f", "\\#_\\#", "CONTEXT[#,#]");

    // unescaped octothorpe or underscore in the regexes
    testRuleContextID("5a", "__b", "ε", 1);
    testRuleContextID("5b", "a__", "ε", 1);
    testRuleContextID("5c", "___", "ε", 1);
    testRuleContextID("5d", "##_b", "ε", 1);
    testRuleContextID("5e", "a_##", "ε", 1);
    testRuleContextID("5f", "##_##", "ε", 1);

    // these are currently unparsable but may become parsable 
    // in the future
    testRuleContextID("6a", "(_)_b", "ε", 1);
    testRuleContextID("6b", "a_(_)", "ε", 1);
    testRuleContextID("6c", "(_)_(_)", "ε", 1);
    testRuleContextID("6d", "(#)_b", "ε", 1);
    testRuleContextID("6e", "a_(#)", "ε", 1);
    testRuleContextID("6f", "(#)_(#)", "ε", 1);

    // empty context is valid
    testRuleContextID("7a", "", "");

    // missing underscore
    testRuleContextID("8a", "#", "ε", 1);
    testRuleContextID("8b", "a", "ε", 1);
});
