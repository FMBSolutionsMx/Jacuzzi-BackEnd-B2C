import ProcedureModel from "./ProcedureModel";
export default class PointsHistoryModel extends ProcedureModel {
    DocEntry: number = 0;
    DocType: number = 0;
    DocNum: number = 0;
    DocDate: string = '';
    CardCode : string = '';
    Total: number = 0;
    Type : string = '';
    UsedPoints : string = '';
}