import redis from "redis";
import { RedisConfig } from "../node/config/redisConfig";

export class ClientManager {

    private static activeClient: { [key: string]: redis.RedisClient } = {};

    public static getClient(redisConfig: RedisConfig): redis.RedisClient {

        // TODO 1.需要检测redis连接是否正常 2. 是否需要进行open操作
        const key = `${redisConfig.host}_${redisConfig.port}_${redisConfig.auth}`;
        if (this.activeClient[key]) return this.activeClient[key];

        this.activeClient[key] = redis.createClient({
            host: redisConfig.host,
            port: redisConfig.port,
            auth_pass: redisConfig.auth,
            connect_timeout: 10000,
            db: redisConfig.db ? redisConfig.db : 0
        })
        return this.activeClient[key]
    }

}