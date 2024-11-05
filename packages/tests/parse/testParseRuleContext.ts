import { testRuleContextID } from "./testParseUtils.js";

describe(`Parse rule context`, function() {

    // simple contexts
    testRuleContextID("1a", "a_b", "(context a b false false)");
    testRuleContextID("1b", "#a_b", "(context a b true false)");
    testRuleContextID("1c", "a_b#", "(context a b false true)");
    testRuleContextID("1d", "#a_b#", "(context a b true true)");

    // contexts with empty elements
    testRuleContextID("2a", "_b", "(context ε b false false)");
    testRuleContextID("2b", "#_b", "(context ε b true false)");
    testRuleContextID("2c", "_b#", "(context ε b false true)");
    testRuleContextID("2d", "#_b#", "(context ε b true true)");
    testRuleContextID("2e", "a_", "(context a ε false false)");
    testRuleContextID("2f", "#a_", "(context a ε true false)");
    testRuleContextID("2g", "a_#", "(context a ε false true)");
    testRuleContextID("2h", "#a_#", "(context a ε true true)");
    testRuleContextID("2i", "_", "(context ε ε false false)");
    testRuleContextID("2j", "#_", "(context ε ε true false)");
    testRuleContextID("2k", "_#", "(context ε ε false true)");
    testRuleContextID("2l", "#_#", "(context ε ε true true)");

    // regexes in the elements
    testRuleContextID("3a", "a*_b|c", "(context (star a) (alt b c) false false)");
    testRuleContextID("3b", "a|b_c*", "(context (alt a b) (star c) false false)");

    // escaped octothorpe or underscore in the regexes
    testRuleContextID("4a", "\\__b", "(context _ b false false)");
    testRuleContextID("4b", "a_\\_", "(context a _ false false)");
    testRuleContextID("4c", "\\__\\_", "(context _ _ false false)");
    testRuleContextID("4d", "\\#_b", "(context # b false false)");
    testRuleContextID("4e", "a_\\#", "(context a # false false)");
    testRuleContextID("4f", "\\#_\\#", "(context # # false false)");

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
    testRuleContextID("7a", "", "ε");

    // missing underscore
    testRuleContextID("8a", "#", "ε", 1);
    testRuleContextID("8b", "a", "ε", 1);
});
