import redis, { RedisClient } from "redis";
import { RedisConfig } from "../node/config/redisConfig";

export class ClientManager {

    private static activeClient: { [key: string]: redis.RedisClient } = {};

    public static getClient(redisConfig: RedisConfig): redis.RedisClient {

        const key = `${redisConfig.host}_${redisConfig.port}_${redisConfig.auth}`;
        let client: RedisClient;
        if (this.activeClient[key]) {
            client = this.activeClient[key]
        } else {
            client = redis.createClient({
                host: redisConfig.host,
                port: redisConfig.port,
                db: redisConfig.db,
                auth_pass: redisConfig.auth,
                connect_timeout: 7000
            })
        }
        return client;
    }

}