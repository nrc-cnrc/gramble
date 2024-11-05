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
    testConstructor: (id: string) => PropertyTest,
    numTests: number = 1000
): void {
    describe(`${desc}`, function() {
        let originalTest = testConstructor(""); // just a dummy
        let originalResult: PropertyTestResult = PropertyTestSuccess();

        for (let i = 0; i < numTests; i++) {
            const id = desc + " [" + padZeros(i, numTests) + "]";
            originalTest = testConstructor(id);
            originalResult = originalTest.run();
            if (originalResult.tag === "failure") break;
        }
    
        if (originalResult.tag === "success") {
            it(`${numTests} test(s) succeeded.`, function() {
                assert.isTrue(true);
            });
            return;
        }

        // we got a failure.
        it(`${originalTest.id} failed`, function() {
            // if (originalResult.tag === "success") return; // TS isn't able to infer this 
            assert.fail(originalResult.msg);
        });

        let currentTest = originalTest;
        let currentResult = originalResult;
        let foundAnotherFailure = true;
        while (foundAnotherFailure) {
            foundAnotherFailure = false;
            for (let i = 0; i < 100; i++) {
                const newTest = currentTest.reduce();
                if (currentTest.toStr() == newTest.toStr()) {
                    // don't test the exact same as the previous
                    // failure, we can end up looping infinitely
                    continue;
                }

                const newResult = newTest.run();
                if (newResult.tag === "success") continue;
                
                // it's a failure... good! that's what we're looking for
                foundAnotherFailure = true;
                currentTest = newTest;
                currentResult = newResult;
                break;
            }
        }

        if (currentTest.toStr() == originalTest.toStr()) {
            // we didn't find anything actually simpler
            return;
        }

        it(`Simplified test also fails`, function() {
            assert.fail(currentResult.msg);
        });

    });
}
