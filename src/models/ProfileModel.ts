import ProcedureModel from "./ProcedureModel";

export default class ProfileModel extends ProcedureModel {
    cardCode: string = '';
    id: number = 0;
    favorites: string = JSON.stringify([]);
    shoppingCart: string = JSON.stringify([]);
    backOrder: string = JSON.stringify([]);
    localStorageFront: string =  JSON.stringify([]);
}