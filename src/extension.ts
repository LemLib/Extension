import * as vscode from 'vscode';

import InstallCommand from './commands/InstallCommand';

import { registerCommand } from './Command';

export async function activate(context: vscode.ExtensionContext) {
	console.log('LemLib enabled');

	// register commands
	await registerCommand(new InstallCommand());
}

export function deactivate() {}
