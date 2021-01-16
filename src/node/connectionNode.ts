import path from "path";
import { TreeItemCollapsibleState } from "vscode";
import { NodeType, Command, CacheKey } from "../common/constant";
import * as vscode from "vscode";
import AbstractNode from "./abstracNode";
import { RedisConfig } from "./config/redisConfig";
import DBNode from "./dbNode";
import { NodeState } from "../manager/nodeState";
import { ClientManager } from "../manager/clientManager";
import { ViewManager } from "../common/viewManager";
import { InfoNode } from "./infoNode";
import { GlobalState } from "../manager/globalState";

class ConnectionNode extends AbstractNode {

    contextValue = NodeType.CONNECTION;
    iconPath = path.join(__dirname, '..', '..', 'resources', 'image', `${this.contextValue}.png`);
    readonly iconDetailPath = path.join(__dirname, '..', '..', 'resources', 'image', `code-terminal.svg`);
    constructor(readonly name: string, readonly redisConfig: RedisConfig) {
        super(name, TreeItemCollapsibleState.Collapsed);
        this.id = name;
        this.collapsibleState = NodeState.get(this)
    }

    async getChildren(): Promise<AbstractNode[]> {
        if (!this.redisConfig.db) this.redisConfig.db = 0;
        return new Promise(res => {
            let timeout = false;
            const client = ClientManager.getClient(this.redisConfig)
            setTimeout(() => {
                timeout = true;
                res([new InfoNode("Connect to redis server time out.")])
            }, 5000);
            client.ping(() => {
                if (!timeout) res([new DBNode(this.redisConfig, "*", `DB${this.redisConfig.db}`, this.redisConfig.db)])
            })
        })
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

    async showChangedb(): Promise<any> {
        const client = ClientManager.getClient(this.redisConfig)
        let value = await vscode.window.showInputBox(
            { // 这个对象中所有参数都是可选参数
                password: false, // 输入内容是否是密码
                ignoreFocusOut: false, // 默认false，设置为true时鼠标点击别的地方输入框不会消失
                placeHolder: `请输入 (当前${this.redisConfig.db})`, // 在输入框内的提示信息
                prompt: '0 ~ 15', // 在输入框下方的提示信息
                validateInput: (text) => (parseInt(text).toString() == text ? null : '请输入0~15数字')
            })
        if (value === undefined) return

        let db = parseInt(value)
        client.select(db, (err) => {
            if (err) { vscode.window.showErrorMessage(`切换失败(${err.message})`); return; }

            this.redisConfig.db = db
            const id = `${this.redisConfig.host}@${this.redisConfig.port}`
            let configs = GlobalState.get(CacheKey.CONECTIONS_CONFIG) || {}
            configs[id] = this.redisConfig
            GlobalState.update(CacheKey.CONECTIONS_CONFIG, configs)
            vscode.commands.executeCommand(Command.REFRESH)
        });
    }
}

export default ConnectionNode