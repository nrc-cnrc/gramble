import { Gen, RandomPicker, winnow, GPos, NULL_POS } from "./util";
import { DevEnvironment } from "./spreadsheet";
import { Tier, parseTier, UnaryTier, CommentTier, BinaryTier } from "./tierParser";

//import { getEnabledCategories } from "trace_events";
//import { stringify } from "querystring";

export interface GEntry {
    readonly tier: Tier, 
    readonly value: GCell,
    testChar(index: number, c: string): boolean;
    length(): number;
    slice(start: number, end: number | undefined): GEntry;
    isEmpty(): boolean;
    validateResult(pastOutput: GRecord, 
        futureOutput: GRecord, 
        symbolTable: TransducerTable, 
        accelerate: boolean): boolean;
}

export type GRecord = GEntry[];
export type GParse = [GRecord, number, GRecord];
export type GTable = GRecord[];

type TransducerTable = Map<string, Transducer>;

export class ParseOptions {
    constructor(
        public symbolTable: TransducerTable,
        public randomize: boolean = false,
        public maxResults: number = -1,
        public parseLeftToRight: boolean = true,
        public accelerate: boolean = false
    ) { }
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

export class GCell implements GPos {

    public toString(): string { return this.text + "(" + this.row + ")"; }

    
    public sheet: string;
    public row: number;
    public col: number;

    public constructor(
        public text: string,
        pos: GPos = { sheet: "", row: -1, col: -1 }
    ) { 
        this.sheet = pos.sheet;
        this.row = pos.row;
        this.col = pos.col;
    }
}


export function mapKeys(items: GRecord, inKey: string, outKey: string): GRecord {
    return items.map(entry => {
        if (entry.tier.text != inKey) {
            return entry;
        }
        return new Literal(new Tier(outKey, entry.tier), entry.value);
    })
}

/*
export function tableToJSON(table: GTable): [string, string, string, number, number][][] {
    return table.map((record) => {
        return record.map(([key, value]) => {
            return [key.text, value.text, value.sheet, value.row, value.col];
        });
    });
} */

/* 
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
} */

/*
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
} */

/*
export function flattenToJSON(table: GTable): string {
    return JSON.stringify(tableToObjs(table));
} */

/*
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
} */

export function getTierAsString(table: GTable, tier: string, delim: string = ", "): string {
    const results = table.map(record => {
        var result = "";
        for (const entry of record) {
            if (entry.tier.text == tier) {     
                result = result + entry.value.text;
            }
        }
        return result;
    });
    return results.join(delim);
}

export interface Transducer {
    getProb(): number;
    transduce(input: GParse, options: ParseOptions): Gen<GParse>;
    getRelevantTiers(): string[];
    sanityCheck(symbolTable: TransducerTable, devEnv: DevEnvironment): void;
    compatibleWithFirstChar(tier: string, c: string, symbolTable: TransducerTable): boolean | undefined;
    transduceFinal(input: GTable, 
        symbolTable: TransducerTable,
        randomize: boolean,
        maxResults: number,
        accelerate: boolean): Gen<GRecord>;
    generate(symbolTable: TransducerTable,
            randomize: boolean,
            maxResults: number,
            accelerate: boolean): Gen<GRecord>;
    sample(symbolTable: TransducerTable,
                maxResults: number,
                accelerate: boolean): Gen<GRecord>
}

export class NullTransducer implements Transducer {

    /*
    public transduce(input: GParse, options: ParseOptions): GParse[] {
        return [...this.transduceGen(input, options)];
    } */

    public *transduce(input: GParse, options: ParseOptions): Gen<GParse> {
        yield input;
    }

    public getProb(): number {
        return 1.0
    }

    public getRelevantTiers(): string[] {
        return [];
    }

    validateResult(pastOutput: GRecord, 
        futureOutput: GRecord, 
        symbolTable: TransducerTable, 
        accelerate: boolean): boolean {
        return true;
    }

    public compatibleWithFirstChar(tier: string, c: string, symbolTable: TransducerTable): boolean | undefined {
        return undefined;
    }

    public sanityCheck(symbolTable: TransducerTable, devEnv: DevEnvironment): void {}

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
    public *transduceFinal(input: GTable, 
                        symbolTable: TransducerTable,
                        randomize: boolean = false,
                        maxResults: number = -1,
                        accelerate: boolean = true): Gen<GRecord> {

        //var results: GTable = [];
        var options = new ParseOptions(symbolTable, randomize, maxResults, true, accelerate);

        for (var inputRecord of input) {
            var inputParse: GParse = [inputRecord, 0.0, []];
            for (const [remnant, logprob, output] of this.transduce(inputParse, options)) {
                if (remnant.some(entry => !entry.isEmpty())) {
                    continue; // if there's leftovers, keep going
                }
                if (!this.testCongruence(inputRecord, output)) {
                    continue; // something went wrong in the phonology
                }
                if (!this.validateOutput(output, symbolTable, accelerate)) {
                    continue; // if the output failed validation (e.g. had a failing "before"), keep going
                }
                const filteredOutput = output.filter(entry => !entry.isEmpty());
                var prob: string = Math.exp(logprob).toPrecision(3);
                filteredOutput.push(new Literal(new Tier("p"), new GCell(prob)));
                yield filteredOutput;
            }
        }
    }

    protected testCongruence(inputRecord: GRecord, outputRecord: GRecord): boolean {
        for (const entry of inputRecord) {
            const [query, queryEtc] = get_field_from_record(inputRecord, entry.tier.text);
            const [result, resultEtc ] = get_field_from_record(outputRecord, entry.tier.text);
            
            if (queryEtc && !result.startsWith(query)) {
                return false;
            }
            if (!queryEtc && query != result) {
                return false;
            }
        }
        return true;
    }

    protected validateOutput(output: GRecord, symbolTable: TransducerTable, accelerate: boolean): boolean {
        for (var i = 0; i < output.length; i++) {
            const pastOutput = output.slice(0, i);
            const op = output[i];
            const futureOutput = output.slice(i+1);
            if (!op.validateResult(pastOutput, futureOutput, symbolTable, accelerate)) {
                return false;
            }
        }
        return true;
    }

    public *generate(symbolTable: TransducerTable,
                    randomize: boolean = false,
                    maxResults: number = -1,
                    accelerate: boolean = true): Gen<GRecord> {
        const input: GTable = makeTable([[["",""]]]) // make an empty input to transduce from
        yield* this.transduceFinal(input, symbolTable, randomize, maxResults, accelerate);
    }
    
    public *sample(symbolTable: TransducerTable,
                    maxResults: number = 1,
                    accelerate: boolean = true): Gen<GRecord> {
        if (maxResults == -1) {
            maxResults = 1;
        }
        var numFailures = 0;
        var maxFailures = 100 * maxResults;
        var resultsFound = 0;


        while (resultsFound < maxResults) {
            
            const sampleResult = [...this.generate(symbolTable, true, 1, accelerate)];
            if (sampleResult.length == 0) {
                numFailures++;
            }
            if (numFailures > maxFailures) {
                throw new Error("Failing to sample from grammar; try generating to see if has any output at all.");
            }
            resultsFound++;
            yield* sampleResult;
        }

    }
}

class CellTransducer extends NullTransducer {

    constructor(
        public tier: Tier,
        public value: GCell
    ) { 
        super();
    }

}

class CommentTransducer extends CellTransducer {

}

class UnaryTransducer extends CellTransducer {

    protected child: Transducer;

    public constructor(
        tier: Tier,
        value: GCell,
    ) {
        super(tier, value);
        const childTier = (tier as UnaryTier).child;
        this.child = transducerFromTier(childTier, value);
    }

    public sanityCheck(symbolTable: TransducerTable, devEnv: DevEnvironment): void {
        this.child.sanityCheck(symbolTable, devEnv);
    }

    public getRelevantTiers(): string[] {
        return this.child.getRelevantTiers();
    }
}

class RequireTransducer extends UnaryTransducer {

    public compatibleWithFirstChar(tier: string, c: string, symbolTable: TransducerTable): boolean | undefined {
        return this.child.compatibleWithFirstChar(tier, c, symbolTable);
    }

    /*
    public transduce([input, logprob, pastOutput]: GParse, options: ParseOptions): GParse[] {

        const results : GParse[] = []; 
        for (const [rem, newprob, output] of this.child.transduce([input, logprob, []], options)) {
            const newInput: GRecord = [...output, ...rem];
            results.push([newInput, logprob, pastOutput]);
        }

        return results;
    } */

    public *transduce([input, logprob, pastOutput]: GParse, options: ParseOptions): Gen<GParse> {
        for (const [rem, newprob, output] of this.child.transduce([input, logprob, []], options)) {
            const newInput: GRecord = [...output, ...rem];
            yield [newInput, logprob, pastOutput];
        }
    }
}


class FinalTransducer extends UnaryTransducer {

    
    public compatibleWithFirstChar(tier: string, c: string, symbolTable: TransducerTable): boolean | undefined {
        return true;
    }

    /*
    public transduce(inputParse: GParse, options: ParseOptions): GParse[] {
        return this.child.transduce(inputParse, options).filter(([remnant, p, o]) => {
            return !remnant.some(([key, value]) => value.text.length > 0 );
        });
    } */

    public *transduce(inputParse: GParse, options: ParseOptions): Gen<GParse> {
        for (const [remnant, p, output] of this.child.transduce(inputParse, options)) {
            if (remnant.some(entry => !entry.isEmpty())) {
                continue;    
            }
            yield [remnant, p, output];
        }
    }
}

class BeforeTransducer extends UnaryTransducer implements GEntry {


    public value = new GCell("*");

    public testChar(index: number, c: string): boolean {
        return false;
    }

    public length(): number {
        return 0;
    }

    public slice(start: number, end: number | undefined): GEntry {
        return this;
    }

    public isEmpty(): boolean {
        return true;
    }

    public validateResult(pastOutput: GRecord, 
                        futureOutput: GRecord, 
                        symbolTable: TransducerTable, 
                        accelerate: boolean): boolean {
        const childOptions: ParseOptions = {
            symbolTable: symbolTable,
            randomize: false,
            maxResults: 1,
            parseLeftToRight: true,
            accelerate: accelerate
        }
        const input: GParse = [futureOutput, 0.0, pastOutput];
        const results = [...this.child.transduce(input, childOptions)];
        if (results.length > 0) {
            return true;
        }
        return false;
    }

    public compatibleWithFirstChar(tier: string, c: string, symbolTable: TransducerTable): boolean | undefined {
        return this.child.compatibleWithFirstChar(tier, c, symbolTable);
    }

    public *transduce([input, logprob, pastOutput]: GParse, options: ParseOptions): Gen<GParse> {
        
        /* if (this.child instanceof Literal) {
            for (const [rem, newprob, output] of this.child.transduce([input, logprob, []], options)) {
                const newInput: GRecord = [...output, ...rem];
                for (const tier in this.getRelevantTiers()) {
                    if (record_has_key(input, tier)) {
                        continue;
                    }
                    newInput.push(new Etcetera(new Tier(tier)));
                }
                yield [newInput, logprob, pastOutput];
            } 
        } else { */
            const output: GRecord = [...pastOutput, this];
            yield [input, logprob, output];
        /* } */
    }
}



class BeforeTransducer2 extends UnaryTransducer {

    protected affectedTier : string;
    public constructor(
        tier: Tier,
        value: GCell,
    ) {
        super(tier, value);
        const relevantTiers = this.child.getRelevantTiers();
        if (relevantTiers.length < 1) {
            throw new Error("Before transducers must affect one tier; " +
                "this before transducer does not appear to affect any tiers");
        }
        if (relevantTiers.length > 1) {
            throw new Error("Before transducers can only affect one tier. " +
                `This before transducer can potentially affect multiple tiers: ${relevantTiers.join(", ")}`);
        }
        this.affectedTier = relevantTiers[0];
    }
   
    public compatibleWithFirstChar(tier: string, c: string, symbolTable: TransducerTable): boolean | undefined {
        return this.child.compatibleWithFirstChar(tier, c, symbolTable);
    }

    /*
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
    } */

    public *transduce(inputParse: GParse, options: ParseOptions): Gen<GParse> {
        const childOptions: ParseOptions = {
            symbolTable: options.symbolTable,
            randomize: false,
            maxResults: 1,
            parseLeftToRight: true,
            accelerate: options.accelerate
        }

        const [input, logprob, pastOutput] = inputParse;

        // The behavior of a Before transducer depends on whether the relevant tier is in the input
        // (in which case the material to parse is already present, go ahead and parse it) or whether 
        // it's not (in which case it doesn't yet exist, put a new requirement into the input)

        if (record_has_key(input, this.affectedTier)) {
            const results = [...this.child.transduce(inputParse, options)];
            if (results.length > 0) {
                yield inputParse;
            }
            return;
        }

        // it's not in the input, add a requirement to the input 
        
    }

}

function recordToString(record: GRecord): string {
    return record.map(entry => entry.toString()).join(", ");
}

class AfterTransducer extends UnaryTransducer {

    public compatibleWithFirstChar(tier: string, c: string, symbolTable: TransducerTable): boolean | undefined {
        //return this.child.compatibleWithFirstChar(tier, c, symbolTable);
        return undefined;
    }

    /*
    public transduce(inputParse: GParse, options: ParseOptions): GParse[] {
        const [input, logprob, pastOutput] = inputParse;
        const childParse: GParse = [[...pastOutput], 1.0, []];
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
    } */

    public *transduce(inputParse: GParse, options: ParseOptions): Gen<GParse> {
        const [input, logprob, pastOutput] = inputParse;
        const childParse: GParse = [[...pastOutput], 1.0, []];
        const childOptions: ParseOptions = {
            symbolTable: options.symbolTable,
            randomize: false,
            maxResults: 1,
            parseLeftToRight: false,
            accelerate: false,
        }
        const results = [...this.child.transduce(childParse, childOptions)];
        if (results.length > 0) {
            yield inputParse;
        }
    }
}


class NotTransducer extends UnaryTransducer {

    protected trivial: boolean = false;

    public constructor(
        tier: Tier,
        value: GCell,
    ) {
        super(tier, value);
        if (value.text.length == 0) {
            this.trivial = true;
        }
    }

    public sanityCheck(symbolTable: TransducerTable, devEnv: DevEnvironment): void {
        this.child.sanityCheck(symbolTable, devEnv);
        if (this.child instanceof BeforeTransducer) {
            devEnv.markError(this.tier.sheet, this.tier.row, this.tier.col, 
                "To negate a before transducer, use 'before not' rather than 'not before'.", "error");
        }
    }

    public compatibleWithFirstChar(tier: string, c: string, symbolTable: TransducerTable): boolean | undefined {
        var result = this.child.compatibleWithFirstChar(tier, c, symbolTable);
        if (result == false) {
            return true;
        }
        return undefined;
    }

    /*
    public transduce(inputParse: GParse, options: ParseOptions): GParse[] {
        if (this.trivial) {
            return [inputParse];
        }
        const results = this.child.transduce(inputParse, options);
        if (results.length > 0) {
            return [];
        }
        return [inputParse];
    } */

    public *transduce(inputParse: GParse, options: ParseOptions): Gen<GParse> {
        if (this.trivial) {
            yield inputParse;
            return;
        }

        const results = [...this.child.transduce(inputParse, options)];
        if (results.length > 0) {
            return;
        }
        yield inputParse;
    }
}


class AlternationTransducer extends NullTransducer {

    private childrenAndWeights: Array<[Transducer, number]> = [];
    private relevantChildren: Map<string, Array<[Transducer, number]>> = new Map();

    public constructor(
        children: Transducer[]
    ) {
        super();
        var weights = children.map(child => child.getProb());
        const weightSum = weights.reduce((a,b) => a + b, 0);
        weights = weights.map(w => w / weightSum);

        this.childrenAndWeights = children.map((child, i) => [child, weights[i]]);
    } 

    public getRelevantTiers(): string[] {
        var results : string[] = [];
        for (const [child, weight] of this.childrenAndWeights) {
            results = results.concat(child.getRelevantTiers());
        }
        return results;
    }

    public compatibleWithFirstChar(tier: string, c: string, symbolTable: TransducerTable): boolean | undefined {
        var canBeUndefined = false;
        for (const [child, weight] of this.childrenAndWeights) {
            var result = child.compatibleWithFirstChar(tier, c, symbolTable);
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

    public sanityCheck(symbolTable: TransducerTable, devEnv: DevEnvironment): void {

        for (const [child, weight] of this.childrenAndWeights) {
            child.sanityCheck(symbolTable, devEnv);
        }
    }

    protected firstCharOfInput(input: GRecord): [string, string] | undefined {
        for (const entry of input) {
            if (entry.value.text == "") {
                continue;
            }
            return [entry.tier.text, entry.value.text[0]];
        }
        return undefined;
    }

    public *transduce(input: GParse, options: ParseOptions): Gen<GParse> {

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
                        if (child.compatibleWithFirstChar(tier, c, options.symbolTable) == false) {
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


        var resultsFound = 0;

        for (var item  of items) {
            if (item == undefined) {
                throw new Error("Received an undefined output from RandomPicker.")
            }
            const [child, prob] = item;
            for (var [remnant, logprob, output] of child.transduce(input, options)) {
                logprob += Math.log(prob);
                yield [remnant, logprob, output];
                resultsFound++;
                if (options.maxResults > 0 && resultsFound == options.maxResults) {
                    return;
                }
            }
        }
    }

    /*
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
    } */
}

class MaybeTransducer extends UnaryTransducer {
    
    private alternation : AlternationTransducer;

    public constructor(
        tier: Tier,
        value: GCell,
    ) {
        super(tier, value);
        this.alternation = new AlternationTransducer([this.child, new NullTransducer()]);
    }
    
    public compatibleWithFirstChar(tier: string, c: string, symbolTable: TransducerTable): boolean | undefined {
        const result = this.alternation.compatibleWithFirstChar(tier, c, symbolTable);
        if (result == true) {
            return true;
        }
        return undefined;
        
    }

    /*
    public transduce(input: GParse, options: ParseOptions): GParse[] {
        return this.alternation.transduce(input, options);
    } */

    
    public *transduce(input: GParse, options: ParseOptions): Gen<GParse> {
        yield* this.alternation.transduce(input, options);
    }
}


/***********************
 * One-tier transducers
 * 
 * These are unary transducers whose only argument can be an atomic tier name,
 * e.g. "shift text", rather than a potentially complex tier name (e.g. 
 * "shift text/gloss" or "shift maybe text").
 * 
 * Their constructors take a tier cell, a value cell, and a symbol table.
 */


class UpdownTransducer extends CellTransducer {

    protected childTier: Tier;
    protected inputTier: string;
    protected outputTier: string;

    public constructor(
        tier: Tier,
        value: GCell, 
        protected direction: "upward"|"downward"
    ) {
        super(tier, value);
        this.childTier = (tier as UnaryTier).child;

        if (direction == "upward") {
            this.inputTier = "down";
            this.outputTier = "up";
        } else {
            this.inputTier = "up";
            this.outputTier = "down";
        }
    }

    
    public compatibleWithFirstChar(tier: string, c: string, symbolTable: TransducerTable): boolean | undefined {

        if (this.direction == "downward") {
            return undefined;
        }

        if (this.value.text.length == 0) {
            return undefined;
        }
        const transducer = symbolTable.get(this.value.text);
        if (transducer == undefined) {
            throw new Error(`Could not find symbol: ${this.value.text}`);
        }
        const result = transducer.compatibleWithFirstChar(tier, c, symbolTable);
        if (result == false) {
            return undefined;
        }
        return result;
    }
    
    public sanityCheck(symbolTable: TransducerTable, devEnv: DevEnvironment): void {
        if (this.value.text == '') {
            return;
        }
        if (!symbolTable.has(this.value.text)) {
            devEnv.markError(this.value.sheet, this.value.row, this.value.col, 
                `${this.value.text} is in a var column, but there is no variable of this name.`, "error");
        }
    }
    
    protected applyConversion(parse: GParse, options: ParseOptions): GParse[] {
        
        const [input, logprob, pastOutput] = parse;

        const recordIsComplete = !input.some(entry => {
            if (entry.tier.text != this.inputTier) {
                return false;
            }
            if (entry.length() == Number.POSITIVE_INFINITY) {
                return false;
            }
            return entry.value.text.length > 0; 
        });

        if (recordIsComplete) {  // only parse incomplete ones, or else recurse forever
            return [parse];
        }
    
        const transducer = options.symbolTable.get(this.value.text);
        if (transducer == undefined) {
            throw new Error(`Could not find symbol: ${this.value.text}`);
        }

        var outputs = [...transducer.transduce(parse, options)];
        if (outputs.length == 0) {
            outputs = [ stepOneCharacter(parse, this.inputTier, this.outputTier) ];
        } 
        
        var results: GParse[][] = outputs.map(output => this.applyConversion(output, options));
        return Array.prototype.concat.apply([], results);
    }

    /*
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
    } */

    
    public *transduce(parse: GParse, options: ParseOptions): Gen<GParse> {
        if (this.value.text.length == 0) {
            yield parse;
            return;
        }
        var [input, logprob, pastOutput] = parse;

        var wheat: GRecord = [];
        var chaff: GRecord = [];
        var inputSource =  this.direction == "upward" ? input : pastOutput;
        for (const entry of inputSource) {
            if (entry.tier.text == this.childTier.text) {
                wheat.push(new Literal(new Tier(this.inputTier), entry.value));
                continue;
            }
            chaff.push(entry);
        }

        
        var results: GParse[] = [];

        for (var [remnant, newprob, output] of this.applyConversion([wheat, logprob, []], options)) {
            const result = [...chaff];
            for (const entry of output) {
                if (entry.tier.text == this.outputTier) {
                    result.push(new Literal(this.childTier, entry.value)); 
                                        // probably want to change this to the original key eventually,
                                        // so that phonology doesn't mess up origin tracing.
                }
            }

            if (this.direction == "upward") {
                yield [result, newprob, pastOutput];
            } else {
                yield [input, newprob, result];
            }
        }
    }

}

class UpTransducer extends UpdownTransducer {

    public constructor(
        tier: Tier,
        value: GCell, 
    ) {
        super(tier, value, "upward");
    }
}


class DownTransducer extends UpdownTransducer {

    public constructor(
        tier: Tier,
        value: GCell, 
    ) {
        super(tier,  value, "downward");
    }
}


class JoinTransducer extends CellTransducer {

    protected childTier: Tier;

    public constructor(
        tier: Tier,
        value: GCell, 
    ) {
        super(tier, value);
        this.childTier = (tier as UnaryTier).child;
    }

    
    public compatibleWithFirstChar(tier: string, c: string): boolean | undefined {
        return true;
    }

    /*
    public transduce([input, logprob, pastOutput]: GParse, options: ParseOptions): GParse[] {
        const parts: string[] = [];
        const output = pastOutput.filter(([key, value]) => {
            if (key.text == this.key.text) {
                parts.push(value.text);
                return false;
            }
            return true;
        });
        const flattenedString = parts.join(this.value.text);
        const flattenedCell = new GCell(flattenedString, this.value);
        output.push([this.key, flattenedCell]);
        return [[input, logprob, output]];
    } */
    
    public *transduce([input, logprob, pastOutput]: GParse, options: ParseOptions): Gen<GParse> {
        const parts: string[] = [];
        const output = pastOutput.filter(entry => {
            if (entry.tier.text == this.childTier.text) {
                parts.push(entry.value.text);
                return false;
            }
            return true;
        });
        const flattenedString = parts.join(this.value.text);
        const flattenedCell = new GCell(flattenedString, this.value);
        output.push(new Literal(this.childTier, flattenedCell));
        yield [input, logprob, output];
    }
}


/**
 * ShiftTransducer
 * 
 * "shift" is a unary transducer that simply copies the value on an input tier into an output tier.
 * E.g., "shift surf":"gloss" would copy "gloss" tier of the input into the "gloss" tier of the output.
 * Often will be used for the same tier, e.g. "shift surf":"surf".
 */
class ShiftTransducer extends CellTransducer {

    public constructor(
        tier: Tier,
        value: GCell, 
    ) {
        super(tier, value);
        const childTier = (tier as UnaryTier).child;
    }

    
    public compatibleWithFirstChar(tier: string, c: string): boolean | undefined {
        return true;
    }

    /*
    public transduce([input, logprob, pastOutput]: GParse, options: ParseOptions): GParse[] {
        var [output, remnant] = winnow(input, ([key, value]) => key.text == this.value.text); // split entries into relevant and irrelevant
        output = mapKeys(output, this.value.text, this.tier.text);
        return [[remnant, logprob, [...pastOutput, ...output]]];
    } */

    
    public *transduce([input, logprob, pastOutput]: GParse, options: ParseOptions): Gen<GParse> {
        var [output, remnant] = winnow(input, entry => entry.tier.text == this.value.text); // split entries into relevant and irrelevant
        output = mapKeys(output, this.value.text, this.tier.text);
        yield [remnant, logprob, [...pastOutput, ...output]];
    }
}


/******************
 * Atomic transducers
 *
 */

export class Literal extends CellTransducer implements GEntry {


    public constructor(
        tier: Tier,
        value: GCell,
    ) {
        super(tier, value);
    }

    public testChar(index: number, c: string): boolean {
        //if (index >= this.value.text.length) {
        //    throw new Error(`Index ${index} out of range for string ${this.value.text}.`)
        //}
        return this.value.text[index] == c;
    }

    public length(): number {
        return this.value.text.length;
    }

    public slice(start: number, end: number | undefined): GEntry {
        const remnantCell = new GCell(this.value.text.slice(start, end), this.value);
        return new Literal(this.tier, remnantCell);
    }

    
    public isEmpty(): boolean {
        return this.value.text.length == 0;
    }

    public toString(): string {
        return this.tier.text + ":" + this.value.text;
    }

    public compatibleWithFirstChar(tier: string, c: string): boolean | undefined {
        if (this.value.text == "") {
            return undefined;
        }
        if (this.tier.text != tier) {
            return undefined;
        }
        if (this.value.text.startsWith(c)) {
            return true;
        }
        return false;
    }


    public *transduce(parse: GParse, options: ParseOptions): Gen<GParse> {

        const [input, logprob, pastOutput] = parse;

        if (this.value.text.length == 0) {
            
            var output = [...pastOutput];
            
            if (options.parseLeftToRight) {
                output.push(this);
            } else {
                output.unshift(this);
            }

            yield [input, logprob, output];
            return;
        }


        var consumedInput: GRecord = [];

        var tierFoundInInput = false;
        var needle = this.value.text;

        const inputEntries = options.parseLeftToRight ? input : input.reverse();

        for (const entry of inputEntries) {
            if (entry.tier.text != this.tier.text) { // not what we're looking for, move along
                consumedInput.push(entry);
                continue; 
            }
            tierFoundInInput = true;
        
            if (options.parseLeftToRight) {
                for (var i = 0; i < entry.length(); i++) {
                    if (needle.length == 0) {
                        break;
                    }
                    if (!entry.testChar(i, needle[0])) {
                        return;
                    }
                    needle = needle.slice(1);
                }

                if (needle.length == 0) {
                    consumedInput.push(entry.slice(i, undefined));
                }
            } else {
                for (var i = entry.length() - 1; i >= 0; i--) {
                    if (needle.length == 0) {
                        break;
                    }
                    if (!entry.testChar(i, needle[needle.length-1])) {
                        return;
                    }
                    needle = needle.slice(0, needle.length-1);
                }

                if (needle.length == 0) {
                    consumedInput.unshift(entry.slice(0,i+1));
                }
            }
        }

        if (tierFoundInInput && needle.length > 0) {
            return;
        }

        /* if (!options.parseLeftward) {
            consumedInput = consumedInput.reverse();
        } */

        var output = [...pastOutput];
        
        if (options.parseLeftToRight) {
            output.push(this);
        } else {
            output.unshift(this);
        }

        yield [consumedInput, logprob, output];

    }

    /*
    public transduce(parse: GParse, options: ParseOptions): GParse[] {

        const [input, logprob, pastOutput] = parse;

        if (this.value.text.length == 0) {
            
            var output = [...pastOutput];
            
            if (options.parseLeftToRight) {
                output.push([this.key, this.value]);
            } else {
                output.unshift([this.key, this.value]);
            }

            return [[input, logprob, output]];
        }


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
                    const remnantCell = new GCell(value.text.slice(i), value);
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
                    const remnantCell = new GCell(value.text.slice(0,i+1), value);
                    consumedInput.unshift([key, remnantCell]);
                }
            }
        }

        if (tierFoundInInput && needle.length > 0) {
            return [];
        }


        var output = [...pastOutput];
        
        if (options.parseLeftToRight) {
            output.push([this.key, this.value]);
        } else {
            output.unshift([this.key, this.value]);
        }

        return [[consumedInput, logprob, output]];
    }

    */
}


class ProbTransducer extends CellTransducer {

    private p: number;

    public constructor(
        tier: Tier,
        value: GCell,
    ) { 
        super(tier, value);
        if (value.text == "") {
            this.p = 1.0;
        }
        try {
            this.p = parseFloat(value.text);
        } catch (err) {
            throw new Error(`${value.text} is not a valid value for p; only numbers can be p values.`);
        }

        if (this.p < 0) {
            throw new Error(`${value.text} is not a valid value for p; only positive numbers can be p values.`);
        }
    }

    public getProb(): number {
        return this.p;
    }

}


class VarTransducer extends CellTransducer {
    
    //private transducer : Transducer | undefined = undefined;

    public constructor(
        tier: Tier,
        value: GCell,
    ) {

        super(tier, value);
    }


    public sanityCheck(symbolTable: TransducerTable, devEnv: DevEnvironment): void {
        if (this.value.text == '') {
            return;
        }
        if (!symbolTable.has(this.value.text)) {
            if (this.value.text.indexOf("|") != -1) {
                devEnv.markError(this.value.sheet, this.value.row, this.value.col,
                    `${this.value.text} is in a var column, but there is no variable of this name.  ` +
                    "Did you mean 'alt var' above?", "error");
                return;
            }
            devEnv.markError(this.value.sheet, this.value.row, this.value.col, 
                `${this.value.text} is in a var column, but there is no variable of this name.`, "error");
        }
    }
    
    public compatibleWithFirstChar(tier: string, c: string, symbolTable: TransducerTable): boolean | undefined {
        if (this.value.text.length == 0) {
            return undefined;
        }
        const transducer = symbolTable.get(this.value.text);
        if (transducer == undefined) {
            throw new Error(`Could not find symbol: ${this.value.text}`);
        }
        return transducer.compatibleWithFirstChar(tier, c, symbolTable);
    }
    /*
    public transduce(input: GParse, options: ParseOptions): GParse[] {
        if (this.value.text.length == 0) {
            return [input];
        }
        const transducer = this.symbolTable.get(this.value.text);
        if (transducer == undefined) {
            throw new Error(`Could not find symbol: ${this.value.text}`);
        }
        return transducer.transduce(input, options);
    } */

    
    public *transduce(input: GParse, options: ParseOptions): Gen<GParse> {
        if (this.value.text.length == 0) {
            yield input;
            return;
        }

        const transducer = options.symbolTable.get(this.value.text);
        if (transducer == undefined) {
            throw new Error(`Could not find symbol: ${this.value.text}`);
        }
        yield* transducer.transduce(input, options);

    }
}

export class Etcetera implements GEntry {

    public value = new GCell("*");

    public constructor(
        public tier: Tier,
    ) { }

    public testChar(index: number, c: string): boolean {
        return true;
    }

    public length(): number {
        return Number.POSITIVE_INFINITY;
    }

    public slice(start: number, end: number | undefined): GEntry {
        return this;
    }

    public isEmpty(): boolean {
        return true;
    }

    validateResult(pastOutput: GRecord, 
        futureOutput: GRecord, 
        symbolTable: TransducerTable, 
        accelerate: boolean): boolean {
        return true;
    }
}


class ConcatenationTransducer extends NullTransducer {


    public constructor(
        public children: Transducer[]
    ) {
        super();
    }

    public compatibleWithFirstChar(tier: string, c: string, symbolTable: TransducerTable): boolean | undefined {
        for (const child of this.children) {
            var result = child.compatibleWithFirstChar(tier, c, symbolTable);
            if (result != undefined) {
                return result;
            }
        }
        return true;
    }

    
    public getRelevantTiers(): string[] {
        var results : string[] = [];
        for (const child of this.children) {
            results = results.concat(child.getRelevantTiers());
        }
        return results;
    }

    public sanityCheck(symbolTable: TransducerTable, devEnv: DevEnvironment): void {
        for (const child of this.children) {
            child.sanityCheck(symbolTable, devEnv);
        }
    }

    public *transduce(input: GParse, options: ParseOptions): Gen<GParse> {

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
        for (const result of results) {
            yield result;
        }
    }

    public getProb(): number {
        return this.children.reduce((prod, child) => prod * child.getProb(), 1.0);
    }
}

class SlashTransducer extends ConcatenationTransducer {

    public constructor(
        tier: Tier,
        value: GCell,
    ) {
        const child1Tier = (tier as BinaryTier).child1;
        const child2Tier = (tier as BinaryTier).child2;
        const child1Transducer = transducerFromTier(child1Tier, value);
        const child2Transducer = transducerFromTier(child2Tier, value);
        super([child1Transducer, child2Transducer]);
    }
}


class AltTransducer extends AlternationTransducer {

    public constructor(
        tier: Tier,
        value: GCell,
    ) {
        const childTier = (tier as UnaryTier).child;
        const childTransducers: Transducer[] = [];
        for (var s of value.text.split("|")) {
            s = s.trim();
            const childValue = new GCell(s, value);
            const childTransducer = transducerFromTier(childTier, childValue);
            childTransducers.push(childTransducer);
        }
        super(childTransducers);
    }
}


const TRANSDUCER_CONSTRUCTORS: {[key: string]: new (
    tier: Tier,
    value: GCell,
) => Transducer} = {
    
    "maybe": MaybeTransducer,
    "require": RequireTransducer,
    "before": BeforeTransducer,
    "after": AfterTransducer,
    "final": FinalTransducer,
    "shift": ShiftTransducer,
    "join": JoinTransducer,
    "upward": UpTransducer,
    "downward": DownTransducer,
    "alt": AltTransducer,
    "not": NotTransducer,
    "%": CommentTransducer,
    "p": ProbTransducer,
    "var": VarTransducer,
    "/": SlashTransducer
}

function transducerFromTier(tier: Tier, 
                            value: GCell, 
                            //symbolTable: TransducerTable,
                            //devEnv: DevEnvironment
                            ): Transducer {

    if (TRANSDUCER_CONSTRUCTORS[tier.text] != undefined) {
        const constructor = TRANSDUCER_CONSTRUCTORS[tier.text];
        return new constructor(tier, value);
    } 

    return new Literal(tier, value);

}

export function transducerFromEntry(entry: GEntry, 
                                    symbolTable: TransducerTable,
                                    devEnv: DevEnvironment): Transducer {

    try {
        var tierStructure = parseTier(entry.tier.text, entry.tier);
        return transducerFromTier(tierStructure, entry.value);
    } catch (err) {
        devEnv.markError(entry.tier.sheet, entry.tier.row, entry.tier.col, err.toString(), "error");
        return new NullTransducer();  // if the tier is erroneous, return a trivial parser
                                  // so that the grammar can still execute
    }
}

function transducerFromRecord(record: GRecord, symbolTable: TransducerTable, devEnv: DevEnvironment) {
    const children = record.map(entry => transducerFromEntry(entry, symbolTable, devEnv));
    return new ConcatenationTransducer(children);
}

export function transducerFromTable(table: GTable, symbolTable: TransducerTable, devEnv: DevEnvironment) {
    const children = table.map(record => transducerFromRecord(record, symbolTable, devEnv));
    return new AlternationTransducer(children);
}

function stepOneCharacter([input, logprob, pastOutput]: GParse, inTier: string, outTier: string): GParse {
    var consumedInput: GRecord = []; 
    var output: GRecord = [... pastOutput];
    var charFound = false;

    for (const entry of input) {
        if (!charFound && entry.tier.text == inTier && entry.value.text.length > 0) {
            const c = entry.value.text[0];
            const remnant = new GCell(entry.value.text.slice(1), entry.value);
            consumedInput.push(new Literal(entry.tier, remnant));
            const newOutputEntry: GEntry = new Literal(new Tier(outTier), new GCell(c, entry.value));
            output.push(newOutputEntry);
            charFound = true;
            continue;
        }
        consumedInput.push(entry);
    }

    return [consumedInput, logprob, output];
}


export function makeEntry(key: string, value: string): GEntry {
    return new Literal(new Tier(key), new GCell(value));
}

export function makeRecord(cells: [string, string][]): GRecord {
    return cells.map(([key, value]) => makeEntry(key, value));
}

export function makeTable(cells: [string, string][][]): GTable {
    return cells.map(makeRecord);
}

function record_has_key(record: GRecord, key: string): boolean {
    for (const entry of record) {
        if (entry.tier.text == key) { 
            return true;
        }
    }
    return false;
}

function get_field_from_record(record: GRecord, key: string): [string, boolean] {
    var result = "";
    var containsEtc = false;
    for (const entry of record) {
        if (entry instanceof Etcetera) {
            containsEtc = true;
            continue;
        }
        if (entry.tier.text == key) { 
            result = result + entry.value.text;
        }
    }
    return [result, containsEtc];
}