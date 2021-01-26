import mongoose,{ Connection } from 'mongoose';
import { BaseStorageAdapter } from './storage';
export class MongooseStorageAdapter extends BaseStorageAdapter<Connection,string> {
    defaultConfig(): string {
        return "";
    }
    createConnection(url: string):Connection{
        return mongoose.createConnection(url, { 
            autoIndex: false,
            useUnifiedTopology: true,
            useNewUrlParser: true,
        });
    }
}