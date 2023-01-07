import * as buffer from "buffer";

export class ChannelDto {
    name:string;
    title:string;
    description:string;
    image:Buffer;

    constructor(model) {
        this.name = model.name;
        this.title = model.title;
        this.description = model.description;
        this.image = model.image;
    }
}
export type ChannelType = {
    name:string;
    title:string;
    description:string;
    image:Buffer;
}
export enum ChannelPropEnum {
    name,
    title,
    description,
    image,
}