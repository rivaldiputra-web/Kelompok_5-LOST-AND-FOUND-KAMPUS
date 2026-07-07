import { createClient } from "redis";

let client = createClient({
    socket: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT, 10) || 6379,
        connectTimeout: 2000,
        reconnectStrategy: (retries) => {
            // Don't retry reconnecting on initial failure so the app can start instantly
            return false;
        }
    },
    username: process.env.REDIS_USERNAME || undefined, 
    password: process.env.REDIS_PASSWORD || undefined
});

let isRedisConnected = false;

client.on('error', (err) => {
    if (isRedisConnected) {
        console.error('Redis Client Error:', err);
    }
});

client.on('connect', () => {
    isRedisConnected = true;
    if(process.env.NODE_ENV !== 'test') {
        console.info('Redis terhubung dengan sukses!');
    }
});

const mockRedisClient = {
    connect: async () => {},
    disconnect: async () => {},
    get: async () => null,
    setEx: async () => 'OK',
    del: async () => 0,
    scan: async () => ({ cursor: '0', keys: [] }),
    flushAll: async () => 'OK',
    isMock: true
};

try {
    await client.connect();
} catch (e) {
    console.warn("⚠️ Peringatan: Gagal terhubung ke Redis. Aplikasi akan berjalan TANPA Redis (Direct DB Queries).");
    client = mockRedisClient;
}

export const redisClient = client;