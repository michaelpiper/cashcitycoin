import { DocumentType } from "@typegoose/typegoose";
import { Request, Response } from "express";
import { IBasicAuthedRequest } from "express-basic-auth";
import { ObjectId } from "mongodb";
import { Transaction } from "../../models/transaction";
// import { Logger } from "../../libs/logger";
import { Account, AccountSchema } from "../../models/account";
import { isValidObjectId } from "mongoose";
export default class TransactionController{
    static async transfer(req:Request,res:Response):Promise<unknown>{
        if(!req.body.recipient){
            return res.status(422).json({
                message:"recipient required",
            });  
        }
        if(req.body.amount===undefined ){
            return res.status(422).json({
                message:"amount required",
            });  
        }
        if(req.body.amount<=0 ){
            return res.status(422).json({
                message:"amount invalid",
            });  
        }
        if(req.body.narration && String(req.body.narration).length>255 ){
            return res.status(422).json({
                message:"narration too long",
            });  
        }
        const auth  = (req as IBasicAuthedRequest).auth;
        const sender = await Account.findOne({walletId:auth.user}) as DocumentType<AccountSchema>; 
        const recipient = await Account.findOne({walletId:req.body.recipient}); 
        const balance = await sender.balance;
       
        if(balance<req.body.amount){
            return res.status(400).json({
                message:"balance is less than transaction amount",
            });  
        }
        if(recipient===null){
            return res.status(400).json({
                message:"recipient wallet not found",
            });  
        }
        if(sender.walletId===recipient.walletId){
            return res.status(400).json({
                message:"sender wallet must be different from recipient wallet address",
            });  
        }
        
        const transaction = await Transaction.create({
            sender:sender.walletId,
            recipient:req.body.recipient,
            amount:req.body.amount,
            narration:req.body.narration || ""
        });
        return res.json({
            transaction_id: transaction.id,
            balance: await sender.balance
        });
    }
    static async transactions(req:Request,res:Response):Promise<unknown>{
        const auth  = (req as IBasicAuthedRequest).auth;
        const transactions =  await Transaction.find({$or:[{sender:auth.user},{recipient:auth.user}]});
        return res.json(transactions);
    }
    static async transaction(req:Request,res:Response):Promise<unknown>{
        if(!isValidObjectId(req.params.id))  return res.status(422).json({message:"invalid transaction id"});
        const auth  = (req as IBasicAuthedRequest).auth;
        const transaction =  await Transaction.findOne({
            _id: new ObjectId(req.params.id),
            $or:[{sender:auth.user},{recipient:auth.user}]
        });
        if(transaction==null){
            return res.status(404).json(transaction); 
        }
        return res.json(transaction);
    }
}