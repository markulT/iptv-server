import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import {RoleEnum} from "./role.enum";

export type AdminDocument = Admin & Document;

@Schema()
export class Admin {
    @Prop({required:true})
    email:string

    @Prop({required:true})
    password:string

    @Prop({enum:RoleEnum})
    role:string

    @Prop({default:''})
    fullName:string
}

export const AdminSchema = SchemaFactory.createForClass(Admin);