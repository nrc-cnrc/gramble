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
        return toObj(results);
    }

    public sample(symbolName: string = 'MAIN', maxResults: number = 1): {[key: string]: string}[][] {
        const results = this.project.sample(symbolName, maxResults, this.devEnv);
        return toObj(results);
    }

    public generate(symbolName: string = 'MAIN', randomize: boolean = false, maxResults: number = -1): {[key: string]: string}[][] {
        const results = this.project.generate(symbolName, randomize, maxResults, this.devEnv);
        return toObj(results);
    }

    public flatten(input: {[key: string]: string}[][]): {[key: string]: string}[] {
        return input.map(record => {
            var result: {[key: string]: string} = {};
            for (const entry of record) {
                if (entry.tier in result) {
                    result[entry.tier] += entry.text;
                } else {
                    result[entry.tier] = entry.text;
                }
            }
            return result;
        });
    }

}

function toObj(table: GTable): {[key:string]:string}[][] {
    return table.map(record => {
        return record.map(([key, value]) => {
            return { tier: key.text, 
                    text: value.text,
                    sheet: value.sheet, 
                    row: value.row.toString(),
                    column: value.col.toString() };
        });
    });
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
