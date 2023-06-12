import {Prop, Schema, SchemaFactory} from "@nestjs/mongoose";

export type SessionAuthDocument = SessionAuth & Document

@Schema()
export class SessionAuth {
    @Prop()
    sessionId:string

    @Prop()
    authCode:string
}
export const SessionAuthSchema = SchemaFactory.createForClass(SessionAuth)