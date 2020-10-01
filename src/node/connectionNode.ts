import path from "path";
import { TreeItemCollapsibleState } from "vscode";
import { NodeType, Command } from "../common/constant";
import * as vscode from "vscode";
import AbstractNode from "./abstracNode";
import { RedisConfig } from "./config/redisConfig";
import DBNode from "./dbNode";
import { NodeState } from "../manager/nodeState";
import { ClientManager } from "../manager/clientManager";
import { ViewManager } from "../common/viewManager";

class ConnectionNode extends AbstractNode {

    contextValue = NodeType.CONNECTION;
    iconPath = path.join(__dirname, '..', '..', 'resources', 'image', `${this.contextValue}.png`);
    readonly iconDetailPath = path.join(__dirname, '..', '..', 'resources', 'image', `code-terminal.svg`);
    constructor(readonly name: string, readonly redisConfig: RedisConfig) {
        super(name, TreeItemCollapsibleState.Collapsed);
        this.id = name;
        this.collapsibleState = NodeState.get(this)
    }

    async getChildren() {
        if (!this.redisConfig.db) this.redisConfig.db = 0;
        return [new DBNode(this.redisConfig, "*", `DB${this.redisConfig.db}`, this.redisConfig.db)]
    }
    async openTerminal(): Promise<any> {
        const client = ClientManager.getClient(this.redisConfig)
        ViewManager.createWebviewPanel({
            splitView: true, title: `${this.redisConfig.host}@${this.redisConfig.port}`,
            iconPath: this.iconDetailPath,
            path: "terminal", initListener: (viewPanel) => {
                viewPanel.webview.postMessage({
                    type: "init",
                    config: this.redisConfig
                })
            }, receiveListener: (viewPanel, message) => {
                switch (message.type) {
                    case 'exec':
                        if (!message.content) {
                            return;
                        }
                        const splitCommand: string[] = message.content.replace(/ +/g, " ").split(' ')
                        const command = splitCommand.shift()
                        client.send_command(command, splitCommand, (err, response) => {
                            const reply = err ? err.message : response
                            viewPanel.webview.postMessage({ type: 'result', reply })
                            vscode.commands.executeCommand(Command.REFRESH)
                        })
                        break;
                    case 'exit':
                        viewPanel.dispose()
                        break;
                }
            }
        })
    }

    async showStatus(): Promise<any> {
        const client = ClientManager.getClient(this.redisConfig)
        client.info((err, reply) => {
            ViewManager.createWebviewPanel({
                title: "Redis Server Status", splitView: false,
                path: "status", initListener: (viewPanel) => {
                    viewPanel.webview.postMessage(reply)
                }
            })
        })
    }
}

export default ConnectionNode