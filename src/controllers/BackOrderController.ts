import { Request, Response } from "express";
import ResponseModel from "../models/ResponseModel";
import { IRecordSet } from "mssql";
 /*
async function getBackorder(business : string, cardCode : string) : Promise<Array<any>> {
    // Actual returning result
    let result : Array<any> = [];

    // Generate sending model
    const model = new ShoppingCartModel();

    model.action = "get-backorder";
    model.business = business;
    model.arg1 = cardCode;

    // Execute procedure
    try {
        result = await ShoppingCartProcedure(model);
        result = JSON.parse(result[0].BackOrder);
    } catch (e) {
        //console.log(e);
    }

    return result;
}

export async function getBackorderProducts(request: Request, response: Response) {
    
}

export async function addToBackorder(request : Request, response : Response) {
    const { db_name } = response.locals.business;
    const { CardCode } = response.locals.user;
    const { itemCode } = request.body;
    const output: ResponseModel = new ResponseModel();

    // Get backorder array
    const backorder = await getBackorder(db_name, CardCode);

    // Make sure doesn't exists already & insert it
    if (!backorder.includes(itemCode)) {
        backorder.push(itemCode);

         // Generate sending model
        const model = new ShoppingCartModel();

        model.action = "update-backorder";
        model.business = db_name;
        model.arg1 = CardCode;
        model.arg2 = JSON.stringify(backorder);

        // Actually execute procedure
        try {
            await ShoppingCartProcedure(model);
            output.status = 1;
            output.message = "OK";
        } catch (e) {
            //console.log(e);
            output.status = 2;
            output.message = "Execution error";
        }
    } else {
        output.status = 3;
        output.message = "Product already exists at backorder";
    }

    response.json(output);
}

export async function removeFromBackorder(request : Request, response : Response) {

}*/