import { DocumentType } from "@typegoose/typegoose";
import { IAsyncAuthorizerOptions } from "express-basic-auth";
type cbFunction = (err:Error|null,result?:boolean)=>unknown;
import {  Account, AccountSchema, findAccountByApiKey } from "../models/account";
import { sha256 } from "./utils";
export const authorizer=async (username:string,password:string,cb:cbFunction):Promise<unknown>=>{
    const wallet = await Account.findOne({username});
    if(wallet===null){
        return cb(null);
    }
    if(!wallet.verifyPass(password)){
        return cb(null);
    }
    return cb(null,true);
}
export const basicAuthObject:IAsyncAuthorizerOptions = { authorizer, authorizeAsync:true};

export const getApiKeySecret=async (keyId:string, done:(e:Error|null,s?:string,r?:DocumentType<AccountSchema>)=>void):Promise<void>=> {
    const account = await findAccountByApiKey(sha256(keyId));
    if (!account) {
      return done(new Error('Unknown api key'));
    }
   
    done(null, account.apiSecret, account);
}