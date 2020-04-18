export enum NodeType {
    CONNECTION = 'connection', DB = 'db',
    KEY = 'key', INFO = "info"
}

export enum CacheKey {
    CONECTIONS_CONFIG = "redis.connections",
    COLLAPSE_SATE = "redis.cache.collapseState",
}
