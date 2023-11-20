import { assert } from "chai";

export interface PropertyTest {
    id: string,
    run(): PropertyTestResult,
    reduce(): PropertyTest,
    toStr(): string
}

export type PropertyTestResult 
        = { tag: "success" } 
        | { tag: "failure", msg: string };

export function PropertyTestSuccess(): PropertyTestResult {
    return { tag: "success" };
}

export function PropertyTestFailure(msg: string): PropertyTestResult {
    return { tag: "failure", msg };
}

export function padZeros(i: number, max: number) {
    return `${i}`.padStart(Math.log10(max), "0");
};


export function testToBreaking(
    desc: string,
    testConstructor: new (id: string) => PropertyTest,
    numTests: number = 1000
): void {
    describe(`Property ${desc}`, function() {
        let test = new testConstructor(""); // just a dummy
        let result: PropertyTestResult = PropertyTestSuccess();

        for (let i = 0; i < numTests; i++) {
            const id = desc + padZeros(i, numTests);
            test = new testConstructor(id);
            result = test.run();
            if (result.tag === "failure") break;
        }
    
        if (result.tag === "success") {
            it(`${numTests} test(s) succeeded.`, function() {
                assert.isTrue(true);
            });
            return;
        }

        // we got a failure.
        it(`${test.id} failed`, function() {
            if (result.tag === "success") return; // TS isn't able to infer this 
            assert.fail(result.msg);
        });

        let simplifiedTest = test;
        let simplifiedResult = result;
        let foundAnotherFailure = true;
        while (foundAnotherFailure) {
            foundAnotherFailure = false;
            for (let i = 0; i < 100; i++) {
                const newTest = simplifiedTest.reduce();
                if (simplifiedTest.toStr() == newTest.toStr()) {
                    // don't test the exact same as the previous
                    // failure, we'll end up looping
                    continue;
                }

                const newResult = newTest.run();
                if (newResult.tag === "success") continue;
                
                // it's a failure... good! that's what we're looking for
                foundAnotherFailure = true;
                simplifiedTest = newTest;
                simplifiedResult = newResult;
                break;
            }
        }

        if (simplifiedTest.toStr() == test.toStr()) {
            // we didn't find anything actually simpler
            return;
        }

        it(`Simplified test also fails`, function() {
            assert.fail(simplifiedResult.msg);
        });

    });
}