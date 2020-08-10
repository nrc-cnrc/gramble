

/*

An FST atomic transducer takes a list of [tape, state] pairs and a next character,
and returns a list of [tape, state] pairs compatible with advancing the machine by that character.

A state is a tuple of the cell's position (to determine if we're in there at all) and an index (e.g. the position
    in the literal that we're concerned with, although the index does not necessarily have to be used in this way).

*/

class TapeState {
    public cellID: string = "__START__";
    public index: number = -1;
    public tape: string = "";
}

class FSTLiteral {

    public cellID: string;

    constructor(
        public sheet: string,
        public row: number,
        public column: number,
        public text: string
    ) {
        this.cellID = sheet + row + column;    
    }

    public next(char: string, tapeStates: TapeState[]): TapeState[] {
        const results : TapeState[] = [];

        for (const state of tapeStates) {
            if (state.cellID != this.cellID) {
                continue;
            }
            
            if (state.index > this.text.length) {
                results.push({ cellID: state.cellID,
                         index: Infinity,
                         tape: state.tape });
            }

            if (this.text[state.index] == char) {
                results.push({ cellID: state.cellID,
                    index: state.index + 1,
                    tape: state.tape });
            }
        }

        return results;

    }

}