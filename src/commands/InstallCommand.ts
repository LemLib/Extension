import * as vscode from 'vscode';
import * as fs from 'fs';

import axios from 'axios';

import { getLatestGithubVersion, getLatestVerisonZipUrl } from '../extension';
import Command, { checkIfPros } from '../Command';
import { execute } from '../prosCli';

/**
 * The LemLib install command.
 * 
 * @author LemLib
 * @since 0.0.1
 * @version 0.0.1
 */
export default class InstallCommand extends Command {

    public async execute(...args: any[]): Promise<void> {
        if (!checkIfPros()) return;

        const progress = vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'Installing LemLib',
            cancellable: true
        }, async (progress, token) => {
            token.onCancellationRequested(() => {
                vscode.window.showInformationMessage('LemLib installation cancelled.');
            });

            await installLemLib(progress, token);
        });
    }
}

/**
 * Installs the latest version of LemLib.
 * 
 * @param progress The vscode progress object
 * @param token The vscode cancellation token
 * @returns A promise that resolves when the installation is complete
 */
async function installLemLib(progress: vscode.Progress<{ message?: string; increment?: number }>, token: vscode.CancellationToken): Promise<void> {
    if (token.isCancellationRequested) return;

    const version: string = await getLatestGithubVersion();

    const toDownload = 'LemLib@' + version + '.zip';

    progress.report({ message: 'Downloading ' + toDownload + '...' });

    const downloadUrl = await getLatestVerisonZipUrl();

    const workspaceFolders = vscode.workspace.workspaceFolders;

    if (!workspaceFolders) return;

    const workspaceFolder = workspaceFolders[0];

    const downloadPath = workspaceFolder.uri.fsPath + '/' + toDownload;

    const writer = fs.createWriteStream(downloadPath);

    const response = await axios.get(downloadUrl, { responseType: 'stream' });

    response.data.pipe(writer);

    await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
    });

    progress.report({ message: 'Fetching ' + toDownload + '...' });

    execute('pros', (data: string, stdin: any) => {}, 'c', 'fetch', toDownload);

    progress.report({ message: 'Applying ' + toDownload + '...' });

    execute('pros', (data: string, stdin: any) => {}, 'c', 'apply', toDownload.replace('.zip', ''));
    
    progress.report({ message: 'Cleaning up...' });

    // wait a 3 seconds to make sure the apply/fetch commands are done
    await new Promise(resolve => setTimeout(resolve, 3000));

    fs.unlinkSync(downloadPath);

    progress.report({ message: 'Successfully installed LemLib v' + version + '!' });

    vscode.window.showInformationMessage('Successfully installed LemLib v' + version + '!');
}