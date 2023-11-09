import { getCategory } from "unicode-properties";

export function parseCSV(str: string): string[][] {
    let arr: string[][] = [];
    let quote = false;  // 'true' means we're inside a quoted field
    let row = 0;
    let col = 0;

    // Iterate over each character, keep track of current row and column (of the returned array)
    for (let c = 0; c < str.length; c++) {
        let cc = str[c];                       // Current character
        let nc = str[c+1];                     // Next character
        arr[row] = arr[row] || [];             // Create a new row if necessary
        arr[row][col] = arr[row][col] || '';   // Create a new column (start with empty string) if necessary

        // If the current character is a quotation mark, and we're inside a
        // quoted field, and the next character is also a quotation mark,
        // add a quotation mark to the current column and skip the next character
        if (cc == '"' && quote && nc == '"') { 
            arr[row][col] += cc; 
            ++c; 
            continue; 
        }

        // If it's just one quotation mark, begin/end quoted field
        if (cc == '"') {
            quote = !quote; 
            continue; 
        }

        // If it's a comma and we're not in a quoted field, move on to the next column
        if (cc == ',' && !quote) { 
            ++col; 
            continue; 
        }

        // If it's a newline (CRLF) and we're not in a quoted field, skip the next character
        // and move on to the next row and move to column 0 of that new row
        if (cc == '\r' && nc == '\n' && !quote) { 
            ++row; 
            col = 0; 
            ++c; 
            continue; 
        }

        // If it's a newline (LF or CR) and we're not in a quoted field,
        // move on to the next row and move to column 0 of that new row
        if (cc == '\n' && !quote) { 
            ++row; 
            col = 0; 
            continue; 
        }

        if (cc == '\r' && !quote) { 
            ++row; 
            col = 0; 
            continue; 
        }

        // Otherwise, append the current character to the current column
        arr[row][col] += cc;
    }

    return arr;
}


const MARK_CATEGORIES = [ 'Lm', 'Sk', 'Mc', 'Me', 'Mn' ];
function isDiacritic(c: string) {
    const codePoint = c.charCodeAt(0);
    const category = getCategory(codePoint);
    return MARK_CATEGORIES.indexOf(category) != -1;
}

export function tokenizeUnicode(str: string): string[] {

    const results: string[] = [];
    let anticipate = false;
    let buffer: string[] = [];
    for (const c of str) {

        // there are three cases where we push to the buffer
        // but don't join/emit it yet: tie characters, diacritical
        // marks, and when we've previously seen a tie character and
        // haven't consumed the character it ties
        if (c == '\u0361' || c == '\u035C') {
            buffer.push(c);
            anticipate = true;
            continue;
        }

        if (isDiacritic(c)) {
            buffer.push(c);
            continue;
        }

        if (anticipate) {
            buffer.push(c);
            anticipate = false;
            continue;
        }

        // it's not special, it starts a new token
        if (buffer.length > 0) {
            results.push(buffer.join(""));
            buffer = [];
        }
        buffer.push(c);

    }

    if (buffer.length > 0) {
        results.push(buffer.join(""));
    }

    return results;
}