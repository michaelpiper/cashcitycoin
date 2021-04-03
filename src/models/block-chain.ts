import { Prop } from "@typegoose/typegoose";
export class BlockChain{
    constructor(sender:string, recipient:string, amount:number){
        this.sender = sender;
        this.recipient = recipient;
        this.amount =  amount;
    }
    @Prop({ required: true})
    sender!:string;
    @Prop({ required: true})
    recipient!:string;
    @Prop({ required: true})
    amount!:number;
}