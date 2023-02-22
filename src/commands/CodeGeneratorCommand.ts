import * as vscode from 'vscode';

import Command, { checkIfPros } from '../Command';

import { CodeGeneratorPanel } from '../modules/gui-setup/codeGeneratorPanel';
import { getExtensionUri } from '../extension';

/**
 * Opens the Code Generator
 * 
 * @author LemLib
 * @since 0.0.1
 * @version 0.0.1
 */
export default class CodeGeneratorCommand extends Command {

    public async execute(...args: any[]): Promise<void> {
        if (!checkIfPros()) return;

        const uri: vscode.Uri | null = getExtensionUri();

        if (uri === null) {
            vscode.window.showErrorMessage('Cannot open the Code Generator: Failed to get extension URI.');
            return;
        }

        CodeGeneratorPanel.createOrShow(uri);
    }
}