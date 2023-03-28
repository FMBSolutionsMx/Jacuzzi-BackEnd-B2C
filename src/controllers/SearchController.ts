import {Request, Response} from "express";
import ResponseModel from "../models/ResponseModel";
import {logger} from "../util/logger";
import SearchModel  from "../models/SearchModel";
import SearchProcedue from "../procedures/SearchProcedure";
import {getProfile} from "./ProfileController";
import {getTaxes, getSpecialPrices, getValidationSpecialPrices} from "./CatalogsController";
import ProductsProcedure from "../procedures/ProductsProcedure";
import ProductsModel from "../models/ProductsModel";
import moment from 'moment';
import DiscountSpecial from "../procedures/DiscountSpecial";

let action;

export async function getMarca(request: Request, response: Response) {
    let responseModel = new ResponseModel();
    let model = new SearchModel();
    try {
        model.action = 'getMarcas';
        let result: any = await SearchProcedue(model);
        ////console.log(result);
        
        responseModel.status = 1;
        responseModel.data = result;
    } catch (e) {
        logger.error(e);
        responseModel.message = 'Ocurrio un error al solicitar las marcas de los productos';
        responseModel.data = [];
    }
    response.json(responseModel);
    return;
}
export async function  getFiltros(request: Request, response: Response) {
    let responseModel = new ResponseModel();
    let model = new SearchModel();
    try {
        model.action = 'getFiltros';
        let filtros: any = await SearchProcedue(model);        
        responseModel.status = 1;
        responseModel.data = {marcas: filtros[0], aparatos: filtros[1], refacciones: filtros[2],fabricantes: filtros[3],materiales: filtros[4]};
    } catch (e) {
        logger.error(e);
        responseModel.message = 'Ocurrio un error al solicitar los filtros de los prudctos';
        responseModel.data = [];
    }
    response.json(responseModel);
    return;
}

export async function getAparato(request: Request, response: Response) {
    let responseModel = new ResponseModel();
    let model = new SearchModel();
    try {
        model.action = 'getAparato';
        let result: any = await SearchProcedue(model);
        ////console.log(result);
        
        responseModel.status = 1;
        responseModel.data = result;
    } catch (e) {
        logger.error(e);
        responseModel.message = 'Ocurrio un error al solicitar los aparatos';
        responseModel.data = [];
    }
    response.json(responseModel);
    return;
}


export async function getRefaccion(request: Request, response: Response) {
    let responseModel = new ResponseModel();
    let model = new SearchModel();
    try {
        model.action = 'getRefaccion';
        let result: any = await SearchProcedue(model);
        ////console.log( result);
        
        responseModel.status = 1;
        responseModel.data = result;
    } catch (e) {
        logger.error(e);
        responseModel.message = 'Ocurrio un error al solicitar las refacciones de los prudctos';
        responseModel.data = [];
    }
    response.json(responseModel);
    return;
}

export async function  getFabricante(request: Request, response: Response) {
    let responseModel = new ResponseModel();
    let model = new SearchModel();
    try {
        model.action = 'getFabricante';
        let result: any = await SearchProcedue(model);
        ////console.log(result);
        
        responseModel.status = 1;
        responseModel.data = result;
    } catch (e) {
        logger.error(e);
        responseModel.message = 'Ocurrio un error al solicitar los fabricanets de los prudctos';
        responseModel.data = [];
    }
    response.json(responseModel);
    return;
}

export async function getMaterial(request: Request, response: Response) {
    let responseModel = new ResponseModel();
    let model = new SearchModel();
    try {
        model.action = 'getMaterial';
        let result: any = await SearchProcedue(model);
        ////console.log(result);
        
        responseModel.status = 1;
        responseModel.data = result;
    } catch (e) {
        logger.error(e);
        responseModel.message = 'Ocurrio un error al solicitar los fabricanets de los prudctos';
        responseModel.data = [];
    }
    response.json(responseModel);
    return;
}

export async function getProductoAdvance(request: Request, response: Response) {
    const { contenido } = request.body;
    let responseModel = new ResponseModel();
    let model = new SearchModel();
    //Son varibales necesaria para la configuran de los valores del los productos
    let {db_name, currency, localLanguage, priceList} = response.locals.business;
    //const {wareHouse} = response.locals.business;
    let {itemCode} = request.params;
    let alias = decodeURIComponent(itemCode);
    let {CardCode, ListNum, wareHouse} = response.locals.user;
    let {shoppingCartPublic}:any = request.query;
    let {Price} =request.query;
    try {
        model.action = 'searchByItemCode';
        model.marca = contenido.marca;
        model.aparato = contenido.aparato;
        model.refaccion=contenido.refaccion;
        model.fabricante=contenido.fabricante;
        model.nombre=contenido.nombre;
        model.material = contenido.material;
        // console.log("Modelo de busqueda", model);
        let result: any = await SearchProcedue(model);
        result = result.recordset || [];
        ////console.log(result);
        let model1: ProductsModel = new ProductsModel();
        // Variables que recibe el store procedure
        model1.action = 'findOne';
        model1.business = db_name;
        model1.cardCode = CardCode;
        model1.wareHouse = wareHouse;
        //Variablas para almacenar los productos con su información 
        let responseBody = [];
        //Resto de las variables para el producto
        let favorites: any = [];
        let shoppingCart: any = [];
        let backOrder: any = [];
 
        if (!shoppingCartPublic) {
            const profile: any = await getProfile(request, response, true);
            favorites = profile.data.favorites ? profile.data.favorites : [];
            shoppingCart = profile.data.shoppingCart ? profile.data.shoppingCart : [];
            backOrder = profile.data.backOrder ? profile.data.backOrder : [];
        } else {
            favorites = [];
            shoppingCart = shoppingCartPublic ? JSON.parse(shoppingCartPublic) : [];
            backOrder = [];
        }

        const resultTaxes: any = await getTaxes(request, response, true);
        if (!resultTaxes.status) {
            responseModel.message = "ocurrio un error al traer los productos";
            response.json(responseModel);
            return;
        }
 
        let tax = resultTaxes.data.Rate;

        // Special Pricess Full Query
        // Socio de negocios
        let responseSpecialPrices:any  = [];
        let responseSpecialPricesList : any = [];
        let ValidationSpecialPrices : any = false;
        // Lista de precios
        let PriceList = ListNum && ListNum !== '' ? ListNum : priceList;

        let validateActivationSpecialPrices: any = await getValidationSpecialPrices(request, response, true);
        
        if (validateActivationSpecialPrices.status === 1 && validateActivationSpecialPrices.data == 1) {
            ValidationSpecialPrices = true;
        } 

        //Busqueda de la informacion del producto
        for (let i = 0; i < result.length; i++) {
            model1.itemCode = result[i].ItemCode;
            ////console.log("Modelo de busqueda", model1);
            let responseProdcut = await ProductsProcedure(model1);
            ////console.log("respuesta por producto",responseProdcut[0]);
            if (responseProdcut[0]){
               
                let favorite = favorites.filter((favorite: any) => {
                    return (favorite.ItemCode == responseProdcut[0].ItemCode)
                });
    
                let cart = shoppingCart.filter((shopping: any) => {
                    return (shopping.ItemCode == responseProdcut[0].ItemCode)
                });
    
                let back = backOrder.filter((shopping: any) => {
                    return (shopping.ItemCode == responseProdcut[0].ItemCode)
                });
    
                if(responseProdcut[0].OnHandPrincipal <= 0){
                    responseProdcut[0].OnHandPrincipal = 0;
                    responseProdcut[0].flag = 'red';
                } else {
                    responseProdcut[0].flag = 'green';
                }

                // responseProdcut.map((item: any, index: Number) => {
                    
                    // Special Prices Validation
                    //########################################################################################################################
                    // if(index < 1){
                        let item = responseProdcut[0];
                        let priority2 = "*" + PriceList;
                        let formattedDocDate = moment().format('YYYY/MM/DD');

                        let flagSN = true; // Socio de negocio
                        let flagPriceList = true; // Lista de precios
                        let flagPricePriority = true;
                        let maxQuantity = 0; // Cantidad maxima a alegir
                        let priceItem = -1;
                        let discount = -1;
                        let priceBeforeDisc: any = -1;

                        item.QuantitySpecial = cart.length ? cart[0].quanity: 1;
                        
                        const DiscountSpecials = await DiscountSpecial(CardCode,item.ItemCode,1);
                        item.DiscountPercentSpecial = parseFloat(DiscountSpecials[0].DescuentoFinal || 0)
                        // DESCOMENTAR SI QUEREMOS QUE TODOS LOS ARTICULOS CON DESCUENTOS TENGAN LA ETIQUETA DE PROMOCIÓN 
                        // item.U_FMB_Handel_Promo = DiscountSpecials[0].DescuentoFinal !== 0 ? 1 : 0;
                        priceItem = parseFloat(DiscountSpecials[0].PrecioFinal);
                        discount = parseFloat(DiscountSpecials[0].DescuentoFinal || 0);
                        priceBeforeDisc = ((100 * priceItem) / (100 - discount)).toFixed(2);

                        // Precios por descuentos especiales
                        if(priceBeforeDisc != -1){
                            item.Price = Number(priceItem);
                            item.PriceBeforeDiscount = Number(priceBeforeDisc);
                        }
                    // }
                //#######################################################################################################################
                // }
                
                let priceTax = Number(((responseProdcut[0].Price * (tax / 100)) + responseProdcut[0].Price).toFixed(2));
                            
                responseBody.push({
                    ItemCode: responseProdcut[0].ItemCode || '',
                    ItemName: responseProdcut[0].ItemName  || '', 
                    PicturName: responseProdcut[0].PicturName || '' , 
                    FrgnName: responseProdcut[0].FrgnName || '', 
                    OnHand: responseProdcut[0].OnHand || '',
                    Price:responseProdcut[0].Price || '',
                    UserText:responseProdcut[0].UserText || '',
                    U_Handel_Tags:responseProdcut[0].U_Handel_Tags || '',
                    U_Handel_ImagesArray:responseProdcut[0].U_Handel_ImagesArray || '',
                    U_Handel_Slogan:responseProdcut[0].U_Handel_Slogan || '',
                    U_Handel_attachment:responseProdcut[0].U_Handel_attachment || '',
                    U_web:responseProdcut[0].U_web || '',
                    wishlist:responseProdcut[0].wishlist || '',
                    currency:currency || '',
                    localLanguage:localLanguage || '',
                    favorite:!!favorite.length || '',
                    backOrder:!!back.length || '',
                    quanity:cart.length?cart[0].quanity: '',
                    taxRate:tax || '',
                    priceTax: priceTax || '',
                    U_FMB_Handel_Promo:  responseProdcut[0].U_FMB_Handel_Promo,
                    OnHandPrincipal: responseProdcut[0].OnHandPrincipal,
                    WhsCode : responseProdcut[0].WhsCode,
                    flag : responseProdcut[0].flag,
                    DiscountPercentSpecial: responseProdcut[0].DiscountPercentSpecial,
                    PriceBeforeDiscount: responseProdcut[0].PriceBeforeDiscount,
                    PriceTaxBeforeDiscount: Number(((responseProdcut[0].PriceBeforeDiscount * (tax / 100)) + responseProdcut[0].PriceBeforeDiscount).toFixed(2)),
                    PriceECommerce: responseProdcut[0].PriceECommerce,
                    PriceTaxECommerce: Number(((responseProdcut[0].PriceECommerce * (tax / 100)) + responseProdcut[0].PriceECommerce).toFixed(2)),
                    U_FMB_Handel_Show100: responseProdcut[0].U_FMB_Handel_Show100
                });
            }
            
        
        };
        //Se regresan los datos al front
        responseModel.status = 1;
        responseModel.data = responseBody || {};
        ////console.log(responseModel);
    } catch (e) {
        logger.error(e);
        responseModel.message = 'Ocurrio un error al solicitar los fabricanets de los prudctos';
        responseModel.data = [];
    }
    response.json(responseModel);
    return;
}