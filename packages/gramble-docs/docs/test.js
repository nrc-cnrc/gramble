import React from 'react';

import { Project } from './gramble';

console.log(`gramble = ${Project}`);

export const FOO = "hello world";

class DocusaurusDevEnvironment extends Gramble.SimpleDevEnvironment {

    constructor() {
        this.errorMsgs = []; // list of [sheet, row, col, shortMsg, msg, level]
    }

    markError(sheet, row, col, shortMsg, msg, level = "error") {
        this.errorMsgs.push([sheet, row, col, shortMsg, msg, level]);
    }

    markHeader(sheet, row, col, color) { }
    markContent(sheet, row, col, color) { }
    markCommand(sheet, row, col) { }
    markComment(sheet, row, col) { }
    markSymbol(sheet, row, col) { }

    highlight() { 
        console.log(this.errorMsgs);
    }
}

const DEV_ENV = new DocusaurusDevEnvironment();
const PROJECT = new Gramble.Project(DEV_ENV);

export function renderRows(title, rs, minWidth=10, minHeight=10) {

    const grambleRows = [];
    const rows = rs.split(";");
    for (const [rowIndex, row] of rows.entries()) {

        const cellsResult = [];
        const cells = row.split(",");
        
        for (let [colIndex, cell] of cells.entries()) {
            cell = cell.trim();
            cellsResult.push(cell);
        }
        grambleRows.push(cellsResult);
    }

    while (grambleRows.length < minHeight) {
        grambleRows.push([]);
    }

    const maxLength = Math.max(minWidth, ...grambleRows.map((r) => r.length));

    for (const row of grambleRows) {
        while (row.length < maxLength) {
            row.push("");
        }
    }

    const inputRows = [];
    for (const [rowIndex, row] of grambleRows.entries()) {
        const inputCells = [];
        
        for (let [colIndex, cell] of row.entries()) {
            cell = cell.trim()
            const stateName = `${rowIndex}:${colIndex}`;
            const [value, setValue] = React.useState(cell);
            inputCells.push(
                <td key={colIndex} style={{ border: 'none', padding: '0', margin:'0', height: '25px', backgroundColor: '#eee' }}>
                    <input style={{ 
                                width: "100px", 
                                border: 'none', 
                                padding: '0px',
                                margin: '0px 1px',
                                height: "25px", 
                                textAlign: 'center', 
                                backgroundColor: '#fff' }} 
                            type="text"
                            id={stateName}
                            autoComplete="off" 
                            name={stateName}
                            value={value} 
                            onFocus={(e) => { // necessary to turn off autocomplete
                                e.target.setAttribute('autocomplete', 'off');
                            }}
                            onChange={(e) => {
                                grambleRows[rowIndex][colIndex] = e.target.value;
                                setValue(e.target.value);
                                PROJECT.addSheetAsCells(title, grambleRows);
                            }}/>
                </td>
            );
        }
        
        inputRows.push(
            <tr key={rowIndex} style={{border: 'none', padding: '0px', margin: '0px', cellPadding: '0', cellspacing: '0px'}}>{inputCells}</tr>
        );
    }
    return <div className="grambleWidget" style={{
        position: "relative",
        display: 'inline',
        justifyContent: 'center',
        alignItems: 'center',
        height: '200px',
        width: '830px',
        fontSize: '20px',
      }}>
        <form style={{ autoComplete: "new-password"}}>
        <table style={{
                width: "500px",
                padding: '2px 4px', 
                margin: '2px auto', 
                border: '1px solid #777', 
                cellPadding: '0', 
                cellSpacing: '0',
                float: "left"
            }}>
            <tbody>
                {inputRows}
            </tbody>
        </table>
        </form>
        <table style={{
                width: "300px",
                padding: '2px 4px', 
                margin: '2px auto', 
                border: '1px solid #777', 
                cellPadding: '0', 
                cellSpacing: '0',
                float: "left"
            }}>
            <tbody  style={{width:"100%"}}>
                <tr style={{width:"100%"}}><td style={{width:"100%"}}><button style={{width:"100%"}}>Sync &amp; validate</button></td></tr>
            </tbody>
        </table>
    </div>;
}