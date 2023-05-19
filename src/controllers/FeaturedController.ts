import { Request, Response } from "express";
import ResponseModel from "../models/ResponseModel";
import { logger } from "../util/logger";
import ProductsModel from "../models/ProductsModel";
import FeaturedProcedure from "../procedures/FeaturedProcedure";
import { getProfile } from "./ProfileController";
import { getTaxes, getSpecialPrices, getValidationSpecialPrices } from "./CatalogsController";
import ProductsProcedure from "../procedures/ProductsProcedure";
import moment from 'moment';
import DiscountSpecial from "../procedures/DiscountSpecial";

let action: any;
let actionCount : any;
let categoryType: any;
let limitSlider : any = 0;

export async function getCategoriesHome(request: Request, response: Response) {
    const { section } = request.params;
    let responseModel = new ResponseModel();
    try {
        action = 'getCategories';
        if(section == 'home'){
            categoryType = 'getCategoriesHome';
        } else if(section == 'redPolar'){
            categoryType = 'getCategoriesRedPolar';
        } else if(section == 'blanca'){
            categoryType = 'getCategoriesBlanca';
        }         
        let result: any = await FeaturedProcedure(action, 0, categoryType);
        responseModel.status = 1;
        responseModel.data = result;
    } catch (e) {
        logger.error(e);
        responseModel.message = 'Ocurrio un error al solicitar las categorias Home desde SQL';
        responseModel.data = [];
    }
    response.json(responseModel);
    return;
}

export async function getProductsHome(request: Request, response: Response) {
    //Este contesta al front con los datos del back
    let responseModel = new ResponseModel();
    //Son varibales necesaria para la configuran de los valores del los productos
    let { db_name, currency, localLanguage, priceList , wareHouse} = response.locals.business;
    // const { wareHouse } = response.locals.business;
    let { itemCode } = request.params;
    let alias = decodeURIComponent(itemCode);
    let { CardCode, ListNum, } = response.locals.user;
    let { shoppingCartPublic, whs, nextNum, uniqueFilter}:any = request.query;

    try {
        //Obtenidno de lalista de los productos activados
        action = 'getProducts';
        let result: any = await FeaturedProcedure(action,0);
        // Create model para buscar un producto
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
            model1.itemCode = result[i].itemCode;
            let responseProdcut = await ProductsProcedure(model1);
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

                    item.QuantitySpecial = cart.length ? cart[0].quanity : 1;
                
                    const DiscountSpecials = await DiscountSpecial(CardCode,responseProdcut[0].ItemCode,1);
                    responseProdcut[0].DiscountPercentSpecial = parseFloat(DiscountSpecials[0].DescuentoFinal || 0)
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
            // });

            let priceTax = Number(((responseProdcut[0].Price * (tax / 100)) + responseProdcut[0].Price).toFixed(2));

            responseBody.push({
                ItemCode: responseProdcut[0].ItemCode,
                ItemName: responseProdcut[0].ItemName,
                PicturName: responseProdcut[0].PicturName,
                FrgnName: responseProdcut[0].FrgnName,
                OnHand: responseProdcut[0].OnHand,
                Price: responseProdcut[0].Price,
                UserText: responseProdcut[0].UserText,
                U_Handel_Tags: responseProdcut[0].U_Handel_Tags,
                U_Handel_ImagesArray: responseProdcut[0].U_Handel_ImagesArray,
                U_Handel_Slogan: responseProdcut[0].U_Handel_Slogan,
                U_Handel_attachment: responseProdcut[0].U_Handel_attachment,
                U_FMB_Handel_Promo:  responseProdcut[0].U_FMB_Handel_Promo,
                U_web: responseProdcut[0].U_web,
                wishlist: responseProdcut[0].wishlist,
                currency: responseProdcut[0].Currency,
                localLanguage: localLanguage,
                favorite: !!favorite.length,
                backOrder: !!back.length,
                quanity: cart.length ? cart[0].quanity : '',
                taxRate: tax,
                priceTax: priceTax,
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
        };
        //Se regresan los datos al front
        responseModel.status = 1;
        responseModel.data = responseBody || {};
    } catch (e) {
        logger.error(e);
        responseModel.status = 0;
        responseModel.message = 'Ocurrio un error al solicitar los prodcutos home desde SQL';
        responseModel.data = [];
    }
    response.json(responseModel);
    return;
}

export async function getBannerHome(request: Request, response: Response) {
    let responseModel = new ResponseModel();
    try {

        action = 'getBanner';
        let result: any = await FeaturedProcedure(action, 0);

        responseModel.status = 1;
        responseModel.data = result;
    } catch (e) {
        logger.error(e);
        responseModel.message = 'Ocurrio un error al solicitar el banner desde SQL';
        responseModel.data = [];
    }
    response.json(responseModel);
    return;
}

export async function getProductsEspecial(request: Request, response: Response) {
    const { contenido } = request.body;
    let responseModel = new ResponseModel();
    //Son varibales necesaria para la configuran de los valores del los productos
    let { db_name, currency, localLanguage, priceList } = response.locals.business;
    let { itemCode } = request.params;
    let { CardCode, wareHouse, ListNum } = response.locals.user;
    let { shoppingCartPublic, whs, nextNum}:any = request.query;
    switch (contenido.opcion) {
        case "promocion":
            action = 'getPromo';
            actionCount = 'countGetPromo';
            if(contenido.limit){
                limitSlider = contenido.limit;
            }
            break;
        case "remates":
            action = 'getRemates';
            actionCount = 'countGetRemates';
            break;
        case "nuevosproductos":
            action = 'getNuevos';
            actionCount = 'countGetNuevos';
            if(contenido.limit){
                limitSlider = contenido.limit;
            }
            break;
        case "masvendidos":
            action = 'getMasVendidos';
            break;
        default:
            break;
    }

    try {
        //Obtenidno de lalista de los productos activados
        let result: any = await FeaturedProcedure(action, nextNum || 0, '', limitSlider);
        let resultRows: any = action !== 'getMasVendidos' ? await FeaturedProcedure(actionCount, nextNum || 0, '', limitSlider) : '';
        let totalRows = resultRows === '' ? 10 : resultRows[0].TotalRows || 0;

        let model1: ProductsModel = new ProductsModel();
        // Variables que recibe el store procedure
        model1.action = 'findOne';
        model1.business = db_name;
        model1.cardCode = CardCode;
        model1.wareHouse = whs ? whs : wareHouse;
        model1.nextNumber = nextNum || 0; 
        //Variablas para almacenar los productos con su información 
        let responseBody:any = [];
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
        //Busqueda de la informacion del producto

        // Special Pricess Full Query
        let responseSpecialPrices:any  = [];
        let responseSpecialPricesList : any = [];
        let ValidationSpecialPrices : any = false;
        
        // Lista de precios
        let PriceList = ListNum && ListNum !== '' ? ListNum : priceList;
       

        let validateActivationSpecialPrices: any = await getValidationSpecialPrices(request, response, true);
        if (validateActivationSpecialPrices.status === 1 &&validateActivationSpecialPrices.data == 1) {
            ValidationSpecialPrices = true;
        }

        for (let j = 0; j < result.length; j++) {
            const element = result[j];
            model1.itemCode = element.ItemCode;
            let responseProdcut = await ProductsProcedure(model1);
            if (responseProdcut[0] ) {

                let favorite = favorites.filter((favorite: any) => {
                    return (favorite.ItemCode == responseProdcut[0].ItemCode)
                });

                let cart = shoppingCart.filter((shopping: any) => {
                    return (shopping.ItemCode == responseProdcut[0].ItemCode)
                });

                let back = backOrder.filter((shopping: any) => {
                    return (shopping.ItemCode == responseProdcut[0].ItemCode)
                });

                // Cambiamos los valores del almcen segun el stock
                if( responseProdcut[0].OnHandPrincipal <= 0){
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

                        item.QuantitySpecial = cart.length ? cart[0].quantity : 1;
                    
                        const DiscountSpecials = await DiscountSpecial(CardCode,responseProdcut[0].ItemCode,1);
                        responseProdcut[0].DiscountPercentSpecial = parseFloat(DiscountSpecials[0].DescuentoFinal || 0)
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
                // });

                let priceTax = Number(((responseProdcut[0].Price * (tax / 100)) + responseProdcut[0].Price).toFixed(2));

                responseBody.push({
                    ItemCode: responseProdcut[0].ItemCode || '',
                    ItemName: responseProdcut[0].ItemName || '',
                    PicturName: responseProdcut[0].PicturName || '',
                    FrgnName: responseProdcut[0].FrgnName || '',
                    OnHand: responseProdcut[0].OnHand || '',
                    Price: responseProdcut[0].Price || '',
                    UserText: responseProdcut[0].UserText || '',
                    U_Handel_Tags: responseProdcut[0].U_Handel_Tags || '',
                    U_Handel_ImagesArray: responseProdcut[0].U_Handel_ImagesArray || '',
                    U_Handel_Slogan: responseProdcut[0].U_Handel_Slogan || '',
                    U_Handel_attachment: responseProdcut[0].U_Handel_attachment || '',
                    U_FMB_Handel_Promo:  responseProdcut[0].U_FMB_Handel_Promo,
                    U_web: responseProdcut[0].U_web || '',
                    wishlist: responseProdcut[0].wishlist || '',
                    currency: element.Currency || '',
                    localLanguage: localLanguage || '',
                    favorite: !!favorite.length || '',
                    backOrder: !!back.length || '',
                    quantity: cart.length ? cart[0].quantity : '',
                    taxRate: tax || '',
                    priceTax: priceTax || '',
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
        responseModel.data = { responseBody, totalRows };
    } catch (e) {
        logger.error(e);
        responseModel.message = 'Ocurrio un error al solicitar los fabricantes de los productos';
        responseModel.data = [];
    }
    response.json(responseModel);
    return;
}
export async function ProductsEspecial(request: Request, response: Response) {
    const { contenido } = request.body;
    let responseModel = new ResponseModel();
    let model1 : ProductsModel = new ProductsModel();
    //Son varibales necesaria para la configuran de los valores del los productos
    let { db_name, currency, localLanguage, priceList } = response.locals.business;
    let { itemCode } = request.params;
    let { CardCode, ListNum, wareHouse } = response.locals.user;
    let { shoppingCartPublic, whs, nextNum}:any = request.query;
    let specialPrices: any = [];
    let specialPricesList: any = [];
    try {
        //Obtenidno de lalista de los productos activados
        if(contenido.limit){
            limitSlider = contenido.limit;
        }

        action = 'getPromo';
        actionCount = 'countGetPromo';
        let result: any = await FeaturedProcedure(action, nextNum || 0, '', limitSlider,(whs ? whs : wareHouse),CardCode);
        console.log('117>> result',result )
        action = 'getNuevos';
        actionCount = 'countGetNuevos';
        let result2: any = await FeaturedProcedure(action, nextNum || 0, '', limitSlider,(whs ? whs : wareHouse),CardCode);


        //Variablas para almacenar los productos con su información 
        let responseBody:any = [];
        let responseBody2:any = [];
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
        //Busqueda de la informacion del producto

        // Special Pricess Full Query
        // Socio de negocios
        let responseSpecialPrices:any  = [];
        let responseSpecialPricesList : any = [];
        let ValidationSpecialPrices : any = false;
           // // Lista de precios
        let PriceList = ListNum && ListNum !== '' ? ListNum : priceList;

        let validateActivationSpecialPrices: any = await getValidationSpecialPrices(request, response, true);
        
        if (validateActivationSpecialPrices.status === 1 && validateActivationSpecialPrices.data == 1) {
            ValidationSpecialPrices = true;
        } 
   

        for (let j = 0; j < result.length; j++) {
            const element = result[j];
            // let responseProdcut = await ProductsProcedure(model1);
            // if (responseProdcut[0] ) {

                let favorite = favorites.filter((favorite: any) => {
                    return (favorite.ItemCode == element.ItemCode)
                });

                let cart = shoppingCart.filter((shopping: any) => {
                    return (shopping.ItemCode == element.ItemCode)
                });

                let back = backOrder.filter((shopping: any) => {
                    return (shopping.ItemCode == element.ItemCode)
                });

                if(element.OnHandPrincipal <= 0){
                    element.OnHandPrincipal = 0;
                    element.flag = 'red';
                } else {
                    element.flag = 'green';
                }

                // responseProdcut.map((item: any, index: Number) => {

                    // Special Prices Validation
                    //########################################################################################################################
                    // if(index < 1){
                        let priority2 = "*" + PriceList;
                        let formattedDocDate = moment().format('YYYY/MM/DD');

                        let flagSN = true; // Socio de negocio
                        let flagPriceList = true; // Lista de precios
                        let flagPricePriority = true;
                        let maxQuantity = 0; // Cantidad maxima a alegir
                        let priceItem = -1;
                        let discount = -1;
                        let priceBeforeDisc: any = -1;

                        element.QuantitySpecial = cart.length ? cart[0].quantity : 1;

                        const DiscountSpecials = await DiscountSpecial(CardCode,element.ItemCode,1);
                        if(parseFloat(DiscountSpecials[0].DescuentoFinal) !== 0){
                            element.DiscountPercentSpecial = parseFloat(DiscountSpecials[0].DescuentoFinal || 0)
                            // DESCOMENTAR SI QUEREMOS QUE TODOS LOS ARTICULOS CON DESCUENTOS TENGAN LA ETIQUETA DE PROMOCIÓN 
                            // element.U_FMB_Handel_Promo = DiscountSpecials[0].DescuentoFinal !== 0 ? 1 : 0;
                            priceItem = parseFloat(DiscountSpecials[0].PrecioFinal);
                            discount = parseFloat(DiscountSpecials[0].DescuentoFinal || 0);
                            priceBeforeDisc = ((100 * priceItem) / (100 - discount)).toFixed(2);
                        }else{
                            element.DiscountPercentSpecial = 0;
                        }
                        element.Price = Number(DiscountSpecials[0].PrecioFinal).toFixed(2);
                        // Precios por descuentos especiales
                        if(priceBeforeDisc != -1){
                            if(element.IsGrossPrc === 'Y'){
                                let decimalesUno = 1 + (tax / 100);
                                element.Price = Number(priceItem/decimalesUno).toFixed(2);
                            }
                            element.PriceBeforeDiscount = Number(priceBeforeDisc);
                        }else{
                            if(element.IsGrossPrc === 'Y'){
                                let decimalesUno = 1 + (tax / 100);
                                element.Price = Number(element.Price/decimalesUno).toFixed(2);
                            }
                        }
                    // }
                //#######################################################################################################################
                // });
                //Almacenes lista de promociones
                // element.WhsCode = cart.length ? cart[0].WhsCode : element.WhsCode;
                // model1.action = 'searchWhs';
                // model1.business = db_name;
                // model1.cardCode = CardCode;
                // model1.wareHouse = wareHouse;
                // model1.quantity = 0;
                // model1.itemCode = element.ItemCode;
                // let WhsList1 = await ProductsProcedure(model1);
                //     let OnHandelPrincipal1 = WhsList1.filter((WhsList: any) => {
                //     return (WhsList.WhsCode == element.WhsCode && WhsList.itemCode ==element.ItemCode)
                // });
                //Almacenes lista de promociones

                let priceTax = Number(parseFloat(((element.Price * (tax / 100)) + element.Price)).toFixed(2));
                responseBody.push({
                    ItemCode: element.ItemCode || '',
                    ItemName: element.ItemName || '',
                    PicturName: element.PicturName || '',
                    FrgnName: element.FrgnName || '',
                    OnHand: element.OnHand || '',
                    Price: element.Price || '',
                    UserText: element.UserText || '',
                    U_Handel_Tags: element.U_Handel_Tags || '',
                    U_Handel_ImagesArray: element.U_Handel_ImagesArray || '',
                    U_Handel_Slogan: element.U_Handel_Slogan || '',
                    U_Handel_attachment: element.U_Handel_attachment || '',
                    U_FMB_Handel_Promo:  element.U_FMB_Handel_Promo,
                    U_web: element.U_web || '',
                    wishlist: element.wishlist || '',
                    currency: element.Currency || '',
                    localLanguage: localLanguage || '',
                    favorite: !!favorite.length || '',
                    backOrder: !!back.length || '',
                    // quantity: cart.length ? cart[0].quantity : ((parseInt(OnHandelPrincipal1[0].OnHand) > 0) || (element.OnHandPrincipal > 0) ? 1 : "0" ),
                    quantity: cart.length ? cart[0].quantity : '',
                    taxRate: tax || '',
                    priceTax: priceTax || '',
                    // OnHandPrincipal: OnHandelPrincipal1.length ? OnHandelPrincipal1[0].OnHand : element.OnHandPrincipal,// Almacenes lista de promociones
                    OnHandPrincipal: element.OnHandPrincipal,
                    WhsCode : element.WhsCode,
                    flag : element.flag,
                    DiscountPercentSpecial: element.DiscountPercentSpecial,
                    PriceBeforeDiscount: element.PriceBeforeDiscount,
                    PriceTaxBeforeDiscount: Number(((element.PriceBeforeDiscount * (tax / 100)) + element.PriceBeforeDiscount).toFixed(2)),
                    PriceECommerce: element.PriceECommerce,
                    PriceTaxECommerce: Number(parseFloat(((element.PriceECommerce * (tax / 100)) + element.PriceECommerce)).toFixed(2)),
                    U_FMB_Handel_Show100: element.U_FMB_Handel_Show100,
                    U_MultiploVenta: element.U_MultiploVenta,
                    RateUSD : element.RateUSD,
                    // WhsList: WhsList1,// Almacenes lista de promociones
                    MaximoStock : element.MaximoStock,                
                });
            // }


        };
        for (let j = 0; j < result2.length; j++) {
            const element = result2[j];

                let favorite = favorites.filter((favorite: any) => {
                    return (favorite.ItemCode == element.ItemCode)
                });

                let cart = shoppingCart.filter((shopping: any) => {
                    return (shopping.ItemCode == element.ItemCode)
                });

                let back = backOrder.filter((shopping: any) => {
                    return (shopping.ItemCode == element.ItemCode)
                });

                if(element.OnHandPrincipal <= 0){
                    element.OnHandPrincipal = 0;
                    element.flag = 'red';
                } else {
                    element.flag = 'green';
                }

                

                // responseProdcut.map((item: any, index: Number) => {

                    // Special Prices Validation
                    //########################################################################################################################
                    // if(index < 1){
                        let priority2 = "*" + PriceList;
                        let formattedDocDate = moment().format('YYYY/MM/DD');

                        let flagSN = true; // Socio de negocio
                        let flagPriceList = true; // Lista de precios
                        let flagPricePriority = true;
                        let maxQuantity = 0; // Cantidad maxima a alegir
                        let priceItem = -1;
                        let discount = -1;
                        let priceBeforeDisc: any = -1;

                        element.QuantitySpecial = cart.length ? cart[0].quantity : 1;

                        const DiscountSpecials = await DiscountSpecial(CardCode,element.ItemCode,1);
                        if(parseFloat(DiscountSpecials[0].DescuentoFinal) !== 0){
                            element.DiscountPercentSpecial = parseFloat(DiscountSpecials[0].DescuentoFinal || 0)
                            // DESCOMENTAR SI QUEREMOS QUE TODOS LOS ARTICULOS CON DESCUENTOS TENGAN LA ETIQUETA DE PROMOCIÓN 
                            // element.U_FMB_Handel_Promo = DiscountSpecials[0].DescuentoFinal !== 0 ? 1 : 0;
                            priceItem = parseFloat(DiscountSpecials[0].PrecioFinal);
                            discount = parseFloat(DiscountSpecials[0].DescuentoFinal || 0);
                            priceBeforeDisc = ((100 * priceItem) / (100 - discount)).toFixed(2);
                        }else{
                            element.DiscountPercentSpecial = 0;
                        }
                        element.Price = Number(DiscountSpecials[0].PrecioFinal).toFixed(2);
                        // Precios por descuentos especiales
                        if(priceBeforeDisc != -1){
                            if(element.IsGrossPrc === 'Y'){
                                let decimalesUno = 1 + (tax / 100);
                                element.Price = Number(priceItem/decimalesUno).toFixed(2);
                            }
                            element.PriceBeforeDiscount = Number(priceBeforeDisc);
                        }else{
                            if(element.IsGrossPrc === 'Y'){
                                let decimalesUno = 1 + (tax / 100);
                                element.Price = Number(element.Price/decimalesUno).toFixed(2);
                            }
                        }
                    // }
                //#######################################################################################################################
                // });

                //Almacenes lista de nuevos
                // element.WhsCode = cart.length ? cart[0].WhsCode : element.WhsCode;
                // model1.action = 'searchWhs';
                // model1.business = db_name;
                // model1.cardCode = CardCode;
                // model1.wareHouse = wareHouse;
                // model1.quantity = 0;
                // model1.itemCode = element.ItemCode;
                // let WhsList1 = await ProductsProcedure(model1);
                // let OnHandelPrincipal1 = WhsList1.filter((WhsList: any) => {
                //     return (WhsList.WhsCode == element.WhsCode && WhsList.itemCode ==element.ItemCode)
                // });
                //Almacenes lista de nuevos

                let priceTax = Number(parseFloat(((element.Price * (tax / 100)) + element.Price)).toFixed(2));

                responseBody2.push({
                    ItemCode: element.ItemCode || '',
                    ItemName: element.ItemName || '',
                    PicturName: element.PicturName || '',
                    FrgnName: element.FrgnName || '',
                    OnHand: element.OnHand || '',
                    Price: element.Price || '',
                    UserText: element.UserText || '',
                    U_Handel_Tags: element.U_Handel_Tags || '',
                    U_Handel_ImagesArray: element.U_Handel_ImagesArray || '',
                    U_Handel_Slogan: element.U_Handel_Slogan || '',
                    U_Handel_attachment: element.U_Handel_attachment || '',
                    U_FMB_Handel_Promo:  element.U_FMB_Handel_Promo,
                    U_web: element.U_web || '',
                    wishlist: element.wishlist || '',
                    currency: element.Currency || '',
                    localLanguage: localLanguage || '',
                    favorite: !!favorite.length || '',
                    backOrder: !!back.length || '',
                    // quantity: cart.length ? cart[0].quantity : ((parseInt(OnHandelPrincipal1[0].OnHand) > 0) || (element.OnHandPrincipal > 0) ? 1 : "0" ), // Almacenes lista de promociones
                    quantity: cart.length ? cart[0].quantity : '',
                    taxRate: tax || '',
                    priceTax: priceTax || '',
                    // OnHandPrincipal: OnHandelPrincipal1.length  ? OnHandelPrincipal1[0].OnHand : element.OnHandPrincipal, // Almacenes lista de promociones
                    OnHandPrincipal: element.OnHandPrincipal,
                    WhsCode : element.WhsCode,
                    flag : element.flag,
                    DiscountPercentSpecial: element.DiscountPercentSpecial,
                    PriceBeforeDiscount: element.PriceBeforeDiscount,
                    PriceTaxBeforeDiscount: Number(((element.PriceBeforeDiscount * (tax / 100)) + element.PriceBeforeDiscount).toFixed(2)),
                    PriceECommerce: element.PriceECommerce,
                    PriceTaxECommerce: Number(parseFloat(((element.PriceECommerce * (tax / 100)) + element.PriceECommerce)).toFixed(2)),
                    U_FMB_Handel_Show100: element.U_FMB_Handel_Show100,
                    U_MultiploVenta: element.U_MultiploVenta,
                    RateUSD : element.RateUSD,
                    // WhsList: WhsList1, // Almacenes lista de promociones
                    MaximoStock : element.MaximoStock,                    
                });
            // }


        };
        //Se regresan los datos al front
        responseModel.status = 1;
        responseModel.data = { responseBody ,responseBody2};
    } catch (e) {
        logger.error(e);
        responseModel.message = 'Ocurrio un error al solicitar los fabricantes de los productos';
        responseModel.data = [];
    }
    response.json(responseModel);
    return;
}

export async function getSpecialPrice(request: Request, response: Response) {
    let responseModel = new ResponseModel();
    //Son varibales necesaria para la configuran de los valores del los productos
    let {priceList } = response.locals.business;
    let {CardCode, ListNum} = response.locals.user;
    // const { contenido } = request.body;
    // let { itemCode } = request.params;
    // let { shoppingCartPublic, whs, nextNum} = request.query;  
    try{
        // Special Pricess Full Query
        // Socio de negocios
      
        

        let specialPrices:any  = [];
        let specialPricesList : any = [];
           // // Lista de precios

        let validateActivationSpecialPrices: any = await getValidationSpecialPrices(request, response, true);
        
        if (validateActivationSpecialPrices.status === 1 && validateActivationSpecialPrices.data == 1) {
            let responseSpecialPrices = await getSpecialPrices(CardCode);
            specialPrices = responseSpecialPrices.status == 1 ? responseSpecialPrices.data : [];
            // Lista de precios
            let PriceList = ListNum && ListNum !== '' ? ListNum : priceList;
            let responseSpecialPricesList = await getSpecialPrices('*' + PriceList);
            specialPricesList= responseSpecialPricesList.status == 1 ? responseSpecialPricesList.data : [];
        } 
       


        //Se regresan los datos al front
        responseModel.status = 1;
        responseModel.data = { specialPrices, specialPricesList, CardCode, ListNum, priceList };
    } catch (e) {
        logger.error(e);
        responseModel.message = 'Ocurrio un error al solicitar los fabricantes de los productos';
        responseModel.data = [];
    }
    response.json(responseModel);
    return;
}