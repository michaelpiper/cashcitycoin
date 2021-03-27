import { Prop, getModelForClass, ReturnModelType, DocumentType } from "@typegoose/typegoose";
import { MongooseAdapter } from "../libs/connections";
import { TimeStamps } from "@typegoose/typegoose/lib/defaultClasses";
import bcrypt from "bcrypt";
import * as crypto from "crypto";
import { Transaction } from "./transaction";
// import { Logger } from "../libs/logger";
import { TransactionStatus } from "../libs/enum";
import { makeRangeIterator, sha256 } from "../libs/utils";
export class AccountSchema extends TimeStamps {
	@Prop({ required: true, unique:true, uppercase:true })
	walletId!: string;
    @Prop({ required: true, unique:true, get:(val:string)=>val, set:sha256 })
    username!: string;
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
            Promise.all([this.amount_received, this.amount_sent]).then((result)=>{
                    const [creditBalance, debitBalance] = result;
                    return  creditBalance - debitBalance;
            }).then(resolve);    
        }) 
    }
    get amount_sent(): Promise<number>{
        return new Promise((resolve)=>{
            return Transaction.count({
                sender: this.walletId,
            }).then(async (count)=>{
                const it = makeRangeIterator(0,count);
                const mirror=(debit = 0)=>{
                    const next = it.next();
                    if(next.done){
                        return resolve(debit);
                    }
                    Transaction.find({
                        sender: this.walletId,
                    }).select("amount").skip(next.value).limit(0).then((debits)=>{
                        setImmediate(mirror,debit + debits.reduce((a,b)=>(a+b.amount),0));
                    });
                }
                setImmediate(mirror,0);
            })
           
               
        }) 
    }
    get amount_received(): Promise<number>{
        return new Promise((resolve)=>{
            return Transaction.count({
                recipient: this.walletId,
                status: TransactionStatus.COMPLETED
            }).then(async (count)=>{
                const it = makeRangeIterator(0,count);
                const mirror=(credit = 0)=>{
                    const next = it.next();
                    if(next.done){
                        return resolve(credit);
                    }
                    Transaction.find({
                        recipient: this.walletId,
                        status: TransactionStatus.COMPLETED
                    }).select("amount").skip(next.value).limit(0).then((credits)=>{
                        setImmediate(mirror,credit + credits.reduce((a,b)=>(a+b.amount),0));
                    }); 
                }
                setImmediate(mirror,0);
            });
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
        string.push(...alphabets.toLowerCase().split(""));
        string.push(...numbers.split(""));
        string.push(...specialCharacters.split(""));
        for(let i =0; i <32;i++){
            result+=string[Math.floor(Math.random()*string.length)];
        }
        return result;
    }
    static generateId(chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ", subfix=4):string{
        let result ="";
        const alphabets:string[] =chars.split("");
        const ids:string[] =Date.now().toString().split(""); 
        for(const id of ids){
            result+=alphabets[Number(id)];
        }
        for(let i =0; i <subfix;i++){
            result+=alphabets[Math.floor(Math.random()*alphabets.length)];
        }
        return result;
    }
    static async generate(walletId:string, username:string, password:string):Promise<AccountDocType>{
        return await Account.create({
            password,
            walletId,
            username,
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
