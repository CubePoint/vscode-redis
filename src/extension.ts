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
        commands.registerCommand('redis.connection.delete', (connectionNode: ConnectionNode) => serviceManager.provider.delete(connectionNode)),
        commands.registerCommand('redis.connection.terminal', (connectionNode: ConnectionNode) => connectionNode.openTerminal()),
        commands.registerCommand(Command.REFRESH, () => serviceManager.provider.refresh()),
        commands.registerCommand('redis.key.add', (dbNode: DBNode) => dbNode.addKey()),
        commands.registerCommand('redis.key.detail', (keyNode: KeyNode) => keyNode.detail()),
        commands.registerCommand('redis.key.del', (keyNode: KeyNode) => keyNode.delete()),
    )
}
