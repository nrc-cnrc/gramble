import {GTable, makeTable, getTierAsString} from "./transducers"
import {Project, BrowserDevEnvironment, DevEnvironment} from "./spreadsheet"
import {parse as papaparse, ParseResult} from 'papaparse';
import {promisify} from 'es6-promisify';

export class ClientSideProject extends Project {

    public devEnv : DevEnvironment = new BrowserDevEnvironment();

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

export function fromHTML(elementID: string, callback: (error:any, project: ClientSideProject) => void): void {
    const project = new ClientSideProject();
    var element: any = document.getElementById(elementID);
    if (element == null) {
        return;
    }
    var input = element.textContent;
    papaparse(input, {
        complete: (results: ParseResult) => project.addParseResults(results, elementID, callback)
    });
}

export const fromHTMLAsync = promisify(fromHTML);


export function fromTable(elementID: string, callback: (error:any, project: ClientSideProject) => void): void {
    const project = new ClientSideProject();
    const element: any = document.getElementById(elementID);
    if (element == null) {
        return;
    }
    const input = element.textContent;

    const cells = Array.prototype.map.call(element.querySelectorAll('tr'), (tr) => {
        return Array.prototype.map.call(tr.querySelectorAll('td'), (td) => {
            return td.innerHTML;
          });
    });

    project.addSheet(elementID, cells as string[][], project.devEnv);
    callback(undefined, project);
}

export const fromTableAsync = promisify(fromTable);


export function fromData(cells: string[][], callback: (error:any, project: ClientSideProject) => void): void {
    const project = new ClientSideProject();
    project.addSheet("CurrentSheet", cells, project.devEnv);
    callback(undefined, project);
}

export const fromDataAsync = promisify(fromData);

export function fromURL(url: string, callback: (error: any, project: ClientSideProject) => void): void {
    //var input = document.getElementById('grammar').contentDocument.body.childNodes[0].innerHTML;  
    const project = new ClientSideProject();
    papaparse(url, {
        download: true,
        complete: (results: ParseResult) => project.addParseResults(results, url, callback)
    });
}

export const fromURLAsync = promisify(fromURL);