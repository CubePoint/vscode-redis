import * as vscode from "vscode";
import { TreeItemCollapsibleState } from "vscode";
import AbstractNode from "./abstracNode";
import { NodeType } from "../common/constant";

export class InfoNode extends AbstractNode {
    identify: string;
    type: string = NodeType.INFO;
    constructor(private readonly label: string) {
        super(label, TreeItemCollapsibleState.None)
    }

    public async getChildren(): Promise<AbstractNode[]> {
        return [];
    }
}
