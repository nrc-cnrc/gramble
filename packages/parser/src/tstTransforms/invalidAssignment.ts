import { TstAssignment, TstComponent } from "../tsts";
import { Err, Msgs, Warn } from "../msgs";
import { RESERVED_WORDS } from "../headers";

export class InvalidAssignmentTransform {

    constructor(
        public underNamespace: boolean = false
    ) { }

    public transform(
        t: TstComponent, 
    ): [TstComponent, Msgs] {

        switch(t.constructor.name) {
            case 'TstAssignment':
                return this.transformAssignment(t as TstAssignment);
            case 'TstNamespace':
                return t.transform(new InvalidAssignmentTransform(true));
            case 'TstProject': 
                return t.transform(new InvalidAssignmentTransform(true));
            default: 
                return t.transform(new InvalidAssignmentTransform(false));
        }
    }
    
    public transformAssignment(t: TstAssignment): [TstComponent, Msgs] {
        const newThis = new InvalidAssignmentTransform(false);
        const [result, msgs] = t.transform(newThis) as [TstAssignment, Msgs];
        const trimmedText = result.text.endsWith(":")
                            ? result.text.slice(0, result.text.length-1).trim()
                            : result.text
        const trimmedTextLower = trimmedText.toLowerCase();

        if (!this.underNamespace) {
            msgs.push(Err(
                "Wayward assignment",
                "This looks like an assignment, but isn't in an appropriate position "
               + "for one and will be ignored."
            ).localize(result.pos));
            return [result.child, msgs];
        }

        if (RESERVED_WORDS.has(trimmedTextLower)) {
            // oops, assigning to a reserved word
            msgs.push(Err("Assignment to reserved word", 
                "This cell has to be a symbol name for an assignment statement, but you're assigning to the " +
                `reserved word ${trimmedText}.  Choose a different symbol name.`
            ).localize(result.pos));     
            return [result.child, msgs];       
        }

        if (trimmedText.indexOf(".") != -1) {
            msgs.push(Warn(
                "You can't assign to a name that contains a period."
            ).localize(result.pos));
            return [result.child, msgs];
        }

        return [result, msgs];
    }
}
