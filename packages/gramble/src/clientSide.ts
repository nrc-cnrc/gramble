import {GTable, makeTable, flattenToJSON, getTierAsString, objToTable} from "./transducers"
import {Project, BrowserDevEnvironment, DevEnvironment} from "./spreadsheet"
import {parse as papaparse, ParseResult} from 'papaparse';

export {GTable, makeTable, flattenToJSON, getTierAsString, Project, BrowserDevEnvironment};

export class ClientSideProject {

    protected project : Project = new Project();
    protected devEnv : DevEnvironment = new BrowserDevEnvironment();

    public addParseResults(results: ParseResult, url: string, callback: (project: ClientSideProject) => void) {
        if (results.errors.length > 0) {
            alert("Error parsing CSV file: \n" + results.errors.join("\n"));
            return;
        }
        this.project.addSheet(url, results.data, this.devEnv);
        this.devEnv.highlight();
        callback(this);
    }

    public parse(input: {[key: string]: string}, symbolName: string = 'MAIN', randomize: boolean = false, maxResults: number = -1): {[key: string]: string}[][] {
        const table = objToTable(input);
        const results = this.project.parse(symbolName, table, randomize, maxResults, this.devEnv);
        return results.map(record => {
            return record.map(([key, value]) => {
                return { tier: key.text, 
                        text: value.text,
                        sheet: value.sheet, 
                        row: value.row.toString(),
                        column: value.col.toString() };
            });
        });
    }
}


export function fromEmbeddedObject(elementID: string, callback: (project: ClientSideProject) => void): void {
    const project = new ClientSideProject();
    var element: any = document.getElementById(elementID);
    if (element == null) {
        return;
    }
    var input = element.contentDocument.body.childNodes[0].innerHTML;   
    var url = element.getAttribute('data');
    if (url == null) {
        url = "(unknown)";
    }
    papaparse(input, {
        complete: (results: ParseResult) => project.addParseResults(results, url, callback)
    });
}

export function fromURL(url: string, callback: (project: ClientSideProject) => void): void {
    //var input = document.getElementById('grammar').contentDocument.body.childNodes[0].innerHTML;  
    const project = new ClientSideProject();
    papaparse(url, {
        download: true,
        complete: (results: ParseResult) => project.addParseResults(results, url, callback)
    });
}
