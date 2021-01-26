/* eslint-disable @typescript-eslint/no-explicit-any */
export abstract class BaseStorageAdapter<T = any, C = any> {
    protected _connection: any;
    protected _defaultConnection: any;
    protected config: C = {} as C;
    abstract defaultConfig(): Partial<C>|C;
    abstract createConnection(options: C): T;
    get defaultConnection(): any {
        return this._defaultConnection;
    }
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    set defaultConnection(defaultConnection:any) {
        this._defaultConnection=defaultConnection;
    }
    ensure<T extends BaseStorageAdapter>(adapter?: T):any{
        if (adapter && adapter.connection !== undefined) {
            return adapter.connection;
        }
        if (this._defaultConnection) {
            return this._defaultConnection;
        }
        throw new Error("Please pass a connection instance to this method or initialize a default connection in storage adapter");
    }
    initialize(options?: Partial<C>|C, makeDefault?: boolean): this {
        this.config = ( options || this.defaultConfig()) as C;
        this.connection = this.createConnection(this.config) as T;
        if (makeDefault) {
           this.defaultConnection = this._connection;
        }
        return this;
    }
    get connection():T {
        return this._connection as T;
    }
    set connection(conn:T) {
        this._connection = conn as T;
    }
    clone(options?: C): BaseStorageAdapter<T, C> {
        const a = this.constructor as { new():any };
        return ( new a() ).initialize(Object.assign(Object.assign({}, this.config), options));
    }
}