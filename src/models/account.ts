import { Prop, getModelForClass, ReturnModelType, DocumentType } from "@typegoose/typegoose";
import { MongooseAdapter } from "../libs/connections";
import { TimeStamps } from "@typegoose/typegoose/lib/defaultClasses";
import bcrypt from "bcrypt";
import * as crypto from "crypto";
import { Transaction } from "./transaction";
// import { Logger } from "../libs/logger";
import { TransactionStatus } from "../libs/enum";
export class AccountSchema extends TimeStamps {
	@Prop({ required: true,unique:true, uppercase:true })
	walletId!: string;

	@Prop({ required: false,get:(val:string)=>val, set: AccountSchema.encryptPassword})
    password!: string;
    @Prop({ required: false,default:null})
    apiKey!: string|null;
    @Prop({ required: false,default:""})
    apiSecret!: string;
    @Prop({ required: false,default:false})
    cooperator!: boolean;
    verifyPass(password: string):boolean{
        return bcrypt.compareSync(password,this.password);
    }
    generateHash(s:string):string|null{
        if(!this.apiSecret){
            return null;
        }
        return crypto.createHmac("sha256",this.apiSecret).update(s).digest("hex");
    }
    get balance (): Promise<number>{
        return new Promise((resolve)=>{
            Transaction.find({
                sender: this.walletId,
            }).then((debits)=>{
                return Transaction.find({
                    recipient: this.walletId,
                    status: TransactionStatus.COMPLETED
                }).then((credits)=>{
                    const debitBalance = debits.reduce((a,b)=>(a+b.amount),0);
                    const creditBalance = credits.reduce((a,b)=>(a+b.amount),0);
                    return  creditBalance-debitBalance;
                });
            }).then(resolve);    
        }) 
    }
    get amount_sent(): Promise<number>{
        return new Promise((resolve)=>{
            Transaction.find({
                sender: this.walletId,
            }).then((debits)=>{ 
                return debits.reduce((a,b)=>(a+b.amount),0);
            }).then(resolve);    
        }) 
    }
    get amount_received(): Promise<number>{
        return new Promise((resolve)=>{
           Transaction.find({
                    recipient: this.walletId,
                    status: TransactionStatus.COMPLETED
                }).then((credits)=>{
                    return credits.reduce((a,b)=>(a+b.amount),0);
                }).then(resolve);    
        }) 
    }
    static encryptPassword(val:string):string{
        return bcrypt.hashSync(val,10);
    }
    static generatePass():string{
        let result = "";
        const string:string[] = [];
        const alphabets = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        const numbers = "0123456789";
        const specialCharacters ="#$%&@";
        string.push(...alphabets.split(""));
        string.push(...numbers.split(""));
        string.push(...specialCharacters.split(""));
        for(let i =0; i <32;i++){
            result+=string[Math.floor(Math.random()*string.length)];
        }
        return result;
    }
    static generateId():string{
        let result ="";
        const alphabets:string[] =("ABCDEFGHIJKLMNOPQRSTUVWXYZ").split("");
        const ids:string[] =Date.now().toString().split(""); 
        for(const id of ids){
            result+=alphabets[Number(id)];
        }
        for(let i =0; i <4;i++){
            result+=alphabets[Math.floor(Math.random()*alphabets.length)];
        }
        return result;
    }
    static async generate(walletId:string,password:string):Promise<AccountDocType>{
        return await Account.create({
            password,
            walletId,
            apiKey: null,
            apiSecret: "",
            cooperator:false
        });
    }
}

export const Account = getModelForClass(AccountSchema, {
	existingConnection: MongooseAdapter.connection,
	schemaOptions: {
		collection: "account",
	},
});
export const findAccountByWalletId = async (walletId:string):Promise<DocumentType<AccountSchema> | null>=>{
    return  await Account.findOne({
        walletId
    })
}
export const findAccountByApiKey = async ( apiKey:string):Promise<DocumentType<AccountSchema> | null>=>{
    return  await Account.findOne({
        apiKey,
        cooperator: true
    })
}
export type AccountModelType = ReturnModelType<typeof AccountSchema>;
export type AccountDocType = DocumentType<AccountSchema>;
