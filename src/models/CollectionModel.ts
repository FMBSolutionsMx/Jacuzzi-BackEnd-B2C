import ProcedureModel from "./ProcedureModel";

export default class CollectionModel extends ProcedureModel {
    docEntry: string = "";
    table: string = '';
    cardCode: string = '';
    initialDate: string = '';
    finalDate: string = '';
}