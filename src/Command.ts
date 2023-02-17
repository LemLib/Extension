import * as vscode from 'vscode';

/**
 * Represents a LemLib command.
 * 
 * @author LemLib
 * @since 0.0.1
 * @version 0.0.1
 */
export default abstract class Command {

    /**
     * The namespace for all LemLib commands.
     * 
     * Used in the package.json file to
     * register the commands.
     * (Contributors section) 
     * 
     * @type {string}
    */
    public static readonly commandNamespace = 'lemlib.';

    /**
     * The callback function that is ran when the command is called.
     * 
     * @param args The arguments passed to the command.
     */
    public abstract execute(...args: any[]): void;

    /**
     * @returns The name of the command, including the namespace.
     */
    public getName(): string {
        return Command.commandNamespace + this.constructor.name.replace(/Command$/, '').toLowerCase();
    }

}

/**
 * Registers a LemLib command.
 * @param command the command to register
 * 
 * @returns true if the command was registered, false if it already exists
 */
export async function registerCommand(command: Command): Promise<boolean> {
    const commandName = command.getName();

    if ((await vscode.commands.getCommands()).includes(commandName)) return false;

    vscode.commands.registerCommand(commandName, command.execute);

    return true;
}