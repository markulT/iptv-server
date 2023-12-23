import {Injectable} from "@nestjs/common";
import {Cron} from "@nestjs/schedule";
import {UserService} from "./user.service";

@Injectable()
export class PasswordRenewalCleanerTaskService {
    constructor(
        private userService:UserService
    ) {
    }

    @Cron('0 * * * *')
    async clearPasswordRenewalCode() {
        await this.userService.deleteExpiredItems()
    }

}