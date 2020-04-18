import path from "path";
import { TreeItemCollapsibleState } from "vscode";
import { NodeType } from "../common/constant";
import AbstractNode from "./abstracNode";
import { RedisConfig } from "./config/redisConfig";
import DBNode from "./dbNode";
import { NodeState } from "../manager/nodeState";

class ConnectionNode extends AbstractNode {

    contextValue = NodeType.CONNECTION;
    iconPath = path.join(__dirname, '..', '..', 'resources', 'image', `${this.contextValue}.png`);
    constructor(readonly name: string, readonly redisConfig: RedisConfig) {
        super(name, TreeItemCollapsibleState.Collapsed);
        this.id = name;
        this.collapsibleState = NodeState.get(this)
    }

    async getChildren() {
        const result: DBNode[] = [];
        for (let i = 0; i < 16; i++) {
            result.push(new DBNode(this.redisConfig, this.name, `DB${i}`, i));
        }
        return result
    }
}

export default ConnectionNode