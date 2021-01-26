import { MONGO_DB_URI } from "../../config";
import { MongooseStorageAdapter } from '../../modules/mongooseAdapter';
export const MongooseAdapter = new MongooseStorageAdapter().initialize(MONGO_DB_URI);