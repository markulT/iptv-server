import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import {Binary} from "mongodb";

export type ChannelDocument = Channel & Document;

@Schema()
export class Channel {
    @Prop({required:true})
    name:string

    @Prop({required:true})
    title:string

    @Prop({required:true})
    description:string

    @Prop()
    imgData:Buffer

    @Prop()
    imgName:string

    @Prop({default:""})
    genre:string
    // @Prop()
    // image:{data:Buffer, name:string}
}

export const ChannelSchema = SchemaFactory.createForClass(Channel);