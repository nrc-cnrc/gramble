
/**
 * DevEnvironment
 * 
 * To make an editor (e.g. Google Sheets) "smart" about Gramble, you implement this interface.  Most
 * of the public-facing methods of the Project edifice take an DevEnvironment instance as an argument.
 * When parsing a spreadsheet, executing a unit test, etc., the Parser will notify the DevEnvironment instance
 * that particular cells are errors, comments, column headers, etc.
 */
export interface DevEnvironment {
    getErrorMessages(): [string, number, number, string, "error"|"warning"|"info"][];

    markError(sheet: string, row: number, col: number, msg: string, level: "error"|"warning"|"info"): void;
    markTier(sheet: string, row: number, col: number, tier: string): void;
    markComment(sheet: string, row: number, col: number): void;
    markHeader(sheet: string, row: number, col: number, tier: string): void;
    markCommand(sheet: string, row: number, col: number): void;
    markSymbol(sheet: string, row: number, col: number): void;
    setColor(tierName: string, color: string): void;
    highlight(): void;
    alert(msg: string): void;
}