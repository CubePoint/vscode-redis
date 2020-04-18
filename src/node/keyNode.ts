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
    constructor(readonly db: DBNode, readonly name: string, readonly redisConfig: RedisConfig) {
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
        const client = await ClientManager.getClient(this.redisConfig, this.db.index);
        await promisify(client.del).bind(client)(this.name)
        vscode.commands.executeCommand(Command.REFRESH)
    }


    public async detail() {

        const client = await ClientManager.getClient(this.redisConfig, this.db.index);
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
        ViewManager.createWebviewPanel({
            viewType: "redis.detail", viewPath: "detail",
            viewTitle: "Key Detail", splitResultView: true,
            initListener: async (viewPanel) => {
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
                    case 'del':
                        await promisify(client.del).bind(client)(message.key.name)
                        vscode.commands.executeCommand(Command.REFRESH)
                        break;
                    case 'ttl':
                        await promisify(client.del).bind(client)(message.key.name)
                        vscode.commands.executeCommand(Command.REFRESH)
                        break;
                }

            }
        })

    }

}