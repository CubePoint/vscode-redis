import path from "path";
import { promisify } from "util";
import { TreeItemCollapsibleState } from "vscode";
import { NodeType } from "../common/constant";
import { RedisConfig } from "./config/redisConfig";
import { ClientManager } from "../manager/clientManager";
import AbstractNode from "./abstracNode";
import KeyNode from "./keyNode";

class DBNode extends AbstractNode {

    contextValue = NodeType.DB;
    iconPath = path.join(__dirname, '..', '..', 'resources', 'image', `${this.contextValue}.png`);
    constructor(readonly id: string, readonly index: number,
        readonly name: string, readonly redisConfig: RedisConfig) {
        super(name, TreeItemCollapsibleState.Collapsed);
    }

    async getChildren(): Promise<AbstractNode[]> {
        const client = ClientManager.getClient(this.redisConfig)
        if (this.redisConfig.db != this.index) {
            await promisify(client.select).bind(client)(this.index)
            this.redisConfig.db = this.index
        }
        const keys: string[] = await promisify(client.keys).bind(client)("*");
        const result = keys.sort().map((key: string) => {
            return new KeyNode(this, key, this.redisConfig)
        })
        return result;
    }

    /**
     * Open the panel to create Redis data
     */
    async addKey() {

    }
}

export default DBNode