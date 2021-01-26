import { RedisDatabase } from "../enum";
import { ClientOpts } from "redis";
import { Redis, ENV, PROD } from "../../config";
import { RedisStorageAdapter } from '../../modules/redisAdapter';
const RedisClientOptions: ClientOpts = {
	host: Redis.HOST,
	port: Number(Redis.PORT),
};

if (Redis.AUTH) {
	RedisClientOptions.password = Redis.AUTH;
}
if(PROD){
	RedisClientOptions.db = RedisDatabase.PRODUCTION
}else if(ENV==="STAGING"){
	RedisClientOptions.db = RedisDatabase.STAGING
}else{
	RedisClientOptions.db = RedisDatabase.DEVELOPEMENT
}


export const RedisAdapter = new RedisStorageAdapter().initialize(RedisClientOptions);