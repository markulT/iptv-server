import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema()
export class User {
    @Prop({ required: true })
    password: string;

    @Prop({ required: true })
    fullName: string

    @Prop({default:""})
    orderId:string

    @Prop({default:0})
    tvSubLevel:number

    @Prop({default:''})
    acqId:string

    @Prop()
    freeTrialUsed:boolean

    @Prop()
    activationLink: string

    @Prop({default:false})
    isActivated: boolean

    @Prop()
    email:string

    @Prop()
    phone:string

    @Prop()
    address:string

    @Prop({default:''})
    dealer:string

    @Prop({default:''})
    mobileSubOrderId:string

    @Prop({default:true})
    mobileSubExists:boolean

    @Prop({default:0})
    mobileSubLevel:number

    @Prop({default:0})
    subLevel:number

    @Prop({default:null})
    ministraDate:Date;

    @Prop({default:null})
    trialExpirationDate:Date;

    @Prop({default:null})
    mobileDate:Date

    @Prop({default:null})
    signDate:Date

    @Prop()
    tvAuthCode:string

    @Prop()
    favouriteList:string[]

}

export const UserSchema = SchemaFactory.createForClass(User);