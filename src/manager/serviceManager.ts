import * as vscode from "vscode";
import { Disposable, ExtensionContext } from "vscode";
import { ViewManager } from "../common/viewManager";
import ConnectionProvider from "./connectionProvider";
import { NodeState } from "./nodeState";
import Terminal from "./terminal";

export default class ServiceManager {
    public provider: ConnectionProvider;
    public terminal: Terminal;
    private isInit = false;
    constructor(private context: ExtensionContext) {
        this.terminal = new Terminal(context);
    }

    public init(): Disposable[] {
        ViewManager.initExtesnsionPath(this.context.extensionPath)
        NodeState.init(this.context)
        if (this.isInit) return []
        const res: Disposable[] = []

        res.push(this.initTreeProvider())

        this.isInit = true
        return res
    }


    private initTreeProvider(): Disposable {
        this.provider = new ConnectionProvider(this.context);
        const treeview = vscode.window.createTreeView("github.cweijan.redis", {
            treeDataProvider: this.provider,
        });
        treeview.onDidCollapseElement((event) => {
            NodeState.store(event.element, vscode.TreeItemCollapsibleState.Collapsed);
        });
        treeview.onDidExpandElement((event) => {
            NodeState.store(event.element, vscode.TreeItemCollapsibleState.Expanded);
        });
        return treeview;
    }

}

