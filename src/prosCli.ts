import * as vscode from 'vscode';

import * as cp from 'child_process';
import { channel } from 'diagnostics_channel';

const PROS_TERMINAL_NAME = 'PROS Terminal';

export function getProsTerminal(): vscode.Terminal | null {
    const terminal = vscode.window.terminals.find(terminal => terminal.name === PROS_TERMINAL_NAME);

    if (terminal) return terminal;

    return null;
}

export async function findAppdataFolder(): Promise<string | null> {
    switch (process.platform) {
        case 'win32':
            const homedir = require('os').homedir();
    
            return homedir.replace(/\\/g, '/') + '/AppData/Roaming';
        case 'darwin':
            return '/Users/' + process.env.USER + '/Library/Application Support';
        case 'linux':
            return '/home/' + process.env.USER + '/.config';
        default:
            return null;
    }
}

export async function cdTo(path: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        const child = cp.spawn('cd', [path], {
            cwd: vscode.workspace.rootPath,
            shell: 'powershell.exe'
        });

        child.on('exit', code => resolve());

        child.on('error', error => reject(error));
    });
}

/**
 * Executes a command using child_process
 * and returns the stdout + stderr as an array of strings
 * 
 * @param command The command to execute
 * @param args The arguments to pass to the command
 */
export async function execute(command: string, dataCallback: (data: string, stdin: any) => void = () => {}, ...args: string[]): Promise<string[]> {
    const appdata = await findAppdataFolder();
    // TODO: add support for other platforms, only windows is currently supported here
    const cliDirectory = appdata + '/Code/User/globalStorage/sigbots.pros/install/pros-cli-windows';
    const finalCommand = command === 'pros' ? '.\\pros' : command;

    return new Promise<string[]>(async (resolve, reject) => {
        const child = cp.spawn(finalCommand, args, {
            cwd: cliDirectory,
            shell: 'powershell.exe'
        });

        const output: string[] = [];
        const error: string[] = [];

        child.stdout.on('data', data => {
            dataCallback(data.toString(), child.stdin);
            output.push(data.toString());
        });

        child.stderr.on('data', data => {
            vscode.window.showErrorMessage('PROS Error - ' + data.toString());

            error.push(data.toString());
        });

        child.on('exit', code => {
            resolve(output);
        });

        child.on('error', error => reject(error));
    });
}