export class UserDto {
    id;
    fullName;
    isActivated;
    phone;
    address;
    mobileSubOrderId;
    mobileSubLevel;
    orderId;
    email
    constructor(model) {
        this.email = model.email
        this.id = model._id
        this.fullName = model.fullName
        this.isActivated = model.isActivated
        this.phone = model.phone
        this.address = model.address
        this.mobileSubOrderId = model.mobileSubOrderId
        this.mobileSubLevel = model.mobileSubLevel
        this.orderId = model.orderId
    }
}