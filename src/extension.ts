import * as vscode from 'vscode';

import axios from 'axios';

import InstallCommand from './commands/InstallCommand';

import { registerCommand } from './Command';
import UninstallCommand from './commands/UninstallCommand';

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

	await registerCommand(new InstallCommand());
	await registerCommand(new UninstallCommand());
}

export function deactivate() {}
