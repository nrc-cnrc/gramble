import { 
    TstComponent, 
    TstResult, 
    TstTransform,
} from "../tsts";
import { AdjustAssignmentScope } from "./rescopeAssignment";
import { MissingParamsTransform } from "./missingParams";
import { InvalidAssignmentTransform } from "./invalidAssignment";

export class TstTransformAll {

    public get desc() {
        return "All TST transformations"
    }

    public transform(t: TstComponent): TstResult {

        const transforms: TstTransform[] = [
            new AdjustAssignmentScope(),
            new InvalidAssignmentTransform(),
            new MissingParamsTransform(),
        ]

        let result = t.msg();
        for (const transform of transforms) {
            result = result.bind(x => transform.transform(x));
        }

        return result;
    }
}
