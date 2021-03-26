import { Request, Response } from "express";
import { isValidObjectId } from "mongoose";
import { ObjectId } from "mongodb";
import { allChain, ChainDocType, countChains, getChain } from "../../models/chain";
import { getPageFromReq, getLimitFromReq } from "../utils";

export default class LedgerController{
    static async getLedger(req:Request,res:Response):Promise<unknown>{
        const chainId = req.params.id;
        if(!isValidObjectId(chainId)){
            return res.status(400).json({message:"invalid leger id"});
        }
        const chain = await getChain(new ObjectId(chainId));
        if(chain==null){
            return res.status(404).json({
                message:"ledger not found"
            });
        }
        return res.json(LedgerController.purifyLedger(chain));
    }
    protected static purifyLedger(chain:ChainDocType):Record<string,unknown>{
        return {
            id:chain._id,
            block:chain.block,
            previous_hash:chain.previousHash,
            created_at:chain.createdAt,
            updated_at:chain.updatedAt,
        }
    }
    protected static purifyLedgers(chains:ChainDocType[]):Record<string,unknown>[]{
        return chains.map(LedgerController.purifyLedger);
    }
    static async getLedgers(req:Request,res:Response):Promise<unknown>{
        const page = getPageFromReq(req);
        const limit = getLimitFromReq(req);
        const chain = LedgerController.purifyLedgers(await allChain(page,limit));
        const count = await countChains();
        res.header("x-pagination-totalpage",String(Math.round(count/limit)))
        res.header("x-pagination-currentpage",String(page))
        res.header("x-pagination-totalitems",String(count))
        return res.json(chain);
    }
   
}