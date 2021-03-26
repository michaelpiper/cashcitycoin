import { Prop, getModelForClass, ReturnModelType, DocumentType } from "@typegoose/typegoose";
import { MongooseAdapter } from "../libs/connections";
import { TimeStamps } from "@typegoose/typegoose/lib/defaultClasses";
import { MiningStatus } from "../libs/enum";
import { ObjectId } from "mongodb";

export class MiningSchema extends TimeStamps {
	@Prop({required: true})
	nonce!: string;
    @Prop({required: true})
	requestId!: string;
    @Prop({ required: true })
    amount!: number;
    @Prop({ required: true })
    miner!: string;
    @Prop({ required: true })
	cooperator!: string;
    @Prop({ required: true })
	consumer!: string;
    @Prop({ required: false, default:null })
    narration:string|null=null;
    @Prop({ required: false })
    payId?: string;
    @Prop({ required: false, default:MiningStatus.PENDING, enum: MiningStatus })
    status?:MiningStatus = MiningStatus.PENDING;
    async setStatus(status: MiningStatus):Promise<void>{
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const model = this as any as  MiningDocType;
        model.status = status;
        await model.save();
    }
    async setPending():Promise<void>{
        await this.setStatus(MiningStatus.PENDING);
    }
    async setFailed():Promise<void>{
        await this.setStatus(MiningStatus.FAILED);
    }
    async setCompleted():Promise<void>{
        await this.setStatus(MiningStatus.COMPLETED);
    }
    static getNonce():string{
        let string ="";
        for (let i =0;i<6;i++){
            string+= Math.floor(Math.random()*9);
        }
        return string;
    }
}

export const Mining = getModelForClass(MiningSchema, {
	existingConnection: MongooseAdapter.connection,
	schemaOptions: {
		collection: "mining",
	}
});
export const lastMining = async():Promise<DocumentType<MiningSchema> | null>=>{
   return  await Mining.findOne().sort({'updatedAt': -1});
}
export const getMining = async(id:ObjectId):Promise<DocumentType<MiningSchema> | null>=>{
    return  await Mining.findById(id);
}
export const countMinings = async():Promise<number>=>{
    return  await Mining.count({});
}
export const allMining = async(page=1,limit=50):Promise<DocumentType<MiningSchema>[]>=>{
    return  await Mining.find().sort({'updatedAt': -1}).limit(limit).skip((page-1)*limit);
}

export type MiningModelType = ReturnModelType<typeof MiningSchema>;
export type MiningDocType = DocumentType<MiningSchema>;
