export class AdminDto {
    email;
    role;
    id;
    fullName;
    constructor(model) {
        this.email = model.email
        this.id = model._id
        this.role = model.role
        this.fullName = model.fullName
    }
}