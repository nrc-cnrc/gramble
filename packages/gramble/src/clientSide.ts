import {GTable, makeTable, flattenToJSON, getTierAsString, objToTable} from "./transducers"
import {Project, BrowserDevEnvironment, DevEnvironment} from "./spreadsheet"
import {parse as papaparse, ParseResult} from 'papaparse';
import {promisify} from 'es6-promisify';

export {GTable, makeTable, flattenToJSON, getTierAsString, Project, BrowserDevEnvironment};

export class ClientSideProject extends Project {

    protected devEnv : DevEnvironment = new BrowserDevEnvironment();

    public addParseResults(results: ParseResult, url: string, callback: (error: any, project: ClientSideProject) => void): void {
        if (results.errors.length > 0) {
            const error = new Error("Error parsing CSV file: \n" + results.errors.join("\n"));
            callback(error, this);
            return;
        }
        this.addSheet(url, results.data, this.devEnv);
        this.devEnv.highlight();
        callback(null, this);
    }


}

export function fromEmbed(elementID: string, callback: (error: any, project: ClientSideProject) => void): void {
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

export const fromEmbedAsync = promisify(fromEmbed);

export function fromURL(url: string, callback: (error: any, project: ClientSideProject) => void): void {
    //var input = document.getElementById('grammar').contentDocument.body.childNodes[0].innerHTML;  
    const project = new ClientSideProject();
    papaparse(url, {
        download: true,
        complete: (results: ParseResult) => project.addParseResults(results, url, callback)
    });
}

export const fromURLAsync = promisify(fromURL);