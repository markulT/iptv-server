import { User } from './../users/user.schema';
import { Prop, Schema, SchemaFactory, MongooseModule } from '@nestjs/mongoose';
import mongoose, { Document, Mongoose } from 'mongoose';

export type TokenDocument = Token & Document;

@Schema()
export class Token {
    @Prop({
        ref: 'User', type: mongoose.Schema.Types.ObjectId
    })
    user: User;

    @Prop({ required: true, default:[]})
    refreshToken: string[];
}

export const TokenSchema = SchemaFactory.createForClass(Token);