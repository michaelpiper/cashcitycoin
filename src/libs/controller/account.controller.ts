import { DocumentType } from "@typegoose/typegoose";
import {Request,Response} from "express";
import { IBasicAuthedRequest } from "express-basic-auth";
// import { Logger } from "../../libs/logger";
import { Account, AccountSchema } from "../../models/account";
export default class AccountController{
    static async generate(req:Request,res:Response):Promise<unknown>{
        const wallet_id = AccountSchema.generateId();
        const password = AccountSchema.generatePass();
        await AccountSchema.generate(wallet_id,password)
        return res.json({
            wallet_id,
            password
        });
    }
    static async account(req:Request,res:Response):Promise<unknown>{
        const auth  = (req as IBasicAuthedRequest).auth;
        const wallet = await Account.findOne({walletId:auth.user}) as DocumentType<AccountSchema>; 
        return res.json({
            wallet_id: auth.user,
            balance: await wallet.balance,
            amount_sent: await wallet.amount_sent,
            amount_received: await wallet.amount_received,
        });
    }
    static async balance(req:Request,res:Response):Promise<unknown>{
        const auth  = (req as IBasicAuthedRequest).auth;
        const wallet = await Account.findOne({walletId:auth.user}) as DocumentType<AccountSchema>; 
        return res.json( await wallet.balance);
    }
}