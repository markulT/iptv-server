import {Injectable} from "@nestjs/common";
import {InjectModel} from "@nestjs/mongoose";
import {Channel, ChannelDocument} from "./channelManagement.schema";
import {Model} from "mongoose";
import {ChannelPropEnum} from "../dtos/channel.dto";



@Injectable()
export class ChannelManagementService {
    constructor(
        @InjectModel(Channel.name) private readonly channelModel:Model<ChannelDocument>
    ) {
    }
    async getAll():Promise<Array<Channel>> {
        const channels = await this.channelModel.find()
        return channels
    }
    async create(name:string, title:string,description:string, imgData, imgName:string):Promise<Channel> {
        const channel = await this.channelModel.create({name:name,title:title,description:description, imgData:imgData,imgName:imgName})
        return channel
    }
    async delete(id):Promise<Channel> {
        const deledetChannel = await this.channelModel.findByIdAndDelete(id)
        return deledetChannel
    }
    async findChannel(name:string):Promise<Channel> {
        const channel = await this.channelModel.findOne({name:name})
        return channel
    }
    async update(id, field: keyof Channel,value):Promise<string> {
        const channel = await this.channelModel.findById(id)
        channel[field] = value
        await channel.save()
        return "Success"
    }

    async getPage(id,pageSize:number):Promise<Array<Channel>> {
        if (id==1) {
            return await this.channelModel.find().limit(pageSize)
        }
        const page = await this.channelModel.find().skip((id-1) * pageSize).limit(pageSize)
        return page
    }

    async findChannelById(id):Promise<Channel> {
        console.log(id)
        const channel = await this.channelModel.findById(id)
        return channel
    }
    async editImage(id,imgData, imgName) {
        const channel = await this.channelModel.findById(id)
        channel.imgData = imgData
        channel.imgName = imgName
        await channel.save()
    }
    async getLength() {
        const length = await this.channelModel.count()
        return length
    }

}