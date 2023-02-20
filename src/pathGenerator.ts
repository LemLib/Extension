import * as vscode from 'vscode';


export function getWebviewOptions(extensionUri: vscode.Uri): vscode.WebviewOptions {
    return {
        enableScripts: true,
        localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'media')]
    };
}

export class PathGeneratorPanel {
    public static currentPanel: PathGeneratorPanel | undefined;

    public static readonly viewType = 'pathGenerator';

    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private _disposables: vscode.Disposable[] = [];

    public static createOrShow(extensionUri: vscode.Uri) {
		const column = vscode.window.activeTextEditor
			? vscode.window.activeTextEditor.viewColumn
			: undefined;

        if (PathGeneratorPanel.currentPanel) {
            PathGeneratorPanel.currentPanel._panel.reveal(column);
            return;
        }

        const panel = vscode.window.createWebviewPanel(PathGeneratorPanel.viewType, 'Path Generator', column || vscode.ViewColumn.One, getWebviewOptions(extensionUri));

        PathGeneratorPanel.currentPanel = new PathGeneratorPanel(panel, extensionUri);
    }

    public static revive(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        PathGeneratorPanel.currentPanel = new PathGeneratorPanel(panel, extensionUri);
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
        PathGeneratorPanel.currentPanel = undefined;

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
        this._panel.title = 'Path Generator';
        this._panel.webview.html = this._getHtmlForWebview(webview);
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'path-generator', 'scripts', 'main.js'));

        const styleResetUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'reset.css'));
        const styleVSCodeUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'vscode.css'));

        const mainCss = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'path-generator', 'path-generator.css'));
        
        const eventsJs = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'path-generator', 'scripts', 'events.js'));
        const graphicsJs = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'path-generator', 'scripts', 'graphics.js'));
        const pathJs = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'path-generator', 'scripts', 'path.js'));
        const settingsJs = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'path-generator', 'scripts', 'settings.js'));
        const vectorJs = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'path-generator', 'scripts', 'vector.js'));

        const fieldImg = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'path-generator', 'images', 'field.png'));

        const nonce = getNonce();

        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">

    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; img-src ${webview.cspSource} https:; script-src 'nonce-${nonce}';">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <!--
        VS Code required stylesheets
    -->
    <link href="${styleResetUri}" rel="stylesheet">
    <link href="${styleVSCodeUri}" rel="stylesheet">

    <!--
        Path Generator dependencies
    -->
    <link href="${mainCss}" rel="stylesheet">

    <title>Path Generator</title>
</head>
<body oncontextmenu="return false;">
    <div>
        <canvas id="fieldCanvas" class="fieldCanvas" width="693" height="693"></canvas>
    </div>

    <div class="sliderContainer">

        <input type="range" value="20" min="0" max="200" step="0.01" oninput="this.nextElementSibling.value = this.value" id="decelerationSlider">
        <output class="text" id="decelVal">20</output>
        <label for="decelerationSlider" class="text">Max Deceleration</label>

        <input type="range" value="62.83" min="0" max="200" step="0.01" oninput="this.nextElementSibling.value = this.value" id="maxSpeedSlider">
        <output class="text" id="maxSpeedVal">62.83</output>
        <label for="maxSpeedSlider" class="text">Max Speed</label>

        <input type="range" value="50" min="0.1" max="200" step="0.01" oninput="this.nextElementSibling.value = this.value" id="multiplierSlider">
        <output class="text" id="multiplierVal">50</output>
        <label for="multiplierSlider" class="text">Turn Multiplier</label>
        
        <button type="button" id="downloadPathBtn">Download Path Data</button>
        <input type="file" id="uploadPathBtn"></input>
        <label for="uploadPathBtn" id="uploadPathLabel">Upload Path Data</label>
    </div>

    <div class="modeContainer">
        <button type="button" id="modeBtn">mode</button>
    </div>

    <div class="debugContainer">
        <input type="file" id="uploadDebugBtn"></input>
        <label for="uploadDebugBtn" id="uploadDebugLabel">Upload Robot Debug Data</label>
        <button type="button" id="debugBackBtn">&#x23EE;</button>
        <button type="button" id="debugPauseBtn">&#x23EF;</button>
        <button type="button" id="debugForwardBtn">&#x23ED;</button>
        <input type="range" value ="0" min="0" max="100" step="1" oninput="this.nextElementSibling.value = this.value" id="timeSlider">
    </div>

    <div class="graph" id="graphContainer">
        <canvas id="leftMotorCanvas"></canvas>
        <canvas id="rightMotorCanvas"></canvas>
    </div>
    <script nonce="${nonce}">
        /**
         * Global objects
         */
        const decelerationSlider = document.getElementById('decelerationSlider');
        const maxSpeedSlider = document.getElementById('maxSpeedSlider');
        const multiplierSlider = document.getElementById('multiplierSlider');

        const decelerationText = document.getElementById('decelVal');
        const maxSpeedText = document.getElementById('maxSpeedVal');
        const multiplierText = document.getElementById('multiplierVal');

        let mode = 0; // 0: create; 1: debug
        let path;
        let highlightList = [];
        let highlightCircles = [];


        /**
         * Path settings
         */
        const spacing = 2; // target inches between points

        /**
         * Graphics settings
         */
        const imgTrueWidth = 147.8377757; // the width of the image in inches
        const img = new Image; // background image
        img.src = ${fieldImg};

        console.log(img.src);

        const fps = 60; // how many frames to render each second

        /**
         * Accessibility settings
         */
        const pointRadius = 1;
        const pointBorderWidth = 0;
        const lineWidth = 1;
        const controlPointColor = 'rgba(50, 161, 68, 0.452)';
        const controlPointRadius = 5;
        const controlPointBorderColor = 'rgba(50, 161, 68, 0.452)';
        const controlPointBorderWidth = 0;
        const controlLineWidth = 0.5;
        const controlLineColor = 'black';
    </script>
    <script nonce="${nonce}" src="${eventsJs}"></script>
    <script nonce="${nonce}" src="${graphicsJs}"></script>
    <script nonce="${nonce}" src="${pathJs}"></script>
    <script nonce="${nonce}" src="${vectorJs}"></script>
    <script nonce="${nonce}" src="${scriptUri}"></script>

</body>
</html>
`;
    }
}

export function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    return text;
}