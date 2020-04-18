export enum NodeType {
    CONNECTION = 'connection', DB = 'db',FOLDER = 'folder',
    KEY = 'key', INFO = "info"
}

export enum CacheKey {
    CONECTIONS_CONFIG = "redis.connections",
    COLLAPSE_SATE = "redis.cache.collapseState",
}


export enum Command {
    REFRESH = "redis.refresh"
}