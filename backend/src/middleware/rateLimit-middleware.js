import rateLimit from 'express-rate-limit'
import RedisStore from 'rate-limit-redis'
import {redisClient} from '../application/redis.js';

// Fungsi untuk mem-generate RedisStore baru dengan prefix yang unik jika Redis aktif
const getStoreOption = (prefixName) => {
    if (redisClient.isMock) {
        return undefined; // Fallback ke MemoryStore bawaan express-rate-limit
    }
    return new RedisStore({
        sendCommand: (...args) => redisClient.sendCommand(args),
        prefix: prefixName,
    });
};

const globalLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 10000,
    store: getStoreOption('rl_global:'),
    skip: () => process.env.NODE_ENV === 'test',
    message:{
        success: false,
        message: 'Terlalu banyak request. Silakan coba lagi dalam 10 menit.',
    },
    standardHeaders: true,
    legacyHeaders: true,
});

const strictLimiter = rateLimit({
    windowMs: 30 * 60 * 1000,
    max: 10,
    store: getStoreOption('rl_strict:'),
    skip: () => process.env.NODE_ENV === 'test',
    message:{
        success: false,
        message: 'Terlalu banyak percobaan gagal. Anda diblokir sementara selama 30 menit.',
    },
    standardHeaders: true,
    legacyHeaders: false,
})

const refreshLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, 
    max: 5, 
    store: getStoreOption('rl_refresh:'),
    skip: () => process.env.NODE_ENV === 'test',
    message: {
        success: false,
        message: 'Terlalu banyak permintaan. Silakan tunggu sebentar.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});

export{
    globalLimiter,
    strictLimiter,
    refreshLimiter
}