import { Gen } from "./func";

export function *randomCut<T>(
    gs: T[], 
    random: boolean,
): Gen<T> {
    const offset = random
                     ? Math.floor(Math.random()*gs.length)
                     : 0;
    for (let i = 0; i < gs.length; i++) {
        const mod_i = (i+offset) % gs.length;
        yield gs[mod_i];
    }
}

export function *randomCutIter<T>(
    gs: Gen<T>[], 
    random: boolean,
): Gen<T> {
    const offset = random 
                     ? Math.floor(Math.random()*gs.length)
                     : 0;
    for (let i = 0; i < gs.length; i++) {
        const mod_i = (i+offset) % gs.length;
        yield *gs[mod_i];
    }
}

export function fisherYates<T>(a: T[]): T[] {
    let current = a.length; 
    let rand = 0;
    while (current > 0) {
        rand = Math.floor(Math.random() * current);
        current--;
        [a[current], a[rand]] = [a[rand], a[current]];
    }
    return a;
}

export function randomChoice<T>(xs: T[]): T {
    const i = Math.floor(Math.random() * xs.length);
    return xs[i];
}

export function randomString(len: number): string {
    return (Math.random() + 1).toString(36).substring(2, len+2);
}

export function poisson(mean: number): number {
    const L = Math.exp(-mean);
    let p = 1.0;
    let k = 0;
    
    do {
        k++;
        p *= Math.random();
    } while (p > L);
    
    return k - 1;
}