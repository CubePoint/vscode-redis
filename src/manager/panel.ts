import { window, ViewColumn, ExtensionContext } from "vscode";
import fs from 'fs';
import path from "path";
import * as vscode from "vscode";
import KeyNode from "../node/keyNode";

export default class Panel {
    private readonly viewType = 'redis.view.panel';
    private readonly title = 'Redis';
    private readonly templatePath = path.join(__dirname, '..', '..', 'resources', 'webview', `index.html`);
    private extensionPath: string;
    constructor(context: ExtensionContext) {
        this.extensionPath = context.extensionPath;
    }

    private buildView(value: string) {
        const template = fs.readFileSync(this.templatePath).toString();
        return template.replace('editorPlaceHolder', value).replace(
            /\$\{webviewPath\}/gi,
            vscode.Uri.file(`${this.extensionPath}/resources/webview`).with({ scheme: 'vscode-resource' }).toString()
        );
    }

    /**
     * Create a panel to show the value of key
     * @param element The keyitem
     */
    public async show(element: KeyNode) {
        const detail = await element.detail()
        const panel = window.createWebviewPanel(
            this.viewType, this.title, ViewColumn.One, {}
        );
        panel.webview.html = this.buildView(detail)
    }

}
