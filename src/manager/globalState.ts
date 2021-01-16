import { ExtensionContext, TreeItemCollapsibleState } from "vscode";

export class GlobalState {

    private static context: ExtensionContext;

    /**
     * cache init, Mainly initializing context object
     * @param context 
     */
    public static init(context: ExtensionContext) {
        this.context = context;
    }

    public static update(key: string, value: any) {
        this.context.globalState.update(key, value);
    }

    public static get(key: string) {
      return this.context.globalState.get(key);
  }

}