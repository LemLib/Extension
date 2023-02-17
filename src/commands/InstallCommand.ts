import * as vscode from 'vscode';

import Command from '../Command';

/**
 * The LemLib install command.
 * 
 * @author LemLib
 * @since 0.0.1
 * @version 0.0.1
 */
export default class InstallCommand extends Command {

    public async execute(...args: any[]): Promise<void> {
        vscode.window.showInformationMessage('Install command executed!');
    }

}