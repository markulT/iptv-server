import {Injectable} from "@nestjs/common";
import {Admin} from "../admin/admin.schema";
import {Ability, AbilityBuilder, AbilityClass, ExtractSubjectType, InferSubjects} from "@casl/ability";
import {User} from "../users/user.schema";
import {Channel} from "../channelManagement/channelManagement.schema";

export enum Action {
    Manage = 'manage',
    Create = 'create',
    Read = 'read',
    Update = 'update',
    Delete = 'delete'
}

export type Subjects = InferSubjects<typeof Admin | typeof User | typeof Channel | 'all'>

export type AppAbility = Ability<[Action, Subjects]>

@Injectable()
export class CaslAbilityFactory {
    defineAbility(admin:Admin) {
        const {can, cannot,build} = new AbilityBuilder(Ability as AbilityClass<AppAbility>)
        if(admin.role === 'Admin') {
            can(Action.Manage, 'all')
        } else if(admin.role === "Dealer") {
            can([Action.Read,Action.Create, Action.Delete, Action.Update], User)
        } else if (admin.role === "SysAdmin") {
            can([Action.Manage, Action.Update, Action.Create, Action.Read, Action.Delete], Channel)
        }
        return build({
            detectSubjectType:(item) => item.constructor as ExtractSubjectType<Subjects>
        })

    }
}
