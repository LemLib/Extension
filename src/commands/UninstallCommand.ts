import * as vscode from 'vscode';

import Command, { checkIfPros } from "../Command";
import { execute } from "../prosCli";

export default class UninstallCommand extends Command {
    public execute(...args: any[]): void {
        if (!checkIfPros()) return;

        const progress = vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'Uninstalling LemLib',
            cancellable: true
        }, async (progress, token) => {
            token.onCancellationRequested(() => {
                vscode.window.showInformationMessage('LemLib uninstallation cancelled.');
            });

            progress.report({ message: 'Uninstalling LemLib...' });

            // wait for the pros command to finish
            new Promise(resolve => {
                execute('pros', 'c', 'uninstall', 'LemLib');
            }).then(() => vscode.window.showInformationMessage('Successfully uninstalled LemLib.'));
        });
    }
}