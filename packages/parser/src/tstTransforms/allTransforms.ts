import { 
    TstComponent, 
    TstTransform,
} from "../tsts";
import { AdjustAssignmentScope } from "./rescopeAssignment";
import { MissingParamsTransform } from "./missingParams";
import { InvalidAssignmentTransform } from "./invalidAssignment";
import { Msgs } from "../msgs";

export class TstTransformAll {

    public transform(t: TstComponent): [TstComponent, Msgs] {

        let tst = t;
        const msgs: Msgs = [];
        const transforms: TstTransform[] = [
            new AdjustAssignmentScope(),
            new InvalidAssignmentTransform(),
            new MissingParamsTransform(),
        ]
        for (const transform of transforms) {
            const [newTst, ms] = transform.transform(tst);
            tst = newTst;
            msgs.push(...ms);
        }
        return [tst, msgs];
    }
}
