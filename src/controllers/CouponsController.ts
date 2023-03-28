import { Request, Response } from "express";
import CouponsModel from "../models/CouponsModel";
import CouponsProcedure from "../procedures/CouponsProcedure";
import ResponseModel from "../models/ResponseModel";
import { logger } from "../util/logger";
import moment from "moment";

export async function infoCoupons(request: Request, response: Response): Promise<void> {
    const { coupon } = request.params;
    const responseModel = new ResponseModel();
    // let localstorage = request.body.localShoppingCart;
    try {
        let model: CouponsModel = new CouponsModel();
        model.action = "findCoupon";
        model.coupon = coupon;
        
        let couponInfo = await CouponsProcedure(model);
        
        if ( !couponInfo || !couponInfo[0] ){
            responseModel.data = [];
            responseModel.message = "No se encontro algún cupón válido"
        }else{
            responseModel.data = couponInfo[0];
            responseModel.message = "Cupón encontrado"
            responseModel.status = 1;
        }
        
        response.json(responseModel);
    } catch (e) {
        logger.error(e);
        responseModel.message = "No se encontro información del cupón";
        response.json(responseModel);
    }
}