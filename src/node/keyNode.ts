import path from "path";
import { promisify } from "util";
import * as vscode from "vscode";
import { TreeItemCollapsibleState } from "vscode";
import { Command, NodeType, RedisType } from "../common/constant";
import { ViewManager } from "../common/viewManager";
import { ClientManager } from "../manager/clientManager";
import AbstractNode from "./abstracNode";
import { RedisConfig } from "./config/redisConfig";
import DBNode from "./dbNode";

export default class KeyNode extends AbstractNode {

    readonly contextValue = NodeType.KEY;
    readonly iconPath = path.join(__dirname, '..', '..', 'resources', 'image', `${this.contextValue}.png`);
    readonly iconDetailPath = path.join(__dirname, '..', '..', 'resources', 'image', `redis.svg`);
    constructor(readonly db: DBNode, public name: string, readonly redisConfig: RedisConfig) {
        super(name, TreeItemCollapsibleState.None);
        this.id = `${this.db.id}.${this.name}`
        this.command = {
            title: 'View Key Detail',
            command: 'redis.key.detail',
            arguments: [this]
        }
    }

    /**
     * @todo Split the key by ':' and group them
     */
    async getChildren(): Promise<AbstractNode[]> {
        return [];
    }

    public async delete() {
        const client = ClientManager.getClient(this.redisConfig);
        await promisify(client.del).bind(client)(this.name)
        vscode.commands.executeCommand(Command.REFRESH)
    }


    public async detail() {

        const client = ClientManager.getClient(this.redisConfig);
        const type = await promisify(client.type).bind(client)(this.name)
        let content: any;
        switch (type) {
            case RedisType.string:
                content = await promisify(client.get).bind(client)(this.name)
                break;
            case RedisType.hash:
                const hall = await promisify(client.hgetall).bind(client)(this.name)
                content = Object.keys(hall).map(key => {
                    return { key, value: hall[key] }
                })
                break;
            case RedisType.list:
                content = await promisify(client.lrange).bind(client)
                    (this.name, 0, await promisify(client.llen).bind(client)(this.name))
                break;
            case RedisType.set:
                content = await promisify(client.smembers).bind(client)(this.name)
                break;
            case RedisType.zset:
                content = await promisify(client.zrange).bind(client)
                    (this.name, 0, await promisify(client.zcard).bind(client)(this.name))
                break;
        }
        const title = `${type}:${this.name}`;
        ViewManager.createWebviewPanel({
            path: "detail", title: title, splitView: true, iconPath: this.iconDetailPath,
            id: "detail",
            initListener: async (viewPanel) => {
                viewPanel.title = title;
                viewPanel.webview.postMessage({
                    type: "detail",
                    res: {
                        content, type,
                        name: this.name,
                        ttl: await promisify(client.ttl).bind(client)(this.name)
                    }
                })
            },
            receiveListener: async (viewPanel, message) => {
                switch (message.type) {
                    case 'refresh':
                        this.detail()
                        break;
                    case 'update':
                        switch (message.key.type) {
                            case 'string':
                                await promisify(client.set).bind(client)(message.key.name, message.key.content)
                                viewPanel.webview.postMessage({ res: `Update key ${message.key.name} to new value success!` })
                                break;
                        }
                        break;
                    case 'rename':
                        await promisify(client.rename).bind(client)(message.key.name, message.key.newName)
                        this.name = message.key.newName
                        this.detail()
                        vscode.commands.executeCommand(Command.REFRESH)
                        break;
                    case 'del':
                        await promisify(client.del).bind(client)(message.key.name)
                        vscode.commands.executeCommand(Command.REFRESH)
                        break;
                    case 'ttl':
                        await promisify(client.expire).bind(client)(message.key.name, message.key.ttl)
                        viewPanel.webview.postMessage({ res: `Change TTL for key:${message.key.name} success!` })
                        vscode.commands.executeCommand(Command.REFRESH)
                        break;
                }

            }
        })

    }

}