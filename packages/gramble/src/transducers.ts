import { RandomPicker, winnow } from "./util";
import { getEnabledCategories } from "trace_events";
//import { getEnabledCategories } from "trace_events";
//import { stringify } from "querystring";

export type GEntry = [GCell, GCell];
export type GRecord = GEntry[];
export type GParse = [GRecord, number, GRecord];
export type GTable = GRecord[];
export type SymbolTable = Map<string, GTable>;

export class ParseOptions {
    constructor(
        public randomize: boolean = false,
        public maxResults: number = -1,
        public parseLeftward: boolean = true
    ) { }
}

export class GPosition {

    /**
     * Creates an instance of GPosition.
     * @param sheetName What sheet this cell corresponds to 
     * @param row The row index, starting from 0 
     * @param col The column index, starting from 0
     */
    public constructor(
        public sheet: string = "",
        public row: number = -1,
        public col: number = -1,
    ) {}
}

/**
 * Cell
 * 
 * You can think of a Cell as a string with extra information about where it belongs in a 
 * spreadsheet.  We have to keep that information around for the purposes of syntax highlighting,
 * debugging, etc.
 * 
 * When a table is transformed (e.g. where it represents code that has itself undergone transformation),
 * the positional information represents that of the original table.  That way we can highlight that
 * cell during debugging. 
 */

export class GCell extends GPosition {

    public text: string; 

    public toString(): string { return this.text + "(" + this.row + ")"; }
    /**
     * Creates an instance of GCell.
     * 
     * @param sheetName What sheet this cell corresponds to 
     * @param row The row index, starting from 0 
     * @param col The column index, starting from 0
     * @param text The text that is in the cell
     */
    constructor(text: string, sheetName: string = "", row: number = -1, col: number = -1) {
        super(sheetName, row, col);
        this.text = text;
    }
}

export function mapKeys(items: GRecord, inKey: string, outKey: string): GRecord {
    return items.map(([key, value]) => {
        if (key.text != inKey) {
            return [key, value];
        }
        return [new GCell(outKey, key.sheet, key.row, key.col), value];
    })
}

export function tableToJSON(table: GTable): [string, string, string, number, number][][] {
    return table.map((record) => {
        return record.map(([key, value]) => {
            return [key.text, value.text, value.sheet, value.row, value.col];
        });
    });
}

export function tableToMap(table: GTable): Map<string, string>[] {
    return table.map((record) => {
        const result: Map<string, string> = new Map();
        for (const [key, value] of record) {
            if (result.has(key.text)) {
                result.set(key.text, result.get(key.text) + value.text)
            } else {
                result.set(key.text, value.text);
            }
        }
        return result;
    });
}

export function tableToObjs(table: GTable): {[key: string]: string}[] {
    return table.map((record) => {
        const result: {[key: string]: string} = {};
        for (const [key, value] of record) {
            if (key.text in result) {
                result[key.text] += value.text;
            } else {
                result[key.text] = value.text;
            }
        }
        return result;
    });
}


export function flattenToJSON(table: GTable): string {
    return JSON.stringify(tableToObjs(table));
}

export function flattenToText(table: GTable): string {
    const results : string[] = [];
    for (const map of tableToMap(table)) {
        const subResults : string[] = [];
        for (const [key, value] of map.entries()) {
            subResults.push(key + ": " + value);
        }    
        results.push(subResults.join(", "));
    }
    return results.join("\n");
}

export function getTierAsString(table: GTable, tier: string, delim: string = ", "): string {
    const results = table.map(record => {
        var result = "";
        for (const [key, value] of record) {
            if (key.text == tier) {     
                result = result + value.text;
            }
        }
        return result;
    });
    return results.join(delim);
}


class Transducer {
    
    public transduce(input: GParse, options: ParseOptions): GParse[] {
        return [input];
    }

    public getProb(): number {
        return 1.0
    }

    /*
    public transduceMany(inputs: GParse[], randomize=false, maxResults=-1): GParse[] {
        const results : GParse[] = [];
        for (const input of inputs) {
            for (const result of this.transduce(input, randomize, maxResults)) {
                results.push(result);
            }
        } 
        return results;
    } */
    
    /**
     * This is the main function that interfaces will call; it takes an
     * input table and, at the end, discards results with unconsumed input.
     * 
     * @param input 
     * @param symbolTable 
     * @returns parse 
     */
    public transduceFinal(input: GTable, 
                        randomize: boolean = false,
                        maxResults: number = -1): GTable {

        var transducer = new FinalTransducer(this);
        var results: GTable = [];
        var options = new ParseOptions(randomize, maxResults);

        for (var inputRecord of input) {
            var inputParse: GParse = [inputRecord, 0.0, []];
            for (const [remnant, logprob, output] of transducer.transduce(inputParse, options)) {
                var prob: string = Math.exp(logprob).toPrecision(3);
                output.push([new GCell("p"), new GCell(prob)])
                results.push(output);
            }
        }
        return results;
    }

    public generate(randomize: boolean = false,
                    maxResults: number = -1): GTable {
        const input: GTable = makeTable([[["",""]]]) // make an empty input to transduce from
        return this.transduceFinal(input, randomize, maxResults);
    }
    
    public sample(maxResults: number = 1): GTable {
        if (maxResults == -1) {
            maxResults = 1;
        }
        var numFailures = 0;
        var maxFailures = 100 * maxResults;
        var result: GTable = [];

        while (result.length < maxResults) {
            const sampleResult = this.generate(true, 1);
            if (sampleResult.length == 0) {
                numFailures++;
            }
            if (numFailures > maxFailures) {
                throw new Error("Failing to sample from grammar; try generating to see if has any output at all.");
            }
            for (const record of sampleResult) {
                result.push(record);
            }
        }
        return result;
    }
}

class VarTransducer extends Transducer {

    
    public constructor(
        private value: GCell, 
        private symbolTable: SymbolTable) {

        super();
    }

    public transduce(input: GParse, options: ParseOptions): GParse[] {
        if (this.value.text.length == 0) {
            return [input];
        }
        const table = this.symbolTable.get(this.value.text);
        if (table == undefined) {
            throw new Error(`Could not find symbol: ${this.value.text}`);
        }
        const transducer = transducerFromTable(table, this.symbolTable);
        return transducer.transduce(input, options);
    }
}

class InputTransducer extends Transducer {

    public constructor(
        private child: Transducer
    ) {
        super();
    }

    public transduce([input, logprob, pastOutput]: GParse, options: ParseOptions): GParse[] {
        const results : GParse[] = [];
        const trivialInput : GRecord = makeRecord([["",""]]) // make an empty input to transduce from
        for (const [rem, newprob, output] of this.child.transduce([trivialInput, logprob, pastOutput], options)) {
            const newInput = [... input, ... output];
            results.push([newInput, newprob, []]);
        }
        return results;
    }
}

/**
 * ShiftTransducer
 * 
 * "shift" is a unary transducer that simply copies the value on an input tier into an output tier.
 * E.g., "shift surf":"gloss" would copy "surf" tier of the input into the "gloss" tier of the output.
 * Often will be used for the same tier, e.g. "shift surf":"surf".
 */
class ShiftTransducer extends Transducer {

    public constructor(
        private toTier: GCell,
        private fromTier: GCell
    ) {
        super();
    }

    public transduce([input, logprob, pastOutput]: GParse, options: ParseOptions): GParse[] {
        var [output, remnant] = winnow(input, ([key, value]) => key.text == this.fromTier.text); // split entries into relevant and irrelevant
        output = mapKeys(output, this.fromTier.text, this.toTier.text);
        return [[remnant, logprob, [...pastOutput, ...output]]];
    }
}

class FinalTransducer extends Transducer {

    public constructor(
        private child: Transducer
    ) {
        super();
    }

    public transduce(inputParse: GParse, options: ParseOptions): GParse[] {
        return this.child.transduce(inputParse, options).filter(([remnant, p, o]) => {
            return !remnant.some(([key, value]) => value.text.length > 0 );
        });
    }
}

class JoinTransducer extends Transducer {

    public constructor(
        private tier: GCell,
        private delim: GCell
    ) {
        super();
    }

    public transduce([input, logprob, pastOutput]: GParse, options: ParseOptions): GParse[] {
        const parts: string[] = [];
        const output = pastOutput.filter(([key, value]) => {
            if (key.text == this.tier.text) {
                parts.push(value.text);
                return false;
            }
            return true;
        });
        const flattenedString = parts.join(this.delim.text);
        const flattenedCell = new GCell(flattenedString, this.delim.sheet, this.delim.row, this.delim.col);
        output.push([this.tier, flattenedCell]);
        return [[input, logprob, output]];
    }
}

class BeforeTransducer extends Transducer {

    public constructor(
        private child: Transducer
    ) {
        super();
    }

    public transduce(inputParse: GParse, options: ParseOptions): GParse[] {
        const results = this.child.transduce(inputParse, options);
        if (results.length > 0) {
            return [inputParse];
        }
        return [];
    }
}



class AlternationTransducer extends Transducer {

    private childrenAndWeights: Array<[Transducer, number]> = [];

    public constructor(children: Transducer[]
    ) {
        super();
        var weights = children.map(child => child.getProb());
        const weightSum = weights.reduce((a,b) => a + b, 0);
        weights = weights.map(w => w / weightSum);

        this.childrenAndWeights = children.map((child, i) => [child, weights[i]]);
    } 

    public transduce(input: GParse, options: ParseOptions): GParse[] {
        const results: GParse[] = [];

        if (options.randomize) {
            var items: Iterable<[Transducer, number] | undefined > = new RandomPicker([...this.childrenAndWeights]);
        } else {
            var items: Iterable<[Transducer, number] | undefined > = this.childrenAndWeights;
        }

        for (var item  of items) {
            if (item == undefined) {
                throw new Error("Received an undefined output from RandomPicker.")
            }
            const [child, prob] = item;
            for (var [remnant, logprob, output] of child.transduce(input, options)) {
                logprob += Math.log(prob);
                results.push([remnant, logprob, output]);
                if (options.maxResults > 0 && results.length == options.maxResults) {
                    return results;
                }
            }
        }
        return results;
    }
}

class ProbTransducer extends Transducer {

    public constructor(
        private p: number
    ) { 
        super();
    }

    public getProb(): number {
        return this.p;
    }
}

class MaybeTransducer extends Transducer {

    private child: Transducer;
    
    public constructor(child: Transducer) {
        super();
        this.child = new AlternationTransducer([child, new Transducer()]);
    }

    public transduce(input: GParse, options: ParseOptions): GParse[] {
        return this.child.transduce(input, options);
    }
}

class UpdownTransducer extends Transducer {

    private transducer: Transducer;
    private inputTier: string;
    private outputTier: string;

    public constructor(
        private key: GCell, 
        private value: GCell, 
        private symbolTable: SymbolTable, 
        private direction: "upward"|"downward"
    ) {
        super();
        if (direction == "upward") {
            this.inputTier = "down";
            this.outputTier = "up";
        } else {
            this.inputTier = "up";
            this.outputTier = "down";
        }
        
        const table = this.symbolTable.get(this.value.text);
        if (table == undefined) {
            throw new Error(`Could not find symbol: ${this.value.text}`);
        }
        this.transducer = transducerFromTable(table, this.symbolTable);
    }
    
    public applyConversion(parse: GParse, options: ParseOptions): GParse[] {
        
        const [input, logprob, pastOutput] = parse;

        const recordIsComplete = !input.some(([key, value]) => {
            return key.text == this.inputTier && value.text.length > 0; 
        });

        if (recordIsComplete) {  // only parse incomplete ones, or else recurse forever
            return [parse];
        }
    
        var outputs = this.transducer.transduce(parse, options);
        if (outputs.length == 0) {
            outputs = [ stepOneCharacter(parse, this.inputTier, this.outputTier) ];
        } 
        
        var results: GParse[][] = outputs.map(output => this.applyConversion(output, options));
        return Array.prototype.concat.apply([], results);
    }

    public transduce(parse: GParse, options: ParseOptions): GParse[] {

        if (this.value.text.length == 0) {
            return [parse];
        }
        var [input, logprob, pastOutput] = parse;

        var wheat: GRecord = [];
        var chaff: GRecord = [];
        var inputSource =  this.direction == "upward" ? input : pastOutput;
        for (const [key, value] of inputSource) {
            if (key.text == this.key.text) {
                wheat.push([new GCell(this.inputTier), value]);
                continue;
            }
            chaff.push([key, value]);
        }

        
        var results: GParse[] = [];

        for (var [remnant, newprob, output] of this.applyConversion([wheat, logprob, []], options)) {
            const result = [...chaff];
            for (const [key, value] of output) {
                if (key.text == this.outputTier) {
                    result.push([this.key, value]); // probably want to change this to the original key eventually,
                                                    // so that phonology doesn't mess up origin tracing.
                }
            }

            if (this.direction == "upward") {
                results.push([result, newprob, pastOutput]);
            } else {
                results.push([input, newprob, result]);
            }
        }
        return results;
    }
}

class LiteralTransducer extends Transducer {

    public constructor(
        public key: GCell, 
        public value: GCell
    ) {
        super();
    }

    public transduce(parse: GParse, options: ParseOptions): GParse[] {

        if (this.value.text.length == 0) {
            return [parse];
        }

        const [input, logprob, pastOutput] = parse;

        var consumedInput: GRecord = [];

        var tierFoundInInput = false;
        var needle = this.value.text;

        const inputEntries = options.parseLeftward ? input : input.reverse();

        for (const [key, value] of inputEntries) {
            if (key.text != this.key.text) { // not what we're looking for, move along
                consumedInput.push([key, value]);
                continue; 
            }
            tierFoundInInput = true;
        
            if (options.parseLeftward) {
                for (var i = 0; i < value.text.length; i++) {
                    if (needle.length == 0) {
                        break;
                    }
                    if (value.text[i] != needle[0]) {
                        return [];
                    }
                    needle = needle.slice(1);
                }

                if (needle.length == 0) {
                    const remnantCell = new GCell(value.text.slice(i), value.sheet, value.row, value.col);
                    consumedInput.push([key, remnantCell]);
                }
            } else {
                for (var i = value.text.length - 1; i >= 0; i--) {
                    if (needle.length == 0) {
                        break;
                    }
                    if (value.text[i] != needle[needle.length-1]) {
                        return [];
                    }
                    needle = needle.slice(0, needle.length-1);
                }

                if (needle.length == 0) {
                    const remnantCell = new GCell(value.text.slice(0,i+1), value.sheet, value.row, value.col);
                    consumedInput.push([key, remnantCell]);
                }
            }
        }

        if (tierFoundInInput && needle.length > 0) {
            return [];
        }

        if (!options.parseLeftward) {
            consumedInput = consumedInput.reverse();
        }

        var output = [...pastOutput];
        output.push([this.key, this.value]);

        return [[consumedInput, logprob, output]];
    }
}


class ConcatenationTransducer extends Transducer {


    public constructor(
        public children: Transducer[]
    ) {
        super();
    }

    public transduce(input: GParse, options: ParseOptions): GParse[] {

        var results = [input];

        var children = options.parseLeftward ? this.children : this.children.reverse();

        for (const child of children) {
            var newResults: GParse[] = [];
            midloop: for (const result1 of results) {
                for (const result2 of child.transduce(result1, options)) {
                    newResults.push(result2);
                    if (options.maxResults > 0 && newResults.length > options.maxResults) {
                        break midloop;
                    }
                }
            }
            results = newResults;
        }  
        return results;
    }

    public getProb(): number {
        return this.children.reduce((prod, child) => prod * child.getProb(), 1.0);
    }
}

export function transducerFromEntry([key, value]: [GCell, GCell], symbolTable: SymbolTable): Transducer {

    const commaSeparatedTiers = splitTrimLower(key.text, ",");

    if (commaSeparatedTiers.length > 1) {
        var children = commaSeparatedTiers.map(tier => {
            const newKey = new GCell(tier, key.sheet, key.col, key.row);
            return transducerFromEntry([newKey, value], symbolTable);
        });
        return new ConcatenationTransducer(children);
    }

    const keys = splitTrimLower(key.text);
    if (keys.length == 0) {
        throw new Error("Attempt to call a parser with no tier.");
    }

    if (keys[0] == "upward") {
        if (keys.length > 2) {
            throw new Error("Invalid tier name: " + key.text);
        }
        const remnant = new GCell(keys[1], key.sheet, key.row, key.col);
        return new UpdownTransducer(remnant, value, symbolTable, "upward");
    }
 
    if (keys[0] == "downward") {
        if (keys.length > 2) {
            throw new Error("Invalid tier name: " + key.text);
        }
        const remnant = new GCell(keys[1], key.sheet, key.row, key.col);
        return new UpdownTransducer(remnant, value, symbolTable, "downward");
    }

    if (keys[0] == "join") {
        if (keys.length > 2) {
            throw new Error("Invalid tier name: " + key.text);
        }
        const remnant = new GCell(keys[1], key.sheet, key.row, key.col);
        return new JoinTransducer(remnant, value);
    }

    if (keys[0] == "shift") {
        if (keys.length > 2) {
            throw new Error("Invalid tier name: " + key.text);
        }
        const remnant = new GCell(keys[1], key.sheet, key.row, key.col);
        return new ShiftTransducer(remnant, value);
    }

    if (keys[0] == "maybe") {
        const remnant = keys.slice(1).join(" ");
        const childKey = new GCell(remnant, key.sheet, key.row, key.col);
        const child = transducerFromEntry([childKey, value], symbolTable);
        return new MaybeTransducer(child);
    }

    if (keys[0] == "before") {
        const remnant = keys.slice(1).join(" ");
        const childKey = new GCell(remnant, key.sheet, key.row, key.col);
        const child = transducerFromEntry([childKey, value], symbolTable);
        return new BeforeTransducer(child);
    }

    if (keys[0] == "input") {
        const remnant = keys.slice(1).join(" ");
        const childKey = new GCell(remnant, key.sheet, key.row, key.col);
        const child = transducerFromEntry([childKey, value], symbolTable);
        return new InputTransducer(child);
    }

    if (keys[0] == "final") {
        const remnant = keys.slice(1).join(" ");
        const childKey = new GCell(remnant, key.sheet, key.row, key.col);
        const child = transducerFromEntry([childKey, value], symbolTable);
        return new FinalTransducer(child);
    }


    if (keys.length > 1) {
        throw new Error("Not a valid tier name: " + key.text);
    }

    if (keys[0] == "var") {
        return new VarTransducer(value, symbolTable);
    } 

    if (keys[0] == "p") {
        const p = parseFloat(value.text);
        return new ProbTransducer(p);
    }
    
    return new LiteralTransducer(key, value);
}

function transducerFromRecord(record: GRecord, symbolTable: SymbolTable) {
    const children = record.map(entry => transducerFromEntry(entry, symbolTable));
    return new ConcatenationTransducer(children);
}

export function transducerFromTable(table: GTable, symbolTable: SymbolTable) {
    const children = table.map(record => transducerFromRecord(record, symbolTable));
    return new AlternationTransducer(children);
}


function splitTrimLower(s: string, delim: string = " "): string[] {
    return s.split(delim).map(x => x.trim().toLowerCase());
}


function stepOneCharacter([input, logprob, pastOutput]: GParse, inTier: string, outTier: string): GParse {
    var consumedInput: GRecord = []; 
    var output: GRecord = [... pastOutput];
    var charFound = false;

    for (const [key, value] of input) {
        if (!charFound && key.text == inTier && value.text.length > 0) {
            const c = value.text[0];
            const remnant = new GCell(value.text.slice(1), value.sheet, value.row, value.col);
            consumedInput.push([key, remnant]);
            const newOutputEntry: GEntry = [new GCell(outTier), new GCell(c, value.sheet, value.row, value.col)]
            output.push(newOutputEntry);
            charFound = true;
            continue;
        }
        consumedInput.push([key, value]);
    }

    return [consumedInput, logprob, output];
}


export function makeEntry(key: string, value: string): GEntry {
    return [new GCell(key), new GCell(value)];
}

export function makeRecord(cells: [string, string][]): GRecord {
    return cells.map(([key, value]) => makeEntry(key, value));
}

export function makeTable(cells: [string, string][][]): GTable {
    return cells.map(makeRecord);
}
