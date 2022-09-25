import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AdminDocument = Admin & Document;

@Schema()
export class Admin {
    @Prop({required:true})
    login:string

    @Prop({required:true})
    password:string

    @Prop({enum:['Admin', 'Dealer', 'Operator']})
    role:string

    @Prop({default:''})
    fullName:string
}

export const AdminSchema = SchemaFactory.createForClass(Admin);