import ProcedureModel from "./ProcedureModel";

export default class ProductsModel extends ProcedureModel {
    cardCode:string = '';
    key: string = '';
    wareHouse:string = '';
    itemCode: string = '';
    // itemCode: any = ''
    nextNumber:any = '';
    quantity : number = 0;
    actionFilter : string = '';
    valueFilter : string = '';
    value2Filter : string = '';
    view: any = '';
    topItems: string = '';
}