import * as vscode from 'vscode';

const PROS_TERMINAL_NAME = 'PROS Terminal';

export function getProsTerminal(): vscode.Terminal | null {
    const terminal = vscode.window.terminals.find(terminal => terminal.name === PROS_TERMINAL_NAME);

    if (terminal) return terminal;

    return null;
}

export function execute(command: string, ...args: string[]): void {
    const terminal: vscode.Terminal | null = getProsTerminal();

    if (terminal === null) return;

    terminal.sendText(command + ' ' + args.join(' '));
}