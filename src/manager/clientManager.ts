import redis, { RedisClient } from "redis";
import { promisify } from "util";
import { RedisConfig } from "../node/config/redisConfig";
var AsyncLock = require('async-lock');
var lock = new AsyncLock();

export class ClientManager {

    private static activeClient: { [key: string]: redis.RedisClient } = {};

    public static async getClient(redisConfig: RedisConfig, db?: number, needlock?: boolean): Promise<{ client: redis.RedisClient, done: () => void }> {

        // TODO 1.需要检测redis连接是否正常 2. 是否需要进行open操作
        const key = `${redisConfig.host}_${redisConfig.port}_${redisConfig.auth}`;
        let client: RedisClient;
        if (this.activeClient[key]) {
            client = this.activeClient[key]
        } else {
            client = redis.createClient({
                host: redisConfig.host,
                port: redisConfig.port,
                auth_pass: redisConfig.auth,
                connect_timeout: 10000,
                db: redisConfig.db ? redisConfig.db : 0
            })
        }


        return new Promise(async resolve => {
            if (needlock) {
                lock.acquire(key, async (done) => {
                    await this.selectDb(db, redisConfig, client);
                    resolve({ client: this.activeClient[key] = client, done })
                });
            } else {
                await this.selectDb(db, redisConfig, client);
                resolve({ client, done: null })
            }
        })

    }


    private static async selectDb(db: number, redisConfig: RedisConfig, client: redis.RedisClient) {
        if ((db != null) && (redisConfig.db != db)) {
            await promisify(client.select).bind(client)(db);
            redisConfig.db = db;
        }
    }
}