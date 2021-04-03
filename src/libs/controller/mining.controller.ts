import { DocumentType } from "@typegoose/typegoose";
import { Request, Response } from "express";
import { IBasicAuthedRequest } from "express-basic-auth";
import { Transaction, verifyingTransaction } from "../../models/transaction";
// import { Logger } from "../../libs/logger";
import { Account, AccountSchema } from "../../models/account";
import { TransactionStatus } from "../enum";
import { Logger } from "../logger";
import { isValidObjectId } from "mongoose";
import { lastChain } from "../../models/chain";
import { miningReward } from "../utils";
export default class MiningController{
    static async previousHash(req:Request,res:Response):Promise<unknown>{
        const chain = await lastChain();
        if(chain==null){
            return res.json(chain);
        }
        return res.json(chain.hash);
    }
    static async verifyTransaction(req:Request,res:Response):Promise<unknown>{
       const _transaction = req.body.transaction;
       if(!req.body.nonce){
        return res.status(422).json({message:"nonce required"});
       }
       if(req.body.previous_hash===undefined){
        return res.status(422).json({message:"previous_hash required"});
       }
       if(!_transaction){
        return res.status(422).json({message:"transaction required"});
       }
       if(!isValidObjectId(_transaction.id))  return res.status(422).json({message:"invalid transaction id"});
        if(await verifyingTransaction()!==null){
            return res.status(400).json({message:"transaction verifying"});
        }
        const auth  = (req as IBasicAuthedRequest).auth;
        const wallet = await Account.findOne({username:auth.user}) as DocumentType<AccountSchema>; 
        const transaction = await Transaction.findById(req.body.transaction.id);
        if(transaction===null){
            return res.status(404).json({message:"transaction not found"});
        }
        if(transaction.status===TransactionStatus.VERIFYING){
            return res.status(400).json({message:"transaction already verifying"});
        }
        if(transaction.status===TransactionStatus.COMPLETED){
            return res.status(400).json({message:"transaction already completed"});
        }
        if(transaction.status===TransactionStatus.FAILED){
            return res.status(400).json({message:"transaction failed"});
        }
        try{
            const chain = await lastChain();
            if((chain && chain.hash !== req.body.previous_hash) && (req.body.previous_hash !==null && chain!==null)){
                return res.status(400).json({message:"transaction previous hash failed"}); 
            }
            await transaction.setVerifying();
            if( transaction.amount!==_transaction.amount||
                transaction.sender!==_transaction.sender||
                transaction.recipient!==_transaction.recipient){
                await transaction.setPending();
                return res.status(400).json({message:"transaction verify failed"});
            }
            Logger.info(`transaction nonce ${req.body.nonce}=>${transaction.nonce}`);
            if(!await transaction.verifyNonce(req.body.nonce+req.body.previous_hash,chain===null? null: chain.hash)){
                return res.status(400).json({message:"transaction not verified"});
            }
            if(transaction.sender!=="SYSTEM"){
                await miningReward(wallet, transaction);  
            }
            return res.json({
                message:"Transaction completed"
            });
        }catch(e){
            await transaction.setFailed();
            Logger.info("transaction error",e);
            return res.status(400).json({message:"transaction failed"});
        }
       
    }
    static async getPendingTransactions(req:Request,res:Response):Promise<unknown>{
        if(await verifyingTransaction()!==null){
            return res.status(400).json({message:"transaction verifying"});
        }
        const transactions = await Transaction.find({status:TransactionStatus.PENDING}); 
        if(transactions.length===0 ){
            return res.status(404).json({message:"no pending transaction"});
        }
        const chain = await lastChain();
        return res.json(transactions.map((transaction)=>({id:transaction._id,sender:transaction.sender,recipient:transaction.recipient,amount:transaction.amount,hash:transaction.genNonce(chain===null? null: chain.hash)})));
    }
    static async getPendingTransaction(req:Request,res:Response):Promise<unknown>{
        if(await verifyingTransaction()!==null){
            return res.status(400).json({message:"transaction verifying"});
        }
        const transaction = await Transaction.findOne({status:TransactionStatus.PENDING}); 
        if(transaction===null){
            return res.status(404).json({message:"no pending transaction"});
        }
        const chain = await lastChain();
        return res.json({id:transaction._id,sender:transaction.sender,recipient:transaction.recipient,amount:transaction.amount,hash:transaction.genNonce(chain===null? null: chain.hash)});
    }
}