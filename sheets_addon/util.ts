



export class RandomPicker<T> implements Iterable<[T, number] | undefined> {

    private sum_of_weights: number = 0;

    public constructor(
        private items: Array<[T, number]>,
    ) {
        this.sum_of_weights = this.items.reduce((total, n) => total + n[1], 0);
    }

    [Symbol.iterator]() {
        return this
    }

    public push(item: T, weight: number): void {
        this.items.push([item, weight]);
        this.sum_of_weights += weight;
    }

    public pop(): [T, number] | undefined {
        if (this.items.length == 0) {
            return undefined;
        }
        if (this.items.length == 1) {
            return this.items.pop();
        }
        var n = Math.random() * this.sum_of_weights;
        for (var i = 0; i < this.items.length; i++) {
            n -= this.items[i][1];
            if (n < 0) {
                this.sum_of_weights -= this.items[i][1];
                const result = this.items[i];
                this.items.splice(i, 1);
                return result;
            }
        }
        throw new Error("Somehow didn't pick an item; something's wrong.")
    }

    public next(): IteratorResult<[T, number] | undefined > {
        if (this.items.length == 0) {
            return { done: true, value: undefined };
        }
        const popped = this.pop();
        if (popped == undefined) {
            throw new Error("Somehow didn't pick an item; something's wrong.")
        }
        return { done: false, value: popped };
    }
}


/*
function shuffle<T>(ar: T[]): T[] {
    ar = [...ar];
    var currentIndex = ar.length;
    var temporaryValue: T;
    var randomIndex: number;
  
    // While there remain elements to shuffle...
    while (0 !== currentIndex) {
  
      // Pick a remaining element...
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;
  
      // And swap it with the current element.
      temporaryValue = ar[currentIndex];
      ar[currentIndex] = ar[randomIndex];
      ar[randomIndex] = temporaryValue;
    }
  
    return ar;
}
*/


export function winnow<T>(items: T[], f: (item: T) => boolean): [T[], T[]] {
    const trueResults : T[] = [];
    const falseResults : T[] = [];
    for (const item of items) {
        if (f(item)) {
            trueResults.push(item);
            continue;
        }
        falseResults.push(item);
        continue;
    }
    return [trueResults, falseResults];
}
