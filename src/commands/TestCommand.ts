import * as vscode from 'vscode';

import Command, { checkIfPros } from '../Command';

import upload from '../modules/filesystem-manager/upload';

/**
 * Tests features in the extension
 */
export default class TestCommand extends Command {
    
    public async execute(...args: any[]): Promise<void> {
        if (!checkIfPros()) return;

        try {
            await upload();
        } catch (error: any) {
            vscode.window.showErrorMessage(error.message);
            
            console.log(error);

            throw error;
        }
    }
}
