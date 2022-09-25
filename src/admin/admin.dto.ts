export class AdminDto {
    login;
    role;
    id;
    fullName;
    constructor(model) {
        this.login = model.login
        this.id = model._id
        this.role = model.role
        this.fullName = model.fullName
    }
}