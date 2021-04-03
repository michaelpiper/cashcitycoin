import { Prop, getModelForClass, ReturnModelType, DocumentType } from "@typegoose/typegoose";
import { MongooseAdapter } from "../libs/connections";
import { TimeStamps } from "@typegoose/typegoose/lib/defaultClasses";
import * as crypto from "crypto";
import { TransactionSchema } from "./transaction";
import { TransactionStatus } from "../libs/enum";
import { ObjectId } from "mongodb";
import { BlockChain } from "./block-chain";

export class ChainSchema extends TimeStamps {
	@Prop({ default:null, type:String})
	previousHash!: string|null;
	@Prop({ required: false,_id:false})
    block!: BlockChain;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    get json ():Record<string,any>{
        return{
            previous_hash: this.previousHash,
            block: this.block,
        };
    }
    get hash():string{
        return  crypto.createHash("sha256").update( JSON.stringify(this.json)).digest("hex");
    }
}

export const Chain = getModelForClass(ChainSchema, {
	existingConnection: MongooseAdapter.connection,
	schemaOptions: {
		collection: "chain",
	},
});
export const lastChain = async():Promise<DocumentType<ChainSchema> | null>=>{
   return  await Chain.findOne().sort({'updatedAt': -1});
}
export const getChain = async(id:ObjectId):Promise<DocumentType<ChainSchema> | null>=>{
    return  await Chain.findById(id);
}
export const countChains = async():Promise<number>=>{
    return  await Chain.count({});
}
export const allChain = async(page=1,limit=50):Promise<DocumentType<ChainSchema>[]>=>{
    return  await Chain.find().sort({'updatedAt': -1}).limit(limit).skip((page-1)*limit);
}
export const addTransactionToChain=async (transaction:TransactionSchema):Promise<void>=>{
    if(transaction.status!==TransactionStatus.COMPLETED)return;
    const prevChain = await lastChain();
    const block = new BlockChain(transaction.sender, transaction.recipient, transaction.amount);
    const previousHash = (prevChain===null)?null:prevChain.hash;
    const chain = await Chain.create({previousHash,block});
    await chain.save();
    return; 
}
export type ChainModelType = ReturnModelType<typeof ChainSchema>;
export type ChainDocType = DocumentType<ChainSchema>;
