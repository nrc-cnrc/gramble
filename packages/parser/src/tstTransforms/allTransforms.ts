import { 
    TstComponent, 
    TstResult, 
    TstTransform,
} from "../tsts";
import { AdjustAssignmentScope } from "./rescopeAssignment";
import { MissingParamsTransform } from "./missingParams";
import { InvalidAssignmentTransform } from "./invalidAssignment";

export class TstTransformAll {

    public transform(t: TstComponent): TstResult {

        let result = t.msg();
        const transforms: TstTransform[] = [
            new AdjustAssignmentScope(),
            new InvalidAssignmentTransform(),
            new MissingParamsTransform(),
        ]
        for (const transform of transforms) {
            const [item, msgs] = result.destructure();
            result = transform.transform(item).msg(msgs);
        }

        return result;
    }
}
