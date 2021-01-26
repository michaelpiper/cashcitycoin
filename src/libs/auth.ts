import { IAsyncAuthorizerOptions } from "express-basic-auth";

type cbFunction = (err:string|null,result?:boolean)=>unknown;
import {  Account } from "../models/account";
export const authorizer=async (username:string,password:string,cb:cbFunction):Promise<unknown>=>{
    const wallet = await Account.findOne({walletId:username});
    if(wallet===null){
        return cb(null);
    }
    if(!wallet.verifyPass(password)){
        return cb(null);
    }
    return cb(null,true);
}
export const basicAuthObject:IAsyncAuthorizerOptions = { authorizer, authorizeAsync:true};