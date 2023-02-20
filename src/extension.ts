import * as vscode from 'vscode';

import axios from 'axios';

import { registerCommand } from './Command';

import PathGeneratorCommand from './commands/PathGeneratorCommand';
import UninstallCommand from './commands/UninstallCommand';
import InstallCommand from './commands/InstallCommand';

let extensionUri: vscode.Uri | null = null;

export async function getLatestGithubVersion(): Promise<string> {
	const response = await axios.get('https://api.github.com/repos/LemLib/LemLib/releases/latest');
	const json: unknown = response.data;

	if (typeof json !== 'object' || json === null) throw new Error('Invalid response from GitHub API');

	const { tag_name } = json as { tag_name: string };

	return tag_name.replace('v', '');
}

export async function getLatestVerisonZipUrl(): Promise<string> {
	const response = await axios.get('https://api.github.com/repos/LemLib/LemLib/releases/latest');
	const json: unknown = response.data;

	if (typeof json !== 'object' || json === null) throw new Error('Invalid response from GitHub API');

	const { assets } = json as { assets: { browser_download_url: string }[] };

	return assets[0].browser_download_url;
}

export async function activate(context: vscode.ExtensionContext) {	
	console.log('LemLib enabled');

	extensionUri = context.extensionUri;

	await registerCommand(new PathGeneratorCommand());
	await registerCommand(new UninstallCommand());
	await registerCommand(new InstallCommand());
}

export function deactivate() {}

export function getExtensionUri() {
	return extensionUri;
}
