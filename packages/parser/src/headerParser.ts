import { Gen, meanAngleDeg, HSVtoRGB, RGBtoString} from "./util";
import { State, Lit, Emb, Seq, Empty, Namespace, Maybe, Not } from "./stateMachine";
import { DevEnvironment } from "./devEnv";


const DEFAULT_SATURATION = 0.1;
const DEFAULT_VALUE = 1.0;


/**
 * A convenience class encapsulating information about where a cell
 * is.  Every component of the abstract syntax tree has one of these;
 * if it's a cell, that's just its position on a spreadsheet; if it's a
 * complex component, it's the position of its first cell.
 *
 * By convention we treat the spreadsheet itself as a component with 
 * its first cell at -1, -1.
 */
export class CellPosition {

    constructor(
        public readonly sheet: string,
        public readonly row: number = -1,
        public readonly col: number = -1
    ) { }

    public toString() {
        return `${this.sheet}:${this.row}:${this.col}`;
    }
}

/**
 * A Header is a cell in the top row of a table, consisting of one of
 * 
 * * the name of a tape, like "text" or "gloss"
 * * a unary operator like "maybe" followed by a valid Header (e.g. "maybe text") 
 * * two valid Headers joined by a slash (e.g. "text/gloss")
 * * a valid Header in parentheses (e.g. "(text)")
 * * a comment (e.g. "% text")
 * 
 * (We treat commented-out headers specially, because they turn everything
 * in their column into no-ops.)
 */
abstract class Header {
    public abstract get hue(): number;
    
    public getColor(saturation: number = DEFAULT_SATURATION, value: number = DEFAULT_VALUE): string { 
        return RGBtoString(...HSVtoRGB(this.hue, saturation, value));
    }

    public getFgColor(): string {
        return "#000000";
    }
    
    public abstract compile(valueText: string, 
                            pos: CellPosition,
                            namespace: Namespace, 
                            devEnv: DevEnvironment): State;
}

export class AtomicHeader extends Header { 

    public constructor(
        public text: string
    ) { 
        super();
    }

    public get hue(): number {
        const str = this.text + "extrasalt" // otherwise short strings are boring colors
        var hash = 0; 

        for (let i = 0; i < str.length; i++) { 
            hash = ((hash << 5) - hash) + str.charCodeAt(i); 
            hash = hash & hash; 
        } 
        
        return (hash & 0xFF) / 255;
    }


    public compile(valueText: string, 
                   pos: CellPosition,
                   namespace: Namespace, 
                   devEnv: DevEnvironment): State {
        if (this.text.toLowerCase() == "embed") {
            return Emb(valueText, namespace);
        }

        return Lit(this.text, valueText);

    }
}

export class CommentHeader extends Header { 

    public get hue(): number {
        return 0;
    }

    public getColor(saturation: number = DEFAULT_SATURATION, value: number = DEFAULT_VALUE): string {
        return "#FFFFFF";
    }

    public getFgColor(): string {
        return "#449944";
    }

    
    public compile(valueText: string,
                    pos: CellPosition,
                   namespace: Namespace, 
                   devEnv: DevEnvironment): State {
        return Empty();
    }
}

export class UnaryHeader extends Header {

    public constructor(
        public text: string,
        public child: Header
    ) { 
        super();
    }

    public get hue(): number {
        return this.child.hue;
    }

    
    
    public compile(valueText: string,
                   pos: CellPosition,
                   namespace: Namespace, 
                   devEnv: DevEnvironment): State {

        const childState = this.child.compile(valueText, pos, namespace, devEnv);

        if (this.text.toLowerCase() == "maybe") {
            const childState = this.child.compile(valueText, pos, namespace, devEnv);
            return Maybe(childState);
        }

        if (this.text.toLowerCase() == "not") {
            return Not(childState);
        }

        // The header parser shouldn't be creating unary headers that
        // aren't in the above set, but just in case...
        devEnv.markError(pos.sheet, pos.row, pos.col,
                `${valueText} is not among the operators allowed in headers.`);
        return Empty();
    }
}

export class BinaryHeader extends Header {
    public constructor(
        public text: string,
        public child1: Header,
        public child2: Header
    ) { 
        super();
    }

    
    public get hue(): number {
        return (meanAngleDeg([this.child1.hue * 360, this.child2.hue * 360]) + 360) / 360;
    }

    public compile(valueText: string,
                    pos: CellPosition,
                    namespace: Namespace, 
                    devEnv: DevEnvironment): State {

        if (this.text == "/") {
            const childState1 = this.child1.compile(valueText, pos, namespace, devEnv);
            const childState2 = this.child2.compile(valueText, pos, namespace, devEnv);
            return Seq(childState1, childState2);
        }
        
        // The header parser shouldn't be creating binary headers that
        // aren't in the above set, but just in case...
        devEnv.markError(pos.sheet, pos.row, pos.col,
            `${valueText} is not among the operators allowed in headers.`);
        return Empty();

    }

}

type HeaderParser = (input: string[]) => Gen<[Header, string[]]>;

const SYMBOL = [ "(", ")", "%", "/"];
const UNARY_RESERVED = [ "maybe", "not" ];
//const ONE_TIER_RESERVED = [ "join", "shift", "upward", "downward", "input", "contains", "equals" ];
const ALL_RESERVED = SYMBOL.concat(UNARY_RESERVED); //.concat(ONE_TIER_RESERVED);

const SUBEXPR = AltHeaderParser([AtomicHeaderParser, ParensHeaderParser]);
const NON_COMMENT_EXPR = AltHeaderParser([UnaryHeaderParser, SlashHeaderParser, SUBEXPR]);
const EXPR = AltHeaderParser([CommentHeaderParser, NON_COMMENT_EXPR]);

function* AtomicHeaderParser(input: string[]): Gen<[Header, string[]]> {
    if (input.length == 0 || ALL_RESERVED.indexOf(input[0]) != -1) {
        return;
    }
    yield [new AtomicHeader(input[0]), input.slice(1)];
}

function AltHeaderParser(children: HeaderParser[]): HeaderParser {
    
    return function*(input: string[]) {
        for (const child of children) {
            yield* child(input);
        }
    }
}

/*
function* OneTierParser(input: string[]): Gen<[Header, string[]]> {
    if (input.length == 0 || ONE_TIER_RESERVED.indexOf(input[0]) == -1) {
        return;
    }
    for (const [t, rem] of Identifier(input.slice(1))) {
        yield [new UnaryHeader(input[0], t), rem];
    }
} */

function* UnaryHeaderParser(input: string[]): Gen<[Header, string[]]> {
    if (input.length == 0 || UNARY_RESERVED.indexOf(input[0]) == -1) {
        return;
    }
    for (const [t, rem] of NON_COMMENT_EXPR(input.slice(1))) {
        yield [new UnaryHeader(input[0], t), rem];
    }
}


function* ParensHeaderParser(input: string[]): Gen<[Header, string[]]> {
    if (input.length == 0 || input[0] != "(") {
        return;
    }

    for (const [t, rem] of NON_COMMENT_EXPR(input.slice(1))) {
        if (rem.length == 0 || rem[0] != ")") {
            return;
        }

        yield [t, rem.slice(1)]
    }
}

function* SlashHeaderParser(input: string[]): Gen<[Header, string[]]> {
    if (input.length == 0) {
        return;
    }

    for (const [t1, rem1] of SUBEXPR(input)) {
        if (rem1.length == 0 || rem1[0] != "/") {
            return;
        }
        for (const [t2, rem2] of NON_COMMENT_EXPR(rem1.slice(1))) {
            yield [new BinaryHeader("/", t1, t2), rem2];
        }
    }

}

function* CommentHeaderParser(input: string[]): Gen<[Header, string[]]> {

    if (input.length == 0 || input[0] != "%") {
        return;
    }

    yield [new CommentHeader(), []];
}

export function parseHeader(headerText: string,
                            headerPos: CellPosition,
                            valueText: string,
                            valuePos: CellPosition,
                            namespace: Namespace,
                            devEnv: DevEnvironment): State {
    var pieces = headerText.split(/\s+|(\%|\(|\)|\/)/);
    pieces = pieces.filter((s: string) => s !== undefined && s !== '');
    var result = [... EXPR(pieces)];
    result = result.filter(([t, r]) => r.length == 0);
    if (result.length == 0) {
        devEnv.markError(headerPos.sheet, headerPos.row, headerPos.col,  
            `Cannot parse header: ${headerText}`);
        return Empty();
    }
    if (result.length > 1) {
         // shouldn't happen with this grammar, but just in case
        devEnv.markError(headerPos.sheet, headerPos.row, headerPos.col,            
            `Ambiguous header, cannot parse: ${headerText}`);
        return Empty();
    }
    const header = result[0][0];
    const state = header.compile(valueText, headerPos, namespace, devEnv);
    return state;

}