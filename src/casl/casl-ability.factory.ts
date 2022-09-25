import {Injectable} from "@nestjs/common";
import {Admin} from "../admin/admin.schema";
import {Ability, AbilityBuilder, AbilityClass, ExtractSubjectType, InferSubjects} from "@casl/ability";
import {User} from "../users/user.schema";

export enum Action {
    Manage = 'manage',
    Create = 'create',
    Read = 'read',
    Update = 'update',
    Delete = 'delete'
}

export type Subjects = InferSubjects<typeof Admin | typeof User | 'all'>

export type AppAbility = Ability<[Action, Subjects]>

@Injectable()
export class CaslAbilityFactory {
    defineAbility(admin:Admin) {
        const {can, cannot,build} = new AbilityBuilder(Ability as AbilityClass<AppAbility>)
        if(admin.role === 'Admin') {
            can(Action.Manage, 'all')
        } else if(admin.role === "Dealer") {
            can([Action.Read,Action.Create, Action.Update], User)
        }
        return build({
            detectSubjectType:(item) => item.constructor as ExtractSubjectType<Subjects>
        })

    }
}
