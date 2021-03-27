import { DocumentType } from "@typegoose/typegoose";
import {Request,Response} from "express";
import { IBasicAuthedRequest } from "express-basic-auth";
// import { Logger } from "../../libs/logger";
import { Account, AccountSchema } from "../../models/account";
export default class AccountController{
    static async findWallet(req:Request,res:Response):Promise<unknown>{
        const wallet_id = req.params.id;
        const wallet = await Account.findOne({walletId:wallet_id});
        if(wallet===null){
            res.status(404).json({
                message:"Wallet not found"
            });
        }
        return res.json({
           message:"Wallet exist"
        });
    }
    static async generate(req:Request,res:Response):Promise<unknown>{
        const wallet_id = Account.generateId();
        const password = Account.generatePass();
        const username = Account.generateId("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",9);
        await Account.generate(wallet_id, username, password)
        return res.json({
            
            wallet_id,
            username,
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