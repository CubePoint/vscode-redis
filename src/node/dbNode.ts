import path from "path";
import { promisify } from "util";
import { TreeItemCollapsibleState } from "vscode";
import { NodeType } from "../common/constant";
import { RedisConfig } from "./config/redisConfig";
import { ClientManager } from "../manager/clientManager";
import AbstractNode from "./abstracNode";
import KeyNode from "./keyNode";
import { NodeState } from "../manager/nodeState";

export default class DBNode extends AbstractNode {

    contextValue = NodeType.DB;
    pattern = "*";
    constructor(readonly redisConfig: RedisConfig, readonly parentPattern: string, readonly name: string, readonly index: number) {
        super(name, TreeItemCollapsibleState.Collapsed);
        this.id = `${redisConfig.host}-${redisConfig.port}-${index}-${parentPattern}.${name}`
        this.iconPath = path.join(__dirname, '..', '..', 'resources', 'image', `${this.contextValue}.png`);
        this.collapsibleState = NodeState.get(this)
    }

    async getChildren(): Promise<AbstractNode[]> {
        const client = await ClientManager.getClient(this.redisConfig, this.index)
        const keys: string[] = await promisify(client.keys).bind(client)(this.pattern);

        const prefixMap: { [key: string]: AbstractNode[] } = {}
        for (const key of keys.sort()) {
            let prefix = key.replace(this.pattern.replace("*", ""), "").split(":")[0];
            if (!prefixMap[prefix]) prefixMap[prefix] = []
            prefixMap[prefix].push(new KeyNode(this, key, this.redisConfig))
        }

        return Object.keys(prefixMap).map((prefix: string) => {
            if (prefixMap[prefix].length > 1) {
                return new FolderNode(this.redisConfig, this.pattern, prefix, this.index)
            } else {
                return prefixMap[prefix][0]
            }
        })
    }

    /**
     * Open the panel to create Redis data
     */
    async addKey() {

    }
}

class FolderNode extends DBNode {
    contextValue = NodeType.FOLDER;
    constructor(readonly redisConfig: RedisConfig, readonly parentPattern: string, readonly name: string, readonly index: number) {
        super(redisConfig, parentPattern, name, index)
        this.iconPath = path.join(__dirname, '..', '..', 'resources', 'image', `${this.contextValue}.svg`);
        this.pattern = `${parentPattern.replace("*", "")}${name}:*`
    }
}
