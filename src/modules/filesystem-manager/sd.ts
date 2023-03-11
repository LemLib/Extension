import * as vscode from 'vscode';

import upload, { getLastUploadedPort } from './upload';
import * as cli from '../../prosCli';

export async function write(file: string, data: string[]): Promise<void> {
    if (getLastUploadedPort() === 0) await upload();

    return new Promise<void>((resolve, reject) => {
        const payload = {
            file: file,
            data: data
        };

        const command = 'write ' + JSON.stringify(payload);
        const slot = getLastUploadedPort();

        cli.execute('pros', (data: string, stdin: any) => {}, 'v5', 'run', '' + slot);
        
        setTimeout(() => {
            cli.execute('pros', (data: string, stdin: any) => {
                setTimeout(() => {
                    stdin.write(command + '\n');

                    // cli.execute('pros', (data: string, stdin: any) => {}, 'v5', 'stop');
                    // resolve();
                }, 1000);
            }, 'terminal');
        }, 1000);
    });
}