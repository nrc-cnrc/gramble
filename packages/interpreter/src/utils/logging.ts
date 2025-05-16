export const SILENT = 0;
export const VERBOSE_TIME = 1;
export const VERBOSE_DEBUG = 1 << 1;
export const VERBOSE_EXPR = 1 << 2;
export const VERBOSE_STATES = 1 << 3;
export const VERBOSE_GRAMMAR = 1 << 4;

export function logDebug(verbose: number = SILENT, ...msgs: any[]): void {
    if ((verbose & VERBOSE_DEBUG) == VERBOSE_DEBUG) {
        console.log(...msgs);
    }
}

export function logTime(verbose: number, msg: string): void {
    if ((verbose & VERBOSE_TIME) == VERBOSE_TIME) {
        console.log(msg);
    }
}

export function logStates(verbose: number, msg: string): void {
    if ((verbose & VERBOSE_STATES) == VERBOSE_STATES) {
        console.log(msg);
    }
}

export function timeIt<T>(
    func: () => T, 
    verbose: boolean = true,
    message: string = "",
    startMessage: string = "",
): T {
    if (verbose && startMessage.length > 0) {
        console.log(startMessage);
    }
    const startTime = Date.now();
    const results = func();
    if (verbose) {
        const elapsedTime = msToTime(Date.now() - startTime);
        console.log(`${message}: ${elapsedTime}`);
    }
    return results;
}

export function msToTime(s: number): string {
    const ms = s % 1000;
    s = (s - ms) / 1000;
    const secs = s % 60;
    s = (s - secs) / 60;
    const mins = s % 60;
    const hrs = (s - mins) / 60;
    return `${hrs}h ${mins}m ${secs}.${ms.toString().padStart(3,"0")}s`;
}
