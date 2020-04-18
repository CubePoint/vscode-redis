import * as vscode from "vscode";
import { ExtensionContext, Disposable } from "vscode";
import ConnectionProvider from "./connectionProvider";
import Terminal from "./terminal";
import Panel from "./panel";
import { NodeState } from "./nodeState";

export default class ServiceManager {
    public provider: ConnectionProvider;
    public terminal: Terminal;
    public panel: Panel;
    private isInit = false;
    constructor(private context: ExtensionContext) {
        this.terminal = new Terminal(context);
        this.panel = new Panel(context);
    }

    public init(): Disposable[] {
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

