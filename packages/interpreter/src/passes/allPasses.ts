import { CreateCollections } from "./createCollections";
import { FlattenCollections } from "./flattenCollections";
import { CreateFilters } from "./createFilters";
import { CheckNamedParams } from "./checkNamedParams";
import { RescopeLeftBinders } from "./rescopeLeftBinders";
import { CreateOps } from "./createOps";
import { ParseSource } from "./parseSource";
import { CheckStructuralParams } from "./checkStructuralParams";
import { CheckTestLiterals } from "./checkTestLiterals";
import { CreateHeaders } from "./createHeaders";
import { AssociateHeaders } from "./associateHeaders";
import { InsertTables } from "./insertTables";
import { CreateGrammars } from "./createGrammars";
import { CheckCollections } from "./checkCollections";
import { ConstructReplaceBlocks } from "./constructReplaceBlocks";
import { AssignDefaults } from "./assignDefaults";
import { HandleSingleTapes } from "./handleSingleTapes";
import { CombineLiterals } from "./combineLiterals";
import { CalculateTapes } from "./calculateTapes";

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
    new ParseSource().compose(

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
    new CreateGrammars().compose(
    
    // Joins sequences of single-character literals into multi-
    // char literals for effeciency.
    new CombineLiterals()
    ))))))))))));


export const GRAMMAR_PASSES = 

    // Assign default symbols to collections that don't already
    // have a default defined.
    new AssignDefaults().compose(

    // qualify symbol names (e.g. turn `VERB` in sheet Sheet1 
    // into `Sheet1.VERB`) and attempt to qualify references to them
    // (e.g. figure out whether VERB refers to Sheet1.VERB or 
    // something else)
    new FlattenCollections().compose(

    // Replace the .tapeSet member (which by default is TapeUnknown)
    // with a TapeLit (a concrete set of tape names)
    new CalculateTapes().compose(

    // handles some local tape renaming for plaintext/regex
    new HandleSingleTapes().compose(

    // some conditions (like `starts re text: ~k`) have counterintuitive
    // results, rescope them as necessary to try to have the 
    // semantics that the programmer anticipates 
    new CreateFilters().compose(
    
    // turn replacement blocks into the appropriate
    // structures
    new ConstructReplaceBlocks()

    )))));

export const ALL_PASSES = SOURCE_PASSES.compose(GRAMMAR_PASSES);



