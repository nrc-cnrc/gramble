declare module 'unicode-properties' {
    //export function isMark(codePoint: number): boolean;
    export function getCategory(codePoint: number): string;
}