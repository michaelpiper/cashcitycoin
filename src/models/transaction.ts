import { Prop, getModelForClass, ReturnModelType, DocumentType } from "@typegoose/typegoose";
import { MongooseAdapter } from "../libs/connections";
import { TimeStamps } from "@typegoose/typegoose/lib/defaultClasses";
import { TransactionStatus } from "../libs/enum";
import * as crypto from "crypto";
import { Logger } from "../libs/logger";
import { addTransactionToChain } from "./chain";
import { md5 } from "../libs/utils";

const getProof = ():string=>{
    let string ="";
    for (let i =0;i<2;i++){
        string+= Math.floor(Math.random()*9);
    }
    return string;
}
export class TransactionSchema extends TimeStamps {
	@Prop({ required: true, uppercase:true })
	sender!: string;
    @Prop({ required: true, uppercase:true })
	recipient!: string;
	@Prop({ required: true })
    amount!: number;
    @Prop({ required: false,type: String, default:"", uppercase:true})
    narration = "";
    @Prop({ required: false, default:TransactionStatus.PENDING, enum:TransactionStatus })
    status?:TransactionStatus = TransactionStatus.PENDING;
    @Prop({ required: false, type:String,default:getProof, set: md5, get:(v:string):string=>v})
    nonce?:string|null = null;
    genNonce(previousHash:string|null):string{
        return crypto.createHash("sha256").update( JSON.stringify({
            previous_hash: previousHash,
            proof:this.nonce,
            block: {
                sender: this.sender,
                recipient: this.recipient,
                amount: this.amount
            },
        })).digest("hex");
    }
    async verifyNonce(nonce: string, previousHash:string|null):Promise<boolean>{
        if(this.nonce===null|| this.nonce===undefined) return false;
        if(this.nonce+previousHash!==nonce){
            await this.setPending();
            return false;
        }
        await this.setCompleted();
        return true;
    }
    async setStatus(status: TransactionStatus):Promise<void>{
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const model = this as any as  TransactionDocType;
        model.status = status;
        await model.save();
    }
    async setPending():Promise<void>{
        await this.setStatus( TransactionStatus.PENDING);
    }
    async setFailed():Promise<void>{
        await this.setStatus( TransactionStatus.FAILED);
    }
    async setVerifying():Promise<void>{
        await this.setStatus( TransactionStatus.VERIFYING);
    }
    async setCompleted():Promise<void>{
        try{
            await this.setStatus( TransactionStatus.COMPLETED );
            await addTransactionToChain(this);
        }catch(e){
            Logger.info("Transaction setCompleted",e);
        } 
    }
}

export const Transaction = getModelForClass(TransactionSchema, {
	existingConnection: MongooseAdapter.connection,
	schemaOptions: {
		collection: "transaction",
	},
});

export const verifyingTransaction = async ():Promise<TransactionDocType|null> => await Transaction.findOne({status:TransactionStatus.VERIFYING});
export type TransactionModelType = ReturnModelType<typeof TransactionSchema>;
export type TransactionDocType = DocumentType<TransactionSchema>;
