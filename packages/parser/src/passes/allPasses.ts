import { CreateCollections } from "./createCollections";
import { PassEnv, Pass } from "../passes";
import { Grammar, GrammarPass, GrammarResult, CollectionGrammar } from "../grammars";
import { Result } from "../msgs";
import { timeIt, VERBOSE_TIME } from "../util";
import { QualifyNames } from "./qualifyNames";
import { RenameFix } from "./renameFix";
import { ReplaceRules } from "./replaceRules";
import { SameTapeReplacePass } from "./sameTapeReplace";
import { AdjustFilters } from "./adjustFilters";
import { CheckNamedParams } from "./checkNamedParams";
import { RescopeLeftBinders } from "./rescopeLeftBinders";
import { CreateOps } from "./createOps";
import { ParseSheets } from "./parseSheets";
import { CheckStructuralParams } from "./checkStructuralParams";
import { CheckTestLiterals } from "./checkTestLiterals";
import { CreateHeaders } from "./createHeaders";
import { AssociateHeaders } from "./associateHeaders";
import { InsertTables } from "./insertTables";
import { CreateGrammars } from "./createGrammars";
import { CheckCollections } from "./checkCollections";
import { ReplaceRulesOld } from "./replaceRulesOld";
import { AssignDefaults } from "./assignDefaults";

export const SHEET_PASSES = 

    // parse the sheet into an initial TST, mostly consisting of
    // placeholder TstOps and TstGrids without any particular 
    // semantics
    new ParseSheets().compose(

    // turn ops that represent collections into actual collections, 
    // rescope their children as necessary, and define default symbols
    // if necessary
    new CreateCollections().compose(
        
    // in syntactic positions when there's an implicit table semantics,
    // insert a TstTable as appropriate
    new InsertTables().compose(
        
    // make sure ops have the right structural parameters (.sibling,
    // .children) to be interpreted, and that these parameters are 
    // the right kinds of syntactic objects.
    new CheckStructuralParams().compose(

    // parse the first row of TstPreGrids into TstHeaders
    new CreateHeaders().compose(

    // make sure there aren't extraneous parameters that the ops
    // can't interpret
    new CheckNamedParams().compose(
        
    // make sure that all unit test content is literal (e.g. isn't
    // an embed, a regex, etc.)
    new CheckTestLiterals().compose(

    // associate content cells below headers into TstHeadedCells
    new AssociateHeaders().compose(

    // transform the remaining placeholder ops into their 
    // appropriate syntactic structures
    new CreateOps().compose(

    // check whether collections are in appropriate structural
    // positions
    new CheckCollections().compose(

    // restructure content cells that scope only over the cell to
    // their left (e.g. equals, rename)
    new RescopeLeftBinders().compose(

    // create grammar objects
    new CreateGrammars()
    
    )))))))))));

    
// qualify symbol names (e.g. turn `VERB` in sheet Sheet1 
// into `Sheet1.VERB`) and attempt to resolve references to them
// (e.g. figure out whether VERB refers to Sheet1.VERB or 
// something else)
export const NAME_PASSES = 

    new AssignDefaults().compose(

    new QualifyNames());

export const GRAMMAR_PASSES =

    NAME_PASSES.compose(

    // if the programmer has specified an invalid renaming/hiding
    // structure that would cause problems during evaluation, fix
    // it so it doesn't
    new RenameFix().compose(

    // turn new-style replacement cascades into the appropriate
    // structures
    new ReplaceRulesOld().compose(

    // take old-style replacement rules and (when the from/to tapes
    // are the same) insert renaming so that there's no conflict
    new SameTapeReplacePass().compose(

    // some filters (like `starts re text: ~k`) have counterintuitive
    // results, rescope them as necessary to try to have the 
    // semantics that the programmer anticipates 
    new AdjustFilters()))));

export const ALL_PASSES = SHEET_PASSES.compose(GRAMMAR_PASSES);



