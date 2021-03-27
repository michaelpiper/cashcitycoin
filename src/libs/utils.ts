import { Request } from "express";
import { Transaction, TransactionDocType } from "../models/transaction";
import { AccountDocType } from "../models/account";
import { MiningDocType } from "../models/mining";
import * as crypto from "crypto";
export const sha256 = (value:string): string => crypto.createHash("sha256").update(value).digest("hex");
export const md5 = (value:string): string => crypto.createHash("md5").update(value).digest("hex");
export const cooporatorReward=async (mining: MiningDocType):Promise<Record<string,TransactionDocType>>=>{
    let cbonus, sbonus, transaction;
    const cooperatorBonusAmount = cooperatorBonus(mining.amount);
    const sourceBonusAmount = sourceBonus(mining.amount);
    const amount = mining.amount;
    const querys = {
        cbonus:{
            sender: "SYSTEM",
            recipient: mining.cooperator,
            amount: cooperatorBonusAmount,
            narration:`SYSTEM|M-${mining.id}|C-${cooperatorBonusAmount}`
        },
        sbonus:{
            sender: "SYSTEM",
            recipient: mining.miner,
            amount: sourceBonusAmount,
            narration:`SYSTEM|M-${mining.id}|M-${sourceBonusAmount}`
        },
        transaction:{
            sender: "SYSTEM",
            recipient: mining.consumer,
            amount: amount,
            narration:`SYSTEM|M-${mining.id}|T-${amount}`
        },
    }
    cbonus = await Transaction.findOne(querys.cbonus);
    sbonus = await Transaction.findOne(querys.sbonus);
    transaction = await Transaction.findOne(querys.transaction);
    if(cbonus===null){
        cbonus = await Transaction.create(querys.cbonus);
    }
    if(sbonus===null){
        sbonus = await Transaction.create(querys.sbonus);
    }
    if(transaction===null){
        transaction = await Transaction.create(querys.transaction);
    }
    return {cooperatorBonus:cbonus,minerBonus:sbonus,transaction};
}
export const miningReward=async (miner:AccountDocType,transaction:TransactionDocType):Promise<TransactionDocType>=>{
    const bAmount = transactionMiningBonus(transaction.amount);
    const bonus = await Transaction.create({
        sender: transaction.sender,
        recipient: miner.walletId,
        amount: bAmount,
        narration:`SYSTEM-MINING-COST|T-${transaction.id}|M-${bAmount}`
    });
    await bonus.setCompleted();
    return bonus;
}
export const transactionMiningBonus = (amount:number):number=>{
    if(amount>4000000){
        return (amount/100)*0.5;
    }
    if(amount>4000000){
        return 40.5;
    }
    if(amount>3000000){
        return 30.5;
    }
    if(amount>2000000){
        return 20.5;
    }
    if(amount>200000){
        return 2.5;
    }
    if(amount>20000){
        return 1.5;
    }
    if(amount>2000){
        return 1.2;
    }
    return (amount/100)*1;
}
export const cooperatorBonus = (amount:number):number=>{
    const bAmount=(amount/100)*1;
   
    return bAmount;
}
export const sourceBonus = (amount:number):number=>{
    const bAmount=(amount/100)*4;
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

export const  makeRangeIterator=(start = 0, end = Infinity, step = 1):{
    next: ()=>{value:number, done: boolean}
}=> {
    let nextIndex = start;
    let iterationCount = 0;

    const rangeIterator = {
       next: function() {
           let result;
           if (nextIndex < end) {
               result = { value: nextIndex, done: false }
               nextIndex += step;
               iterationCount++;
               return result;
           }
           return { value: iterationCount, done: true }
       }
    };
    return rangeIterator;
}