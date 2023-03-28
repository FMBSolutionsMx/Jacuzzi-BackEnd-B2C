import ProcedureModel from "./ProcedureModel";

export default class QuotationModel extends ProcedureModel {
    docEntry: string = "";
    table: string = '';
    cardCode: string = '';
    initialDate: string = '';
    finalDate: string = '';
}