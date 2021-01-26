import { Prop, getModelForClass, ReturnModelType, DocumentType } from "@typegoose/typegoose";
import { MongooseAdapter } from "../libs/connections";
import { TimeStamps } from "@typegoose/typegoose/lib/defaultClasses";
import * as crypto from "crypto";
import { TransactionSchema } from "./transaction";
// import { Logger } from "../libs/logger";
import { TransactionStatus } from "../libs/enum";
import { ObjectId } from "mongodb";
class BlockChain{
    @Prop({ required: true})
    sender!:string;
    @Prop({ required: true})
    recipient!:string;
    @Prop({ required: true})
    amount!:number;
}
export class ChainSchema extends TimeStamps {
	@Prop({ default:null})
	previousHash!: string|null;
	@Prop({ required: false,type:Array,_id:false})
    block: BlockChain[]=[];
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
    let chain = await lastChain();
    if(chain===null){
        chain = await Chain.create({
            previousHash:null,
            block:[]
        });
    }
    if(chain.block.length===20){
        chain = await Chain.create({
            previousHash:chain.hash,
            block:[]
        });
    }
    const blockchain = new BlockChain()
    blockchain.amount = transaction.amount;
    blockchain.recipient = transaction.recipient;
    blockchain.sender = transaction.sender;
    chain.block.push(blockchain);
    await chain.save();
    return; 
    
}
export type ChainModelType = ReturnModelType<typeof ChainSchema>;
export type ChainDocType = DocumentType<ChainSchema>;
