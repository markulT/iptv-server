import { IsEmail, Length } from "class-validator"

export class createUserDto {
    @IsEmail()
    email: string

    @Length(8, 32)
    password: string

    fullName: string

    address:string

    phone:string
}