
export default class ResponseModel {
    status: number;
    message: string;
    data: object;
    from:number;
    type: number;

    constructor() {
        this.status = 0;
        this.message = '';
        this.data = {};
        this.from = 0;
        this.type = 0;
    }
}