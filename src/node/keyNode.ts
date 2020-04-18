import path from "path";
import { promisify } from "util";
import { TreeItemCollapsibleState } from "vscode";
import { NodeType } from "../common/constant";
import { RedisConfig } from "./config/redisConfig";
import { ClientManager } from "../manager/clientManager";
import AbstractNode from "./abstracNode";
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

    public async detail() {
        const client = ClientManager.getClient(this.redisConfig)
        if (this.redisConfig.db != this.db.index) {
            await promisify(client.select).bind(client)(this.db.index)
            this.redisConfig.db = this.db.index
        }
        return await promisify(client.get).bind(client)(this.name)
    }
}