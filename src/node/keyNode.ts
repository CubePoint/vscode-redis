import * as vscode from "vscode";
import path from "path";
import { promisify } from "util";
import { TreeItemCollapsibleState } from "vscode";
import { NodeType, Command, ResultType, RedisType } from "../common/constant";
import { RedisConfig } from "./config/redisConfig";
import { ClientManager } from "../manager/clientManager";
import AbstractNode from "./abstracNode";
import DBNode from "./dbNode";
import { ViewManager } from "../common/viewManager";

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
            case RedisType.list:
                break;
            case RedisType.hash:
                break;
            case RedisType.set:
                break;
            case RedisType.zset:
                break;
        }
        ViewManager.createWebviewPanel({
            viewType: "redis.detail", viewPath: "detail",
            viewTitle: "Key Detail", splitResultView: true,
            initListener: async (viewPanel) => {
                viewPanel.webview.postMessage({
                    type: ResultType.DETAIL,
                    res: {
                        content, type,
                        name: this.name,
                        ttl: await promisify(client.ttl).bind(client)(this.name)
                    }
                })

            }
        })

    }

}