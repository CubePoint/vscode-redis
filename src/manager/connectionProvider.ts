import { Event, EventEmitter, ExtensionContext, TreeDataProvider, window } from "vscode";
import { CacheKey } from "../common/constant";
import { Util } from "../common/util";
import AbstractNode from "../node/abstracNode";
import { RedisConfig } from "../node/config/redisConfig";
import ConnectionNode from "../node/connectionNode";
import { ClientManager } from "./clientManager";
import { ViewManager } from "../common/viewManager";
import { rejects } from "assert";

export default class ConnectionProvider implements TreeDataProvider<AbstractNode> {
    _onDidChangeTreeData: EventEmitter<AbstractNode> = new EventEmitter<AbstractNode>();
    readonly onDidChangeTreeData: Event<AbstractNode> = this._onDidChangeTreeData.event;

    constructor(private context: ExtensionContext) { }
    getTreeItem(element: AbstractNode) {
        return element;
    }

    // usage: https://www.npmjs.com/package/redis
    async getChildren(element?: AbstractNode) {
        if (!element) {
            const config = this.getConnections();
            return Object.keys(config).map(key => {
                return new ConnectionNode(key, config[key]);
            })
        } else {
            return element.getChildren()
        }
    }

    refresh() {
        this._onDidChangeTreeData.fire();
    }

    async add() {

        ViewManager.createWebviewPanel({
            title: "connect", path: "connect", splitView: false,
            eventHandler: (handler) => {
                handler.on("connect", async (redisConfig) => {
                    const id = `${redisConfig.host}@${redisConfig.port}`;

                    try {
                        await this.init(redisConfig);
                    } catch (err) {
                        handler.emit('error', err.message)
                        return;
                    }

                    const configs = this.getConnections();
                    configs[id] = redisConfig;
                    handler.panel.dispose()
                    this.context.globalState.update(CacheKey.CONECTIONS_CONFIG, configs);
                    this.refresh();
                })
            }
        })

    }

    delete(element: ConnectionNode) {
        const configs = this.getConnections();
        delete configs[element.id];
        this.context.globalState.update(CacheKey.CONECTIONS_CONFIG, configs);
        this.refresh();
    }

    private getConnections(): { [key: string]: RedisConfig } {
        return this.context.globalState.get<{ [key: string]: RedisConfig }>(CacheKey.CONECTIONS_CONFIG) || {};
    }

    private async init(redisConfig: RedisConfig) {
        const client = ClientManager.getClient(redisConfig)
        return await Util.async((resolve, reject) => {
            client.info((err, reply) => {
                if (err) {
                    reject(err)
                }
                resolve(reply)
            })
        })
    }
}