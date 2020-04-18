import { commands, ExtensionContext } from 'vscode';
import ServiceManager from './manager/serviceManager';
import DBNode from './node/dbNode';
import KeyNode from './node/keyNode';
import ConnectionNode from './node/connectionNode';
import { Command } from './common/constant';

export function activate(context: ExtensionContext) {
    const serviceManager = new ServiceManager(context)
    context.subscriptions.push(
        ...serviceManager.init(),
        commands.registerCommand('redis.connection.add', () => serviceManager.provider.add()),
        commands.registerCommand('redis.connection.status', (connectionNode: ConnectionNode) => connectionNode.showStatus()),
        commands.registerCommand('redis.connection.delete', (element: ConnectionNode) => serviceManager.provider.delete(element)),
        commands.registerCommand(Command.REFRESH, () => serviceManager.provider.refresh()),
        commands.registerCommand('redis.key.add', (element: DBNode) => element.addKey()),
        commands.registerCommand('redis.key.detail', (element: KeyNode) => element.detail()),
        commands.registerCommand('redis.key.del', (element: KeyNode) => element.delete()),
    )
}
