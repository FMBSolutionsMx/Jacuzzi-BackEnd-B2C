import {Request, Response} from "express";
import ProfileModel from "../models/ProfileModel";
import ProfileProcedure from "../procedures/ProfileProcedure";
import AddressProcedure from "../procedures/AddressProcedure";
import ResponseModel from "../models/ResponseModel";
import ProductsModel from "../models/ProductsModel";
import ProductsProcedure from "../procedures/ProductsProcedure";
import AutorizacionesProcedure from "../procedures/AutorizacionesProcedure";
import {getTaxes, getSpecialPrices, getValidationSpecialPrices} from "./CatalogsController";
import {logger} from "../util/logger";
import moment from 'moment';
import DiscountSpecial from "../procedures/DiscountSpecial";

export async function getProfile(request: Request, response: Response, internal = false) {
    const {db_name} = response.locals.business;
    const {profile_id, CardCode} = response.locals.user;
    let localstorageAll =  request.body.localShoppingCart;
   // //console.log('shoppinogs',response.locals,localstorageAll);
    
    let responseModel = new ResponseModel();
    try {
        let model: ProfileModel = new ProfileModel();
        //localstorageAll = localstorageAll; 
        model.action = 'find';
        model.business = db_name;
        model.cardCode = CardCode;
        model.id = profile_id;
        if(!localstorageAll){ localstorageAll='[]'; }
        ////console.log('Locals',localstorageAll);
        model.localStorageFront = localstorageAll;
        let result: any = await ProfileProcedure(model);
        if (result.length == 0) {
            responseModel.message = "Ocurrio un error al consultar el perfil";
            if (!internal) {
                response.json(responseModel);
                return;
            } else {
                return responseModel;
            }
        }

        model.action = 'getAddresses';
        model.business = db_name;
        model.cardCode = CardCode;
        model.id = 0;
        let addresses: any = await ProfileProcedure(model);
        result.shoppingCart =   JSON.parse(result.shoppingCart) || [] ;
        result.favorites =  JSON.parse(result.favorites) || [] ;
        result.backOrder =  JSON.parse(result.backOrder) || [] ;

        
        responseModel.status = 1;
        result.addresses = addresses || [];
        responseModel.data = result;
        responseModel.message = "Perfil";
        if (!internal) {
            response.json(responseModel);
            return;
        } else {
            return responseModel;
        }

    } catch (e) {
       logger.error(e);
       response.json(responseModel);
        // responseModel.message = "Ocurrio un error al consultar el perfil *****";
        // if (!internal) {
        //     response.json(responseModel);
        //     return;
        // } else {
            return responseModel;
        // }
    }
}

export async function createProfile(request: Request, response: Response, internal = false) {
    const {db_name} = response.locals.business;
    const {profile_id, CardCode} = response.locals.user;
    let localstorageAll =  request.body.localShoppingCart;
   // //console.log('shoppinogs',response.locals,localstorageAll);
    
    let responseModel = new ResponseModel();
    try {
        let model: ProfileModel = new ProfileModel();
        //localstorageAll = localstorageAll; 
        model.action = 'create';
        model.business = db_name;
        model.cardCode = CardCode;
        model.id = profile_id;
        model.shoppingCart = "[]";
        if(!localstorageAll){ 
            localstorageAll='[]'; 
        }
        ////console.log('Locals',localstorageAll);
        ////console.log("Por aui paso ");
        ////console.log('model de creación',model);
        let result: any = await ProfileProcedure(model);
        // //console.log("Se imprime de creacion",result);
        
        if (!result) {
            responseModel.message = "Ocurrio un error al crear el perfil";
            if (!internal) {
                response.json(responseModel);
                return;
            } else {
                return responseModel;
            }
        }

        model.action = 'getAddresses';
        model.business = db_name;
        model.cardCode = CardCode;
        model.id = 0;
        ////console.log("buscar direcciones del creado", model);
        let addresses: any = await AddressProcedure(model);
        ////console.log("Direcciones", addresses);
    
        result.shoppingCart = [];
        result.favorites = [];
        result.backOrder = [];
        result.addresses = addresses || [];
        responseModel.status = 1;
        
        // //console.log("Despues de todo", result);
        
        responseModel.data = result;
        responseModel.message = "Perfil";

        // //console.log("Internal", internal);
        if (!internal) {
            response.json(responseModel);
            return;
        } else {
            return responseModel;
        }

    } catch (e) {
       logger.error("ProfileController.js => createProfile: ",e);
        responseModel.message = "Ocurrio un error al consultar el perfil despues de creacio";
        if (!internal) {
            response.json(responseModel);
            return;
        } else {
            return responseModel;
        }
    }
}

export async function updateFavorites(request: Request, response: Response) {
    const {db_name} = response.locals.business;
    const {ItemCode} = request.body;
    const {profile_id} = response.locals.user;
    const {exist} = request.params;
    const responseModel = new ResponseModel();


    try {
        let profile: any = await getProfile(request, response, true);
        if (!profile.status) {
            responseModel.message = "Ocurrio un error al actualizar favoritos";
            response.json(responseModel);
            return;
        }
        profile = profile.data;

        if (exist == 'false') {

            profile.favorites.push({ItemCode})
        } else {
            let newFavorites: any = [];
            profile.favorites.map((item: any) => {
                if (ItemCode != item.ItemCode) newFavorites.push(item)
            });
            profile.favorites = newFavorites;
        }

        let model: ProfileModel = new ProfileModel();

        model.action = 'updateFavorites';
        model.business = db_name;
        model.id = profile_id;
        model.favorites = JSON.stringify(profile.favorites);
        let result: any = await ProfileProcedure(model);

        if (!result.id) {
            responseModel.message = "Ocurrio un error al actualizar favoritos";
            response.json(responseModel);
        }

        responseModel.status = 1;
        responseModel.data = {value: exist == 'true' ? !true : !false};
        responseModel.message = "Favoritos actualizados";
        response.json(responseModel);

    } catch (e) {
        logger.error(e);
        responseModel.message = "Ocurrio un error al actualizar favoritos";
        response.json(responseModel);
    }
}

export async function updateShoppingCart(request: Request, response: Response) {
    const {db_name} = response.locals.business;
    const {profile_id} = response.locals.user;
    const {item, quantity} = request.body;
    const responseModel = new ResponseModel();

    try {
        let profile: any = await getProfile(request, response, true);
        if (!profile.status) {
            responseModel.message = "Ocurrió un error al actualizar el carrito de compras";
            response.json(responseModel);
            return;
        }
        profile = profile.data;

        let shoppingCart = profile.shoppingCart || [];

        let exist = shoppingCart.filter((itemFilter: any) => {
            return (itemFilter.ItemCode == item.ItemCode)
        });
        if (!exist.length) {
            shoppingCart.push({ItemCode: item.ItemCode, quantity, WhsCode: item.WhsCode, /*onHandPrincipal: item.OnHandPrincipal*/})
        } else {
            shoppingCart.map((itemMap: any) => {
                if (item.ItemCode == itemMap.ItemCode) {
                    itemMap.WhsCode = item.WhsCode;
                    // itemMap.onHandPrincipal = item.OnHandPrincipal;
                    itemMap.quantity = item.quantity;
                }
            });
        }
        let model: ProfileModel = new ProfileModel();

        model.action = 'updateShoppingCart';
        model.business = db_name;
        model.id = profile_id;
        model.shoppingCart = JSON.stringify(shoppingCart);
        
        let result: any = await ProfileProcedure(model);

        responseModel.status = 1;
        responseModel.data = {value: !!exist.length};
        responseModel.message = "shoppingCart actualizados";
        response.json(responseModel);

    } catch (e) {
        logger.error(e);
        responseModel.message = "Ocurrio un error al actualizar el carrito de compras";
        response.json(responseModel);
    }
}

export async function updateShoppingCartLocal(request: Request, response: Response) {
    const {db_name} = response.locals.business;
    const {profile_id} = response.locals.user;
    const {item, quantity} = request.body;
    const responseModel = new ResponseModel();
    let shoppingCart = request.body
    ////console.log("CarroLocal",response.locals,request.body);

    try {
        let model: ProfileModel = new ProfileModel();

        model.action = 'updateShoppingCart';
        model.business = db_name;
        model.id = profile_id;
        model.shoppingCart = JSON.stringify(shoppingCart.data);
        
        ////console.log("Se va por updateCart",model);
        let result: any = await ProfileProcedure(model);

        // if (!result.id) {
        //     responseModel.message = "Ocurrio un error al actualizar el carrito de compras";
        //     response.json(responseModel);
        // }

        responseModel.status = 1;
        responseModel.data = {value: shoppingCart.data.length};
        responseModel.message = "shoppingCart actualizados";
        response.json(responseModel);

    } catch (e) {
        logger.error(e);
        responseModel.message = "Ocurrio un error al actualizar el carrito de compras";
        response.json(responseModel);
    }
}

export async function deleteShoppingCart(request: Request, response: Response) {
    const {db_name} = response.locals.business;
    const {profile_id} = response.locals.user;
    const {item, deleteAll} = request.body;
    const responseModel = new ResponseModel();

    try {
        let profile: any = await getProfile(request, response, true);
        if (!profile.status) {
            responseModel.message = "Ocurrio un error al eliminar el producto el carrito de compras";
            response.json(responseModel);
            return;
        }
        profile = profile.data;

        let shoppingCart = profile.shoppingCart || [];

        let newItems = shoppingCart.filter((itemFilter: any) => {
            return (itemFilter.ItemCode != item.ItemCode)
        });

        if(deleteAll){
            newItems = [];
        }

        let model: ProfileModel = new ProfileModel();

        model.action = 'updateShoppingCart';
        model.business = db_name;
        model.id = profile_id;
        model.shoppingCart = JSON.stringify(newItems);
        let result: any = await ProfileProcedure(model);
        // if (!result.id) {
        //     responseModel.message = "Ocurrio un error al actualizar el carrito de compras";
        //     response.json(responseModel);
        // }

        responseModel.status = 1;
        responseModel.data = {};
        responseModel.message = "shoppingCart actualizados";
        response.json(responseModel);

    } catch (e) {
        logger.error(e);
        responseModel.message = "Ocurrio un error al actualizar el carrito de compras";
        response.json(responseModel);
    }
}

export async function getShoppingCart(request: Request, response: Response, internal = false) {
    let {db_name, currency, localLanguage, priceList,type } = response.locals.business;
    const {profile_id} = response.locals.user;
    const {quantity, item} = request.body;
    const {CardCode, ListNum, CardName, wareHouse} = response.locals.user;
    const publicShoppingCart = request.body.shoppingCart;
    const responseModel = new ResponseModel();


    if(currency === 'MXP'){
        currency = 'MXN';
    }

    const resultTaxes:any = await getTaxes(request, response, true);
    if(!resultTaxes.status){
        responseModel.message = "ocurrio un error al traer los productos";
        response.json(responseModel);
        return;
    }

    let tax:any = resultTaxes.data.Rate;


    try {
        let shoppingCart = [];
        let backOrder = [];

        if(profile_id) {
            
            let profile: any = await getProfile(request, response, true);
            if (!profile.status) {
                responseModel.message = "Ocurrio un error al consultar tu carrito de comprasf";
                response.json(responseModel);
                if (!internal) {
                    response.json(responseModel);
                    return;
                } else {
                    return responseModel;
                }
            }
            profile = profile.data;

            shoppingCart = profile.shoppingCart || [];
            backOrder = profile.backOrder || [];

        }else{
            shoppingCart = publicShoppingCart || [];
            backOrder = [];
        }



        let argItemCode:any = '';
        for (let index = 0; index < shoppingCart.length; index++) {
            const item = shoppingCart[index];
            if(type === 'SQL'){
                argItemCode+=  `'${item.ItemCode}',`;  
            }else{
                argItemCode+=  `''${item.ItemCode}'',`;  
            }
        }
        if(argItemCode){
            argItemCode = argItemCode.substring(0 , argItemCode.length -1); 
        }

        let newShoppingCart = [];
        let model: ProductsModel = new ProductsModel();
        model.action = 'findOne';
        model.business = db_name;
        model.cardCode = CardCode;
        //model.wareHouse = wareHouse; //shoppingCart[i].WhsCode || wareHouse; 
        model.itemCode = argItemCode//shoppingCart[i].ItemCode;

        let result:any = await ProductsProcedure(model);
        let itemsArray:any = [];
        

        for (let index = 0; index < result.length; index++) {
            const item = result[index];
            let whsCode:any = null;
                //#region  Detectar Propiedad Acceso para seleccionar Almacen destino 
                if(item.U_Categ_ret == '2'){
                    whsCode = '002'
                }
                //#endRegion

            let discount:any = (parseFloat(item.Discount) || 0);
            let priceItem:any = parseFloat(item.PrecioFinal);
            item.taxRate = tax;
            item.QuantitySpecial = 1 
            
            //#region STOCK EN ALMACEN PRINCIPAL
            if(item.OnHandPrincipal <= 0){
                item.OnHandPrincipal = 0;
                item.flag = 'red';     
            } else {
                item.flag = 'green';
            }
            //#endRegion
            item.DiscountPercentSpecial = discount ;
            if(item.IsGrossPrc === 'Y'){
                let decimalesUno = 1 + (item.taxRate / 100);
                item.Price = Number(priceItem/decimalesUno);
            }
            item.PriceBeforeDiscount = Number((100 * priceItem) / (100 - discount));
            item.PriceTaxBeforeDiscount = Number(((item.PriceBeforeDiscount * (item.taxRate / 100)) + item.PriceBeforeDiscount).toFixed(2));
            
            

            let itemShopping:any = shoppingCart.find((itemShopping:any) => itemShopping.ItemCode === item.ItemCode);
            newShoppingCart.push({
                ItemCode : item.ItemCode,
                quantity: itemShopping.quantity,
                ItemName: item.ItemName,
                Price: ((item.Price) - (item.Price * (item.DiscountPercentSpecial/100))),
                OnHand: item.OnHand,
                weight: parseFloat(item.SWeight1 || 0).toFixed(2),
                weight1: parseFloat(item.IWeight1 || 0).toFixed(2),
                PicturName: item.PicturName,
                taxRate: tax,
                taxSum:  Number((item.Price * (tax / 100)).toFixed(2)),
                priceTax: (((item.Price) - (item.Price * (item.DiscountPercentSpecial/100))) +(((item.Price) - (item.Price * (item.DiscountPercentSpecial/100))) * (tax / 100))),
                currency: item.Currency,
                localLanguage: localLanguage,
                U_FMB_Handel_Promo:  item.U_FMB_Handel_Promo,
                U_FMB_Handel_PNTA:  item.U_FMB_Handel_PNTA,
                OnHandPrincipal: item.OnHandPrincipal,
                WhsCode : whsCode || wareHouse,
                WhsName : item.WhsName,
                flag : item.flag,
                DiscountPercentSpecial: item.DiscountPercentSpecial,

                PriceBeforeDiscount: item.PriceBeforeDiscount,
                PriceTaxBeforeDiscount: Number(( Number((item.PriceBeforeDiscount * (tax / 100)).toFixed(2)) + item.PriceBeforeDiscount).toFixed(2)),

                PriceECommerce: item.PriceECommerce,
                PriceTaxECommerce: Number(Number(( (Number(item.PriceECommerce) * (Number(tax) / 100)).toFixed(2)) + Number(item.PriceECommerce)).toFixed(2)),
                U_FMB_Handel_Show100: item.U_FMB_Handel_Show100,
                U_MultiploVenta: item.U_MultiploVenta,
                U_Descuento: item.DiscountPercentSpecial,
                Rate : item.Rate,
                WhsList: (whsCode) ? whsCode : '',
                MaximoStock: item.MaximoStock,
            })
            
        }

           
    
        // for (let i = 0; i < shoppingCart.length; i++) {

           
        //     let item = result[0];

        //     if (result.length) {

        //         model.action = 'searchWhs';
        //         model.business = db_name;
        //         model.cardCode = CardCode;
        //         model.wareHouse = wareHouse;
        //         model.quantity = shoppingCart[i].quantity;
        //         model.itemCode =  shoppingCart[i].ItemCode;
                
                
        //         let result1:any = await ProductsProcedure(model);
            
                
        //     }

        // }




        let newBackOrder:any = [];
        // for (let i = 0; i < backOrder.length; i++) {
        //     let model: ProductsModel = new ProductsModel();

        //     model.action = 'findOne';
        //     model.business = db_name;
        //     model.cardCode = CardCode;
        //     model.wareHouse = wareHouse;
        //     model.itemCode = backOrder[i].ItemCode;

        //     // Call procedure
        //     const result:any = await ProductsProcedure(model);

        //     if (result.length) {
        //         backOrder[i] = {
        //             ...backOrder[i],
        //             ItemName: result[0].ItemName,
        //             Price: result[0].Price,
        //             OnHand: result[0].OnHand,
        //             //OnHand: 0,
        //             PicturName: result[0].PicturName,
        //             taxRate: tax,
        //             taxResult: Number((result[0].Price * (tax / 100)).toFixed(2)),
        //             priceTax: Number( parseFloat((Number((result[0].Price * (tax / 100)).toFixed(2)) + result[0].Price)).toFixed(2)),
        //             currency: currency,
        //             localLanguage: localLanguage,
        //         };

        //         newBackOrder.push(backOrder[i])
        //     }

        // }
        let data = {
            shoppingCart: newShoppingCart,
            backOrder: newBackOrder
        };

        
        
        responseModel.status = 1;
        responseModel.data = data;
        responseModel.message = "Tu carrito de compras";
        if (!internal) {
            response.json(responseModel);
        } else {
            return responseModel;
        }
    } catch (e) {
        logger.error(e);
        responseModel.message = "Ocurrio un error al consultar tu carrito de comprasdf";
        if (!internal) {
            response.json(responseModel);
        } else {
            return responseModel;
        }
    }
}

export async function updateBackOrder(request: Request, response: Response) {
    const {db_name} = response.locals.business;
    const {profile_id} = response.locals.user;
    const {item, quantity} = request.body;
    const responseModel = new ResponseModel();


    try {
        let profile: any = await getProfile(request, response, true);
        if (!profile.status) {
            responseModel.message = "Ocurrio un error al actualizar tu lista de deseos";
            response.json(responseModel);
            return;
        }
        profile = profile.data;

        let backOrder = profile.backOrder || [];

        let exist = backOrder.filter((itemFilter: any) => {
            return (itemFilter.ItemCode == item.ItemCode)
        });

        if (!exist.length) {
            backOrder.push({ItemCode: item.ItemCode, quantity})
        } else {
            backOrder.map((itemMap: any) => {
                if (item.ItemCode == itemMap.ItemCode) {
                    itemMap.quantity = quantity;
                }
            });
        }

        let model: ProfileModel = new ProfileModel();

        model.action = 'updateBackOrder';
        model.business = db_name;
        model.id = profile_id;
        model.backOrder = JSON.stringify(backOrder);
        let result: any = await ProfileProcedure(model);

        if (!result.id) {
            responseModel.message = "Ocurrio un error al actualizar tu lista de deseos";
            response.json(responseModel);
        }

        responseModel.status = 1;
        responseModel.data = {value: !!exist.length};
        responseModel.message = "Lista de deseos actualizados";
        response.json(responseModel);

    } catch (e) {
        logger.error(e);
        responseModel.message = "Ocurrio un error al actualizar tu lista de deseos";
        response.json(responseModel);
    }
}

export async function deleteBackOrder(request: Request, response: Response) {
    const {db_name} = response.locals.business;
    const {profile_id} = response.locals.user;
    const {item, deleteAll} = request.body;
    const responseModel = new ResponseModel();

    try {
        let profile: any = await getProfile(request, response, true);
        if (!profile.status) {
            responseModel.message = "Ocurrio un error al eliminar el producto de tu lista de deseos";
            response.json(responseModel);
            return;
        }
        profile = profile.data;

        let backOrder = profile.backOrder || [];


        let newItems = backOrder.filter((itemFilter: any) => {
            return (itemFilter.ItemCode != item.ItemCode)
        });

        if(deleteAll){
            newItems = [];
        }

        let model: ProfileModel = new ProfileModel();

        model.action = 'updateBackOrder';
        model.business = db_name;
        model.id = profile_id;
        model.backOrder = JSON.stringify(newItems);
        let result: any = await ProfileProcedure(model);

        if (!result.id) {
            responseModel.message = "Ocurrio un error al actualizartu lista de deseos";
            response.json(responseModel);
        }

        responseModel.status = 1;
        responseModel.data = {};
        responseModel.message = "lista de deseos actualizados";
        response.json(responseModel);

    } catch (e) {
        logger.error(e);
        responseModel.message = "Ocurrio un error al actualizar tu lista de deseos";
        response.json(responseModel);
    }
}
export async function removeShopping(request: Request, response: Response) {
    //recibimos las variables
    const {CardCode} = request.body;
    //console.log(CardCode);
    let model: ProfileModel = new ProfileModel();
    model.action = 'deleteShoppingCart';
    model.cardCode = CardCode;
    let responseModel = new ResponseModel();
    try {
        let result: any = await ProfileProcedure(model);
        responseModel.status = 1;
        responseModel.message = "El carrito se vacio";
        response.json(responseModel);
        return;
    } catch (error) {
        logger.error(error);
        responseModel.message = "Ocurrio un error al eliminar el carrito";
        response.json(responseModel);
        return;
    }

  }