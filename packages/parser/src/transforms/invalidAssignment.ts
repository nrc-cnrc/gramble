import { TstAssignment, TstComponent, TstNamespace, TstProject, TstResult, TstTransform } from "../tsts";
import { Msgs, Result } from "../msgs";
import { RESERVED_WORDS } from "../headers";
import { TransEnv } from "../transforms";

export class InvalidAssignmentTransform extends TstTransform {

    constructor(
        public underNamespace: boolean = false
    ) { 
        super();
    }

    public get desc(): string {
        return "Handling invalid assignments";
    }

    public transform(t: TstComponent, env: TransEnv): TstResult {

        switch(t.constructor) {
            case TstAssignment:
                return this.transformAssignment(t as TstAssignment, env);
            case TstNamespace:
                return t.transform(new InvalidAssignmentTransform(true), env);
            case TstProject: 
                return t.transform(new InvalidAssignmentTransform(true), env);
            default: 
                return t.transform(new InvalidAssignmentTransform(false), env);
        }
    }
    
    public transformAssignment(t: TstAssignment, env: TransEnv): TstResult {
        const newThis = new InvalidAssignmentTransform(false);
        const result = t.transform(newThis, env) as Result<TstAssignment>;
        const [assignment, _] = result.destructure();
        const trimmedText = assignment.text.endsWith(":")
                            ? assignment.text.slice(0, assignment.text.length-1).trim()
                            : assignment.text;
        const trimmedTextLower = trimmedText.toLowerCase();

        if (!this.underNamespace) {
            return result.err("Wayward assignment",
                            "This looks like an assignment, but isn't in an " +
                            " appropriate position for one and will be ignored.")
                        .bind(r => r.child);
        }

        if (RESERVED_WORDS.has(trimmedTextLower)) {
            return result.err("Assignment to reserved word", 
                            "This cell has to be a symbol name for an assignment statement, but you're assigning to the " +
                            `reserved word ${trimmedText}.  Choose a different symbol name.`)
                         .bind(r => r.child);
                    
        }

        if (trimmedText.indexOf(".") != -1) {
            return result.warn("You can't assign to a name that contains a period.")
                         .bind(r => r.child)
        }

        return result;
    }
}
