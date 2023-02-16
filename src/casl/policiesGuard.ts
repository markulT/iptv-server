import {CanActivate, ExecutionContext, Injectable} from "@nestjs/common";
import {Observable} from "rxjs";

@Injectable()
export class PoliciesGuard implements CanActivate {
    public async canActivate(context: ExecutionContext): Promise<boolean> {

        return undefined;
    }

}