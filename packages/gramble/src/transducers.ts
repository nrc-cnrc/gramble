import { RandomPicker, winnow } from "./util";
import { getEnabledCategories } from "trace_events";
import { DevEnvironment } from "./spreadsheet";
//import { getEnabledCategories } from "trace_events";
//import { stringify } from "querystring";

export type GEntry = [GCell, GCell];
export type GRecord = GEntry[];
export type GParse = [GRecord, number, GRecord];
export type GTable = GRecord[];

export class ParseOptions {
    constructor(
        public randomize: boolean = false,
        public maxResults: number = -1,
        public parseLeftToRight: boolean = true,
        public accelerate: boolean = false
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

export function objToTable(obj: { [key: string]: string; }): GTable {
    const record : GRecord = [];
    for (const key in obj) {
        record.push([new GCell(key), new GCell(obj[key])]);
    }
    return [record];
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


export class Transducer {
    
    public transduce(input: GParse, options: ParseOptions): GParse[] {
        return [input];
    }

    public getProb(): number {
        return 1.0
    }

    public compatibleWithFirstChar(tier: string, c: string): boolean | undefined {
        return undefined;
    }

    public checkVars(devEnv: DevEnvironment): void {}

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
     * @returns parse 
     */
    public transduceFinal(input: GTable, 
                        randomize: boolean = false,
                        maxResults: number = -1,
                        accelerate: boolean = true): GTable {

        var transducer = new FinalTransducer(this);
        var results: GTable = [];
        var options = new ParseOptions(randomize, maxResults, true, accelerate);

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
                    maxResults: number = -1,
                    accelerate: boolean = true): GTable {
        const input: GTable = makeTable([[["",""]]]) // make an empty input to transduce from
        return this.transduceFinal(input, randomize, maxResults, accelerate);
    }
    
    public sample(maxResults: number = 1,
                    accelerate: boolean = true): GTable {
        if (maxResults == -1) {
            maxResults = 1;
        }
        var numFailures = 0;
        var maxFailures = 100 * maxResults;
        var result: GTable = [];

        while (result.length < maxResults) {
            const sampleResult = this.generate(true, 1, accelerate);
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

class UnaryTransducer extends Transducer {

    public constructor(
        protected child: Transducer
    ) {
        super();
    }

    public checkVars(devEnv: DevEnvironment): void {
        this.child.checkVars(devEnv);
    }
}

class VarTransducer extends Transducer {
    
    //private transducer : Transducer | undefined = undefined;

    public constructor(
        private value: GCell, 
        private symbolTable: Map<string, Transducer>) {

        super();
    }

    public checkVars(devEnv: DevEnvironment): void {
        if (this.value.text == '') {
            return;
        }
        if (!this.symbolTable.has(this.value.text)) {
            devEnv.markError(this.value.sheet, this.value.row, this.value.col, 
                `${this.value.text} is in a var column, but there is no variable of this name.`, "error");
        }
    }
    
    public compatibleWithFirstChar(tier: string, c: string): boolean | undefined {
        if (this.value.text.length == 0) {
            return undefined;
        }
        const transducer = this.symbolTable.get(this.value.text);
        if (transducer == undefined) {
            throw new Error(`Could not find symbol: ${this.value.text}`);
        }
        return transducer.compatibleWithFirstChar(tier, c);
    }

    public transduce(input: GParse, options: ParseOptions): GParse[] {
        if (this.value.text.length == 0) {
            return [input];
        }
        const transducer = this.symbolTable.get(this.value.text);
        if (transducer == undefined) {
            throw new Error(`Could not find symbol: ${this.value.text}`);
        }
        return transducer.transduce(input, options);
    }
}

class InputTransducer extends UnaryTransducer {

    public compatibleWithFirstChar(tier: string, c: string): boolean | undefined {
        return undefined;
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

    
    public compatibleWithFirstChar(tier: string, c: string): boolean | undefined {
        return true;
    }

    public transduce([input, logprob, pastOutput]: GParse, options: ParseOptions): GParse[] {
        var [output, remnant] = winnow(input, ([key, value]) => key.text == this.fromTier.text); // split entries into relevant and irrelevant
        output = mapKeys(output, this.fromTier.text, this.toTier.text);
        return [[remnant, logprob, [...pastOutput, ...output]]];
    }
}

class FinalTransducer extends UnaryTransducer {

    
    public compatibleWithFirstChar(tier: string, c: string): boolean | undefined {
        return true;
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

    
    public compatibleWithFirstChar(tier: string, c: string): boolean | undefined {
        return true;
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

class BeforeTransducer extends UnaryTransducer {

    public compatibleWithFirstChar(tier: string, c: string): boolean | undefined {
        return this.child.compatibleWithFirstChar(tier, c);
    }

    public transduce(inputParse: GParse, options: ParseOptions): GParse[] {
        const childOptions: ParseOptions = {
            randomize: false,
            maxResults: 1,
            parseLeftToRight: true,
            accelerate: options.accelerate
        }
        const results = this.child.transduce(inputParse, options);
        if (results.length > 0) {
            return [inputParse];
        }
        return [];
    }
}

class AfterTransducer extends UnaryTransducer {

    public compatibleWithFirstChar(tier: string, c: string): boolean | undefined {
        return this.child.compatibleWithFirstChar(tier, c);
    }

    public transduce(inputParse: GParse, options: ParseOptions): GParse[] {
        const [input, logprob, pastOutput] = inputParse;
        const childParse: GParse = [pastOutput, 1.0, []];
        const childOptions: ParseOptions = {
            randomize: false,
            maxResults: 1,
            parseLeftToRight: false,
            accelerate: options.accelerate
        }
        const results = this.child.transduce(childParse, childOptions);
        if (results.length > 0) {
            return [inputParse];
        }
        return [];
    }
}

class ProbTransducer extends Transducer {

    private p: number;
    public constructor(value: GCell, devEnv: DevEnvironment) { 
        super();
        if (value.text == "") {
            this.p = 1.0;
        }
        try {
            this.p = parseFloat(value.text);
            if (this.p < 0) {
                devEnv.markError(value.sheet, value.row, value.col, 
                    `${value.text} is not a valid value for p; only numbers can be p values.`, "error");
                this.p = 1.0;
            }
        } catch (err) {
            devEnv.markError(value.sheet, value.row, value.col, 
                `${value.text} is not a valid value for p; only numbers can be p values.`, "error");
            this.p = 1.0;
        }
    }

    public getProb(): number {
        return this.p;
    }

}


class AlternationTransducer extends Transducer {

    private childrenAndWeights: Array<[Transducer, number]> = [];
    private relevantChildren: Map<string, Array<[Transducer, number]>> = new Map();

    public constructor(children: Transducer[]
    ) {
        super();
        var weights = children.map(child => child.getProb());
        const weightSum = weights.reduce((a,b) => a + b, 0);
        weights = weights.map(w => w / weightSum);

        this.childrenAndWeights = children.map((child, i) => [child, weights[i]]);
    } 

    public compatibleWithFirstChar(tier: string, c: string): boolean | undefined {
        var canBeUndefined = false;
        for (const [child, weight] of this.childrenAndWeights) {
            var result = child.compatibleWithFirstChar(tier, c);
            if (result == true) {
                return true;
            }
            if (result == undefined) {
                canBeUndefined = true;
            }
        }
        if (canBeUndefined) {
            return undefined;
        }
        return false;
    }

    public checkVars(devEnv: DevEnvironment): void {
        for (const [child, weight] of this.childrenAndWeights) {
            child.checkVars(devEnv);
        }
    }

    public firstCharOfInput(input: GRecord): [string, string] | undefined {
        for (const [key, value] of input) {
            if (value.text == "") {
                continue;
            }
            return [key.text, value.text[0]];
        }
        return undefined
    }

    public transduce(input: GParse, options: ParseOptions): GParse[] {
        
        var relevantChildrenAndWeights: [Transducer, number][] | undefined = this.childrenAndWeights;

        if (options.accelerate) {
            const [inputRecord, logprob, previousOutput] = input;
            const firstCharPair = this.firstCharOfInput(inputRecord);
            if (firstCharPair != undefined) {
                var firstCharStr = firstCharPair.join(":::");
                relevantChildrenAndWeights = this.relevantChildren.get(firstCharStr);
                if (relevantChildrenAndWeights == undefined) {
                    relevantChildrenAndWeights = [];
                    const [tier, c] = firstCharPair;
                    for (const [child, weight] of this.childrenAndWeights) {
                        if (child.compatibleWithFirstChar(tier, c) == false) {
                            continue;
                        }
                        relevantChildrenAndWeights.push([child, weight]);
                    }
                    this.relevantChildren.set(firstCharStr, relevantChildrenAndWeights);
                }
            }
        }

        if (options.randomize) {
            var items: Iterable<[Transducer, number] | undefined > = new RandomPicker([...relevantChildrenAndWeights]);
        } else {
            var items: Iterable<[Transducer, number] | undefined > = relevantChildrenAndWeights;
        }


        const results: GParse[] = [];
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

class MaybeTransducer extends UnaryTransducer {
    
    private alternation : AlternationTransducer;
    public constructor(child: Transducer) {
        super(child);
        this.alternation = new AlternationTransducer([child, new Transducer()]);
    }

    
    public compatibleWithFirstChar(tier: string, c: string): boolean | undefined {
        const result = this.alternation.compatibleWithFirstChar(tier, c);
        if (result == true) {
            return true;
        }
        return undefined;
        
    }

    public transduce(input: GParse, options: ParseOptions): GParse[] {
        return this.alternation.transduce(input, options);
    }
}

class UpdownTransducer extends Transducer {

    //private transducer: Transducer | undefined = undefined;
    private inputTier: string;
    private outputTier: string;

    public constructor(
        private key: GCell, 
        private value: GCell, 
        private symbolTable: Map<string, Transducer>, 
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
    }

    
    public compatibleWithFirstChar(tier: string, c: string): boolean | undefined {

        if (this.direction == "downward") {
            return undefined;
        }

        if (this.value.text.length == 0) {
            return undefined;
        }
        const transducer = this.symbolTable.get(this.value.text);
        if (transducer == undefined) {
            throw new Error(`Could not find symbol: ${this.value.text}`);
        }
        const result = transducer.compatibleWithFirstChar(tier, c);
        if (result == false) {
            return undefined;
        }
        return result;
    }
    
    public checkVars(devEnv: DevEnvironment): void {
        if (this.value.text == '') {
            return;
        }
        if (!this.symbolTable.has(this.value.text)) {
            devEnv.markError(this.value.sheet, this.value.row, this.value.col, 
                `${this.value.text} is in a var column, but there is no variable of this name.`, "error");
        }
    }
    
    public applyConversion(parse: GParse, options: ParseOptions): GParse[] {
        
        const [input, logprob, pastOutput] = parse;

        const recordIsComplete = !input.some(([key, value]) => {
            return key.text == this.inputTier && value.text.length > 0; 
        });

        if (recordIsComplete) {  // only parse incomplete ones, or else recurse forever
            return [parse];
        }
    
        const transducer = this.symbolTable.get(this.value.text);
        if (transducer == undefined) {
            throw new Error(`Could not find symbol: ${this.value.text}`);
        }

        var outputs = transducer.transduce(parse, options);
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

    public compatibleWithFirstChar(tier: string, c: string): boolean | undefined {
        if (this.value.text == "") {
            return undefined;
        }
        if (this.key.text != tier) {
            return undefined;
        }
        if (this.value.text.startsWith(c)) {
            return true;
        }
        return false;
    }

    public transduce(parse: GParse, options: ParseOptions): GParse[] {

        if (this.value.text.length == 0) {
            return [parse];
        }

        const [input, logprob, pastOutput] = parse;

        var consumedInput: GRecord = [];

        var tierFoundInInput = false;
        var needle = this.value.text;

        const inputEntries = options.parseLeftToRight ? input : input.reverse();

        for (const [key, value] of inputEntries) {
            if (key.text != this.key.text) { // not what we're looking for, move along
                consumedInput.push([key, value]);
                continue; 
            }
            tierFoundInInput = true;
        
            if (options.parseLeftToRight) {
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
                    consumedInput.unshift([key, remnantCell]);
                }
            }
        }

        if (tierFoundInInput && needle.length > 0) {
            return [];
        }

        /* if (!options.parseLeftward) {
            consumedInput = consumedInput.reverse();
        } */

        var output = [...pastOutput];
        
        if (options.parseLeftToRight) {
            output.push([this.key, this.value]);
        } else {
            output.unshift([this.key, this.value]);
        }

        return [[consumedInput, logprob, output]];
    }
}


class ConcatenationTransducer extends Transducer {


    public constructor(
        public children: Transducer[]
    ) {
        super();
    }

    public compatibleWithFirstChar(tier: string, c: string): boolean | undefined {
        for (const child of this.children) {
            var result = child.compatibleWithFirstChar(tier, c);
            if (result != undefined) {
                return result;
            }
        }
        return true;
    }

    public checkVars(devEnv: DevEnvironment): void {
        for (const child of this.children) {
            child.checkVars(devEnv);
        }
    }

    public transduce(input: GParse, options: ParseOptions): GParse[] {

        var results = [input];

        var children = options.parseLeftToRight ? this.children : this.children.reverse();

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

export function transducerFromEntry([key, value]: [GCell, GCell], 
                                        symbolTable: Map<string, Transducer>,
                                        devEnv: DevEnvironment): Transducer {

    const commaSeparatedTiers = splitTrimLower(key.text, ",");

    if (commaSeparatedTiers.length > 1) {
        var children = commaSeparatedTiers.map(tier => {
            const newKey = new GCell(tier, key.sheet, key.col, key.row);
            return transducerFromEntry([newKey, value], symbolTable, devEnv);
        });
        return new ConcatenationTransducer(children);
    }

    const keyTokens = splitTrimLower(key.text);
    if (keyTokens.length == 0) {
        throw new Error("Attempt to call a parser with no tier.");
    }

    if (keyTokens[0] == "upward") {
        if (keyTokens.length != 2) {
            devEnv.markError(key.sheet, key.row, key.col, 
                "Invalid tier name: " + key.text, "error");
            return new Transducer();
        }
        const remnant = new GCell(keyTokens[1], key.sheet, key.row, key.col);
        return new UpdownTransducer(remnant, value, symbolTable, "upward");
    }
 
    if (keyTokens[0] == "downward") {
        if (keyTokens.length != 2) {
            devEnv.markError(key.sheet, key.row, key.col, 
                "Invalid tier name: " + key.text, "error");
            return new Transducer();
        }
        const remnant = new GCell(keyTokens[1], key.sheet, key.row, key.col);
        return new UpdownTransducer(remnant, value, symbolTable, "downward");
    }

    if (keyTokens[0] == "join") {
        if (keyTokens.length != 2) {
            devEnv.markError(key.sheet, key.row, key.col, 
                "Invalid tier name: " + key.text, "error");
            return new Transducer();
        }
        const remnant = new GCell(keyTokens[1], key.sheet, key.row, key.col);
        return new JoinTransducer(remnant, value);
    }

    if (keyTokens[0] == "shift") {
        if (keyTokens.length != 2) {
            devEnv.markError(key.sheet, key.row, key.col, 
                "Invalid tier name: " + key.text, "error");
            return new Transducer();
        }
        const remnant = new GCell(keyTokens[1], key.sheet, key.row, key.col);
        return new ShiftTransducer(remnant, value);
    }

    if (keyTokens[0] == "maybe") {
        return makeUnaryTransducer(keyTokens, key, value, MaybeTransducer, symbolTable, devEnv);
    }

    if (keyTokens[0] == "before") {
        return makeUnaryTransducer(keyTokens, key, value, BeforeTransducer, symbolTable, devEnv);
    }

    if (keyTokens[0] == "after") {
        return makeUnaryTransducer(keyTokens, key, value, AfterTransducer, symbolTable, devEnv);
    }

    if (keyTokens[0] == "input") {
        return makeUnaryTransducer(keyTokens, key, value, InputTransducer, symbolTable, devEnv);
    }

    if (keyTokens[0] == "final") {
        return makeUnaryTransducer(keyTokens, key, value, FinalTransducer, symbolTable, devEnv);
    }

    if (keyTokens.length > 1) {
        devEnv.markError(key.sheet, key.row, key.col, 
            "Invalid tier name: " + key.text, "error");
        return new Transducer();
    }

    if (keyTokens[0] == "var") {
        return new VarTransducer(value, symbolTable);
    } 

    if (keyTokens[0] == "p") {
        return new ProbTransducer(value, devEnv);
    }
    
    return new LiteralTransducer(key, value);
}

function makeUnaryTransducer(keyTokens: string[], 
                            key: GCell, 
                            value: GCell, 
                            constructor: new (child: Transducer) => Transducer, 
                            symbolTable: Map<string, Transducer>, 
                            devEnv: DevEnvironment) {
    if (keyTokens.length < 2) {
        devEnv.markError(key.sheet, key.row, key.col, 
            "Invalid tier name: " + key.text, "error");
        return new Transducer();
    }
    const remnant = keyTokens.slice(1).join(" ");
    const childKey = new GCell(remnant, key.sheet, key.row, key.col);
    const child = transducerFromEntry([childKey, value], symbolTable, devEnv);
    return new constructor(child);
}

function transducerFromRecord(record: GRecord, symbolTable: Map<string, Transducer>, devEnv: DevEnvironment) {
    const children = record.map(entry => transducerFromEntry(entry, symbolTable, devEnv));
    return new ConcatenationTransducer(children);
}

export function transducerFromTable(table: GTable, symbolTable: Map<string, Transducer>, devEnv: DevEnvironment) {
    const children = table.map(record => transducerFromRecord(record, symbolTable, devEnv));
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

function record_has_key(record: GRecord, key: string): boolean {
    for (const [k, v] of record) {
        if (k.text == key) { 
            return true;
        }
    }
    return false;
}