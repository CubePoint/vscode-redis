import { Event, EventEmitter, ExtensionContext, TreeDataProvider, window } from "vscode";
import { CacheKey } from "../common/constant";
import { Util } from "../common/util";
import AbstractNode from "../node/abstracNode";
import { RedisConfig } from "../node/config/redisConfig";
import ConnectionNode from "../node/connectionNode";
import { ClientManager } from "./clientManager";

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
        let host = await window.showInputBox({ prompt: "The hostname of the redis.", placeHolder: "host (default 127.0.0.1)", ignoreFocusOut: true });
        if (host === undefined) {
            return;
        } else if (host === '') {
            host = '127.0.0.1';
        }

        let port = await window.showInputBox({ prompt: "The port number to connect to.", placeHolder: "port (default 6379)", ignoreFocusOut: true });
        if (port === undefined) {
            return;
        } else if (port === '') {
            port = '6379';
        }

        const auth = await window.showInputBox({ prompt: "The auth of the redis. Leave empty to ignore", placeHolder: "auth", ignoreFocusOut: true });
        if (auth === undefined) return;

        const id = `${host}:${port}`;

        const redisConfig = { host, port: parseInt(port), auth }
        await this.init(redisConfig);

        const configs = this.getConnections();
        configs[id] = redisConfig;
        this.context.globalState.update(CacheKey.CONECTIONS_CONFIG, configs);

        this.refresh();
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
        const client =await ClientManager.getClient(redisConfig)
        return await Util.async((resolve) => {
            client.info((err, reply) => {
                resolve(reply)
            })
        })
    }
}