import { Compiler, SheetParser, CellComponent, EnclosureComponent, CompileableComponent, ErrorAccumulator } from "./sheetParser";
import { Lit, Seq, State, Uni } from "@gramble/parser";
import { Empty, TrivialState } from "parser/src/stateMachine";

/**
 * Turns abstract syntax trees produced by [SheetParser] into 
 * grammar formalisms
 */
class GrammarCompiler implements Compiler<State> {

    public compileContent(h: CellComponent, c: CellComponent, errors: ErrorAccumulator): State {
        return Lit(h.text, c.text);
    }

    compileRow(row: State[], errors: ErrorAccumulator): State { 
        return Seq(...row);
    }

    compileTable(rows: State[], errors: ErrorAccumulator): State { 
        return Uni(...rows);
    }

    compileEnclosure(enc: EnclosureComponent<State>, errors: ErrorAccumulator): State { 
       
        if (enc.text == "table") {
            if (enc.child == undefined) {
                errors.addError(enc.position,
                    "'table' seems to be missing a table; something should be in the cell to the right.")
                return Empty();
            }
            if (enc.sibling != undefined) {
                errors.addError(enc.position,
                    `Warning: 'table' here will obliterate the preceding content from ${enc.sibling.position}.`);
            }
            return enc.child.compile(this, errors);
        }

        if (enc.text == "or") {
            if (enc.child == undefined) {
                errors.addError(enc.position, 
                    "'or' is missing a second argument; something should be in the cell to the right.");
                return Empty();
            }
            if (enc.sibling == undefined) {
                errors.addError(enc.position,
                    "'or' is missing a first argument; something should be in a cell above this.");
                return Empty();
            }
            const arg1 = enc.sibling.compile(this, errors);
            const arg2 = enc.child.compile(this, errors);
            return Uni(arg1, arg2);
        }

        errors.addError(enc.position, `Cannot recognize operator '${enc.text}'.`);
        return Empty();
    }

    compileSheet(sheet: EnclosureComponent<State>, errors: ErrorAccumulator): State { 
        return Empty();
    }


}