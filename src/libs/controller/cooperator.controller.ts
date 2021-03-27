import { Request, Response } from "express";
import { Mining } from "../../models/mining";
import * as yup from "yup";
import { AccountDocType, findAccountByWalletId } from "../../models/account";
import { MiningStatus } from "../../libs/enum";
import { cooporatorReward, md5 } from "../../libs/utils";
export default class CooperatorController{
    // eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/explicit-module-boundary-types
    static getNonceValidator = (body:Record<string, any>)=>{
        return yup.object().shape({
            requestId: yup.string().required(),
            miner: yup.string().required(),
            consumer: yup.string().required(),
            amount: yup.number().required(),
            narration:yup.string().default(null).nullable(true)
        }).validateSync(body);
    }
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types,@typescript-eslint/no-explicit-any
    static getMiningValidator=(body:Record<string, any>)=>{
        return yup.object().shape({
            requestId: yup.string().required(),
            payId: yup.string().required(),
            nonce: yup.string().required()
        }).validateSync(body);
    }
    static async initialize(req:Request, res:Response):Promise<unknown>{
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const credentials: AccountDocType  = (req as any).credentials || {};
        let data;
        try{
            data = await CooperatorController.getNonceValidator(req.body);
        }catch(e){
            return res.status(422).json({message:e.message});
        }
        if(await Mining.findOne({requestId: data.requestId})){
            return res.status(400).json({message:"Minner request has already been proceess duplicate request notice"});
        }
        if(!await findAccountByWalletId(data.miner)){
            return res.status(400).json({message:"Minner Wallet doens't exist"});
        };
        if(!await findAccountByWalletId(data.consumer)){
            return res.status(400).json({message:"Consumer Wallet doens't exist"});
        };

        const nonce = Mining.getNonce();
        const mining = await Mining.create({
            requestId: data.requestId,
            nonce: credentials.generateHash(nonce) as string,
            cooperator: credentials.id,
            amount: data.amount,
            consumer: data.consumer,
            miner: data.miner,
            narration: data.narration
        });
        return res.status(201).json({
            reference: mining.id,
            requestId: data.requestId,
            nonce,
        });
    }
    static async mining(req:Request,res:Response):Promise<unknown>{
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        // const credentials: AccountDocType  = (req as any).credentials || {};
        let data;
        try{
            data = await CooperatorController.getMiningValidator(req.body);
        }catch(e){
            return res.status(422).json({message:e.message});
        }
        const mining = await Mining.findOne({requestId: data.requestId});
        if(!mining){
            return res.status(404).json({message:"Minner request not found"});
        }
        if(mining.status===MiningStatus.COMPLETED){
            await cooporatorReward(mining);
            return res.status(400).json({message:"Minner request already completed"});
        }
        if(mining.status===MiningStatus.FAILED){
            return res.status(400).json({message:"Minner request failed contact support"});
        }
        if(mining.nonce !== md5(data.nonce)){
            await mining.setFailed();
            return res.status(400).json({message:"Nonce key invalid"});
        }
        mining.payId = data.payId;
        await mining.setCompleted();
        await cooporatorReward(mining);
        return res.json({
            message: "Mining request completed",
        });


    }
}