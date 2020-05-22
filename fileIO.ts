import {createInterface} from 'readline';
import {promisify} from 'util';
import {Readable} from 'stream';
import {ReadStream as TtyReadStream} from "tty";

if (process.stdin instanceof TtyReadStream) {
    process.stdin.setRawMode(true);
}

export const fromStream = promisify(function textFromStream(inputStream: Readable, 
    lineCallback: (error: Error | null, s: string, r: number) => void,
    endCallback?: (error: Error | null) => void): void {

        var lineReader = createInterface({
            input: inputStream
        });

        var rownum = 0;
        lineReader.on('line', (line: string) => lineCallback(null, line, rownum++));

        lineReader.on('SIGINT', () => lineReader.pause());
        if (endCallback != undefined) {
            lineReader.on('close', endCallback);
        }
    }
);
