import { CreateCollections } from "./createCollections.js";
import { FlattenCollections } from "./flattenCollections.js";
import { CreateFilters } from "./createFilters.js";
import { CheckNamedParams } from "./checkNamedParams.js";
import { RescopeLeftBinders } from "./rescopeLeftBinders.js";
import { CreateOps } from "./createOps.js";
import { ParseSource } from "./parseSource.js";
import { CheckStructuralParams } from "./checkStructuralParams.js";
import { CheckTestLiterals } from "./checkTestLiterals.js";
import { CreateHeaders } from "./createHeaders.js";
import { AssociateHeaders } from "./associateHeaders.js";
import { InsertTables } from "./insertTables.js";
import { CreateGrammars } from "./createGrammars.js";
import { CheckCollections } from "./checkCollections.js";
import { ConstructReplaceBlocks } from "./constructReplaceBlocks.js";
import { AssignDefaults } from "./assignDefaults.js";
import { HandleSingleTapes } from "./handleSingleTapes.js";
import { CombineLiterals } from "./combineLiterals.js";
import { CalculateTapes } from "./calculateTapes.js";
import { TimerPass } from "../passes.js";
import { Grammar } from "../grammars.js";
import { TST } from "../tsts.js";

/**
 * There are three main sequences of Passes.  
 * 
 * The first, SOURCE_PASSES, is concerned with turning grids of cells representing Gramble
 * programs into Grammars. 
 * 
 * The second, GRAMMAR_PASSES, is operations on Grammars like qualification of names, inference of tapes, 
 * and various translations into lower-level Grammars (e.g. the conversion of ReplaceBlock to the appropriate
 * sequences of renames and joins).
 * 
 * The reason these two are separated out is because many of our unit tests construct Grammars directly
 * out of convenience functions like `Lit()` and `Seq()` and `Replace()`.  They don't have to go through 
 * the SOURCE_PASSES -- they're not source -- but they do have to have their names qualified, their tapes 
 * inferred, etc.
 * 
 * There's also a sequence of passes that happens after these, in which the grammar
 * undergoes further transformations in response to queries from a client.  Those can't be pre-composed with
 * these, though, because they depend on information that isn't yet available at the time these Passes 
 * operate.
 */

export const SOURCE_PASSES = 

    // parse the sheet into an initial TST, mostly consisting of
    // placeholder TstOps and TstGrids without any particular 
    // semantics
    new TimerPass(
        "Parsing source grids",
        new ParseSource()
    ).compose(

    // turn ops that represent collections into actual collections, 
    // rescope their children as necessary, and define default symbols
    // if necessary
    new TimerPass<TST,TST>(
        "Creating collections",
        new CreateCollections()
    )
    
    .compose(
        
    // in syntactic positions when there's an implicit table semantics,
    // insert a TstTable as appropriate
    new TimerPass(
        "Inserting implicit table ops",
        new InsertTables()
    ).compose(
        
    // make sure ops have the right structural parameters (.sibling,
    // .children) to be interpreted, and that these parameters are 
    // the right kinds of syntactic objects.
    new TimerPass<TST,TST>(
        "Checking structural commands",    
        new CheckStructuralParams()
    ).compose(

    // parse the first row of TstPreGrids into TstHeaders
    new TimerPass<TST,TST>(
        "Parsing headers",    
        new CreateHeaders()
    ).compose(

    // make sure there aren't extraneous parameters that the ops
    // can't interpret
    new TimerPass<TST,TST>(
        "Checking named commands",    
        new CheckNamedParams()
    ).compose(
        
    // make sure that all unit test content is literal (e.g. isn't
    // an embed, a regex, etc.)
    new TimerPass<TST,TST>(
        "Making sure tests are literal",    
        new CheckTestLiterals()
    ).compose(

    // associate content cells below headers into TstHeadedCells
    new TimerPass<TST,TST>(
        "Associating headers and cells", 
        new AssociateHeaders()
    ).compose(

    // transform the remaining placeholder ops into their 
    // appropriate syntactic structures
    new TimerPass<TST,TST>(
        "Creating ops", 
        new CreateOps()
    ).compose(

    // check whether collections are in appropriate structural
    // positions
    new TimerPass<TST,TST>(
        "Checking for spurious collections", 
        new CheckCollections()
    ).compose(

    // restructure content cells that scope only over the cell to
    // their left (e.g. equals, rename)
    new TimerPass<TST,TST>(
        "Rescoping left-binders", 
        new RescopeLeftBinders()
    ).compose(

    // create grammar objects
    new TimerPass<TST,Grammar>(
        "Creating grammar objects", 
        new CreateGrammars()
    ).compose(
    
    // Joins sequences of single-character literals into multi-
    // char literals for effeciency.
    new TimerPass(
        "Combining literals",
        new CombineLiterals()
    )))))))))))));

export const GRAMMAR_PASSES = 

    // Assign default symbols to collections that don't already
    // have a default defined.
    new TimerPass(
        "Assigning default symbols", 
        new AssignDefaults()
    ).compose(

    // qualify symbol names (e.g. turn `VERB` in sheet Sheet1 
    // into `Sheet1.VERB`) and attempt to qualify references to them
    // (e.g. figure out whether VERB refers to Sheet1.VERB or 
    // something else)
    new TimerPass(
        "Qualifying names", 
        new FlattenCollections()
    ).compose(

    // handles some local tape renaming for plaintext/regex
    new TimerPass<Grammar,Grammar>(
        "Handling single-tape environments", 
        new HandleSingleTapes()
    ).compose(

    // Replace the .tapeSet member (which by default is TapeUnknown)
    // with a TapeLit (a concrete set of tape names)
    new TimerPass<Grammar,Grammar>(
        "Calculating tapes", 
        new CalculateTapes()
    ).compose(
    
    // some conditions (like `starts text: ~k`) have counterintuitive
    // results, rescope them as necessary to try to have the 
    // semantics that the programmer anticipates 
    new TimerPass(
        "Rescoping filters", 
        new CreateFilters()
    ).compose(

    // turn replacement blocks into the appropriate
    // structures
    new TimerPass(
        "Creating replacement rule blocks", 
        new ConstructReplaceBlocks()
    ))))));

export const ALL_PASSES = SOURCE_PASSES.compose(GRAMMAR_PASSES);
