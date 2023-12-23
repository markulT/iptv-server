import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PasswordRenewalDocument = PasswordRenewal & Document;

@Schema()
export class PasswordRenewal {
    @Prop()
    userId:string

    @Prop()
    email:string

    @Prop()
    renewalCode:string

    @Prop()
    expireDate:Date
}

export const PasswordRenewalSchema = SchemaFactory.createForClass(PasswordRenewal);