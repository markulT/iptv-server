export default class ApiError extends Error {
    status;
    errors;
    constructor(status, message, errors = []) {
        super()
        this.status = status
        this.message = message
        this.errors = errors
    }

    static UnauthorizedError() {
        return new ApiError(401, 'User unauthorized')
    }

    static BadRequest(message, errors = []) {
        return new ApiError(400, message, errors)
    }

}