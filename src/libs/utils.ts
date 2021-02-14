import { Request } from "express";
import { Transaction, TransactionDocType } from "../models/transaction";
import { AccountDocType } from "../models/account";
export const miningReward=async (wallet:AccountDocType,transaction:TransactionDocType):Promise<TransactionDocType>=>{
    const bAmount=transactionMiningBonus(transaction.amount);
    const bonus = await Transaction.create({
        sender:"SYSTEM",
        recipient: wallet.walletId,
        amount: bAmount,
        narration:`SYSTEM|${transaction.id}|${bAmount}`
    });
    await bonus.setCompleted();
    return bonus;
}
export const transactionMiningBonus = (amount:number):number=>{
    const bAmount=(amount/100)*0.5;
    if(bAmount>1)
    return 1;
    return bAmount;
}
export const getPageFromReq=(req:Request):number=>{
    let page;
    try{
        page= Number(req.headers['x-pagination-page']);
    }catch(e){
        page=1;
    }
    if(!page){
        page = 1;
    }
    return page;
}
export const getLimitFromReq=(req:Request):number=>{
    let limit;
       
    try{
        limit =  Number(req.headers['x-pagination-limit']);
    }catch(e){
        limit=50;
    }   
    if(!limit){
        limit =50;;
    }
    return limit;
}