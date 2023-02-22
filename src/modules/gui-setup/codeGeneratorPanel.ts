import * as vscode from 'vscode';


export function getWebviewOptions(extensionUri: vscode.Uri): vscode.WebviewOptions {
    return {
        enableScripts: true,
        localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'media')]
    };
}

export class CodeGeneratorPanel {
    public static currentPanel: CodeGeneratorPanel | undefined;

    public static readonly viewType = 'codeGenerator';

    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private _disposables: vscode.Disposable[] = [];

    public static createOrShow(extensionUri: vscode.Uri) {
		const column = vscode.window.activeTextEditor
			? vscode.window.activeTextEditor.viewColumn
			: undefined;

        if (CodeGeneratorPanel.currentPanel) {
            CodeGeneratorPanel.currentPanel._panel.reveal(column);
            return;
        }

        const panel = vscode.window.createWebviewPanel(CodeGeneratorPanel.viewType, 'LemLib Setup', column || vscode.ViewColumn.One, getWebviewOptions(extensionUri));

        CodeGeneratorPanel.currentPanel = new CodeGeneratorPanel(panel, extensionUri);
    }

    public static revive(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        CodeGeneratorPanel.currentPanel = new CodeGeneratorPanel(panel, extensionUri);
    }

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        this._panel = panel;
        this._extensionUri = extensionUri;

        this._update();

        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        this._panel.onDidChangeViewState(
            e => {
                if (this._panel.visible) this._update();
            },
            null,
            this._disposables
        );

        this._panel.webview.onDidReceiveMessage(
            message => {
                switch (message.command) {
                    case 'alert':
                        vscode.window.showErrorMessage(message.text);
                        return;
                }
            },
            null,
            this._disposables
        );
    }

    public dispose() {
        CodeGeneratorPanel.currentPanel = undefined;

        this._panel.dispose();

        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) x.dispose();
        }
    }

    private _update() {
        const webview = this._panel.webview;

        this._updateForHtml(webview);
    }

    private _updateForHtml(webview: vscode.Webview) {
        this._panel.title = 'LemLib Setup';
        this._panel.webview.html = this._getHtmlForWebview(webview);
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        const fs = require('fs');

        const styleResetUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'reset.css'));
        const styleVSCodeUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'vscode.css'));

        const mainCss = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'gui-setup', 'gui-setup.css'));

        const js = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'gui-setup', 'scripts', 'main.js'));

        const nonce = getNonce();

        return fs.readFileSync(vscode.Uri.joinPath(this._extensionUri, 'media', 'gui-setup', 'gui-setup.html').fsPath, 'utf8')
            .replace(/<!--HEADERS-->/g, `
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; img-src ${webview.cspSource} https:; script-src 'nonce-${nonce}';">

<link href="${styleResetUri}" rel="stylesheet" />
<link href="${styleVSCodeUri}" rel="stylesheet" />

<link href="${mainCss}" rel="stylesheet" />
`).replace(/<!--SCRIPTS-->/g, `<script nonce="${nonce}" src="${js}"></script>`);
    }
}

export function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    return text;
}