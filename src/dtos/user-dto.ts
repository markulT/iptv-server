export class UserDto {
    login;
    id;
    fullName;
    isActivated;
    phone;
    address;
    constructor(model) {
        this.login = model.login
        this.id = model._id
        this.fullName = model.fullName
        this.isActivated = model.isActivated
        this.phone = model.phone
        this.address = model.address
    }
}