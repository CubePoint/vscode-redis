import { ExtensionContext, TreeItemCollapsibleState } from "vscode";
import { CacheKey, NodeType } from "../common/constant";
import AbstractNode from "../node/abstracNode";

export class NodeState {

    private static context: ExtensionContext;
    private static collpaseState: { key?: TreeItemCollapsibleState };

    /**
     * cache init, Mainly initializing context object
     * @param context 
     */
    public static init(context: ExtensionContext) {
        this.context = context;
    }

    /**
     * update tree node collapseState
     * @param element 
     * @param collapseState 
     */
    public static store(element?: AbstractNode, collapseState?: TreeItemCollapsibleState) {

        if (element.contextValue == NodeType.KEY || element.contextValue == NodeType.INFO) {
            return;
        }

        this.collpaseState[element.id] = collapseState;
        this.context.globalState.update(CacheKey.COLLAPSE_SATE, this.collpaseState);

    }

    /**
     * get element current collapseState or default collapseState
     * @param element 
     */
    public static get(element?: AbstractNode) {

        if (element.contextValue == NodeType.KEY || element.contextValue == NodeType.INFO) {
            return TreeItemCollapsibleState.None;
        }

        if (!this.collpaseState || Object.keys(this.collpaseState).length == 0) {
            this.collpaseState = this.context.globalState.get(CacheKey.COLLAPSE_SATE);
        }

        if (!this.collpaseState) {
            this.collpaseState = {};
        }

        if (this.collpaseState[element.id]) {
            return this.collpaseState[element.id];
        } else if (element.contextValue == NodeType.CONNECTION || element.contextValue == NodeType.DB) {
            return TreeItemCollapsibleState.Expanded;
        } else {
            return TreeItemCollapsibleState.Collapsed;
        }

    }



}