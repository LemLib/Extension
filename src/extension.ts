import * as vscode from 'vscode';

import axios from 'axios';

import { registerCommand } from './Command';

import PathGeneratorCommand from './commands/PathGeneratorCommand';
import UninstallCommand from './commands/UninstallCommand';
import InstallCommand from './commands/InstallCommand';
import CodeGenerator from './modules/gui-setup/codeGenerator';
import * as types from './modules/gui-setup/types';

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

	// for testing
	new CodeGenerator({
		code: {
			header: 'main.h',
		},
		setup: {
			motors: [
				new types.Motor('intake', 11, false),
			],
			chassis: {
				type: 'differential',

				leftMotors: new types.MotorGroup('left_drive', [new types.Motor('left_front_drive', 1, false), new types.Motor('left_middle_drive', 2, false), new types.Motor('left_back_drive', 3, false)]), // left drive
				rightMotors: new types.MotorGroup('right_drive', [new types.Motor('right_front_drive', 4, true), new types.Motor('right_middle_drive', 5, true), new types.Motor('right_back_drive', 6, true)]), // right drive
			
				odometry: {
					uses: 'rotation',
					trackingWheels: [
						{
							// left
							type: 'horizontal',
							sensor: new types.RotationSensor('left_rot', 7, true),
							wheelDiameter: 3.25,
							trackingCenterOffset: -4.6
						},
						{
							// right
							type: 'horizontal',
							sensor: new types.RotationSensor('right_rot', 8, false),
							wheelDiameter: 3.25,
							trackingCenterOffset: 1.7
						},
						{
							// back
							type: 'vertical',
							sensor: new types.RotationSensor('back_rot', 9, false),
							wheelDiameter: 3.25,
							trackingCenterOffset: 4.5
						}
					],
					inertial: new types.InertialSensor('inertial_sensor', 10)
				},

				pid: {
					lateral: {
						kP: 10,
						kD: 30,
						smallErrorRange: 1,
						smallErrorTimeout: 100,
						largeErrorRange: 3,
						largeErrorTimeout: 500
					},
					angular: {
						kP: 2,
						kD: 10,
						smallErrorRange: 1,
						smallErrorTimeout: 100,
						largeErrorRange: 3,
						largeErrorTimeout: 500
					}
				},

				trackWidth: 15.5,
			}
		},
		autonomous: [
			{
				name: 'red_right_auton',
				actions: [
					{
						type: 'setPose',
						args: {
							x: 0,
							y: 0,
							heading: 0
						},
					},
					{
						type: 'follow',
						args: {
							path: 'red_roller.txt'
						}
					}
				]
			}
		],
		opcontrol: {
			controller: {
				invert: true, // invert joystick values - necessary if drive is geared
				sensitivity: 1.0,
				deadzone: 0.1,

				mappings: [
					{
						button: types.ControllerButton.l2,
						action: 'revolve',
						motors: ['intake'],
						velocity: 200 // 200 rpm
					}
				]
			}
		}
	}).saveTo(context.extensionUri.fsPath + '/main.cpp');
}

export function deactivate() {}

export function getExtensionUri() {
	return extensionUri;
}
