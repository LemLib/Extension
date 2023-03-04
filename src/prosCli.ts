import * as vscode from 'vscode';

const PROS_TERMINAL_NAME = 'PROS Terminal';

export function getProsTerminal(): vscode.Terminal | null {
    const terminal = vscode.window.terminals.find(terminal => terminal.name === PROS_TERMINAL_NAME);

    if (terminal) return terminal;

    return null;
}

export async function execute(command: string, ...args: string[]): Promise<boolean> {
    const terminal: vscode.Terminal | null = getProsTerminal();

    if (terminal === null) return false;

    terminal.sendText(command + ' ' + args.join(' '));

    return await new Promise(rs => {
        const check = 'PS C:';

        const interval = setInterval(() => {
            const text = terminal?.name;

            if (text?.startsWith(check)) {
                clearInterval(interval);

                rs(true);
            }
        }, 100);
    });
}
