import { ClientOpts, createClient, RedisClient } from 'redis';
import { BaseStorageAdapter } from './storage';

export class RedisStorageAdapter extends BaseStorageAdapter {
    defaultConfig():Record<string, unknown> {
        return {};
    }
    createConnection(options: ClientOpts):RedisClient{
        return createClient(options);
    }
}