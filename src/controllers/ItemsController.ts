import {Request, Response} from "express";
import ProductsModel from "../models/ProductsModel";
import CategoriesModel from "../models/CategoriesModel";
import ProductsProcedure from "../procedures/ProductsProcedure";
import CategoriesProcedure from "../procedures/CategoriesProcedure";
import ResponseModel from "../models/ResponseModel";
import {getProfile} from "./ProfileController";
import {getTaxes, getSpecialPrices, getValidationSpecialPrices} from "./CatalogsController";
import { exists } from "fs";
import { logger } from "../util/logger";
import moment from 'moment';
import DiscountSpecial from "../procedures/DiscountSpecial";

let fs = require('fs');
let path = require('path');


export async function searchByKey(request: Request, response: Response): Promise<void> {
    let {db_name, currency, localLanguage, priceList} = response.locals.business;
    // const {wareHouse} = response.locals.business;
    let responseModel = new ResponseModel();
    // let {key} = request.params;

    let {key, whs, page, uniqueFilter,view,shoppingCartPublic} = request.body.key;
    let {CardCode, ListNum, wareHouse} = response.locals.user;

    const resultTaxes: any = await getTaxes(request, response, true);
    if (!resultTaxes.status) {
        responseModel.message = "ocurrio un error al traer los productos";
        response.json(responseModel);
        return;
    }

    let actionFilter = '';
    let valueFilter = '';
    let value2Filter = '';
    if(uniqueFilter){
        let property = uniqueFilter.property;
        let value = uniqueFilter.value;
        switch(property){
            case "categorias":
                actionFilter = 'categorias';
                valueFilter = value;
                value2Filter = '';
            break;
            case "marca":
                actionFilter = 'marca';
                valueFilter = value;
                value2Filter = '';
            break;
            case "fabrica":
                actionFilter = 'fabrica';
                valueFilter = value;
                value2Filter = '';
            break;
            case "aparato":
                actionFilter = 'aparato';
                valueFilter = value;
                value2Filter = '';
            break;
            case "refaccion":
                actionFilter = 'refaccion';
                valueFilter = value;
                value2Filter = '';
            break;
            /*case "stock":
                actionFilter = 'stock';
                valueFilter = value;
                value2Filter = '';
            break;*/
            case "precio":
                actionFilter = 'precio';
                valueFilter = value;
                value2Filter = uniqueFilter.value2;
            break;

            default: 
                actionFilter = '';
                valueFilter = '';
                value2Filter = '';
        }
    }

    let viewField: any = '';
    let topItems: any =  '';

    if(view){
        // let newView = JSON.parse(view);   
        let newView = view;

        if(newView == 'promocion'){ //Promocion
            viewField ='U_FMB_Handel_Promo';
        }else if(newView === 'masvendidos'){ //Novedades
            viewField ='U_FMB_Handel_Remate';
        }else if(newView === 'nuevosproductos'){// MAS BUSCADOS
            topItems ='remates';
        } else if(newView === 'remates'){ //NUEVAMENTE DISPONIBLE
            viewField ='U_FMB_Handel_Nuevo';
        }
        key = 'FindAll';
    }

    if (currency === 'MXP') {
        currency = 'MXN';
    }

    try {
        // Create model
        let model: ProductsModel = new ProductsModel();

        // key = key.replace(/['%;]/g, '');
        key = key.replace(/[']/g, "''''");
        model.action = 'searchByKey';
        model.business = db_name;
        model.cardCode = CardCode;
        model.wareHouse = wareHouse;
        model.key = key;
        model.nextNumber = page || 0; 
        model.actionFilter = actionFilter || '';
        model.valueFilter = valueFilter || '';
        model.value2Filter = value2Filter || '';
        model.view = viewField || '';
        model.topItems = topItems || '';
        const results = await ProductsProcedure(model);

        // Filtros de SideBar (Todos los Items)
        model.action = 'searchByKey1';
        model.business = db_name;
        model.cardCode = CardCode;
        model.wareHouse = wareHouse;
        model.key = key;
        model.nextNumber = 99999; 
        model.actionFilter = actionFilter || '';
        model.valueFilter = valueFilter || '';
        model.value2Filter = value2Filter || '';
        model.view = viewField || '';
        model.topItems = topItems || '';
        const results2 = await ProductsProcedure(model);
        let totalRows = results2[0] ? results2.length : 0;
       
        // if(totalRows){
        //     results = totalRows > 50 ? results2.slice((page || 0), page + 50) : results2;
        // } 
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

        

        let tax = resultTaxes.data.Rate;
        let min = 0;
        let max = 0;
        let itemsCategoryArray : any = [];
        let resultCategories : any = [];
        let itemsFacilityArray : any = [];
        // Items con paginacion (50)
        for (let index = 0; index < results.length; index++) {
            const item = results[index];
                
            
            let favorite = favorites.filter((favorite: any) => {
                return (favorite.ItemCode == item.ItemCode)
            });

            let cart = shoppingCart.filter((shopping: any) => {
                return (shopping.ItemCode == item.ItemCode)
            });

            let back = backOrder.filter((shopping: any) => {
                return (shopping.ItemCode == item.ItemCode)
            });
            //Almacenes lista de promociones
            // item.WhsCode = cart.length ? cart[0].WhsCode : item.WhsCode;
            // let model1 : ProductsModel = new ProductsModel();
            // model1.action = 'searchWhs';
            // model1.business = db_name;
            // model1.cardCode = CardCode;
            // model1.wareHouse = wareHouse;
            // model1.quantity = 0;
            // model1.itemCode = item.ItemCode;
            // let WhsList1 = await ProductsProcedure(model1);
            //     let OnHandelPrincipal1 = WhsList1.filter((WhsList: any) => {
            //     return (WhsList.WhsCode == item.WhsCode && WhsList.itemCode == item.ItemCode)
            // });
            // item.WhsList = WhsList1;
            //Almacenes lista de promociones
            item.localLanguage = localLanguage;
            item.favorite = !!favorite.length;
            item.backOrder = !!back.length;
            item.quantity = cart.length ? cart[0].quantity : '1';
            // item.quantity = cart.length ? cart[0].quantity : ((parseInt(OnHandelPrincipal1[0].OnHand) > 0) || (item.OnHandPrincipal > 0) ? 1 : "0" );
            item.taxRate = tax;

            // Cambiamos los valores del almcen segun el stock
            // if(item.MaximoStock <= 0){
            //     item.OnHandPrincipal = 0;
            //     item.flag = 'red';
            // } else {
            //     item.flag = 'green';
            // }

            if(item.OnHandPrincipal<= 0){
                item.OnHandPrincipal = 0;
                item.flag = 'red';
            } else {
                item.flag = 'green';
            }
            // Special Prices Validation
            //########################################################################################################################
            let priceItem = -1;
            let discount = -1;
            let priceBeforeDisc: any = -1;

            item.QuantitySpecial = cart.length ? cart[0].quantity : 1;
        
           // const DiscountSpecials:any = await DiscountSpecial(CardCode,item.ItemCode,1);

            if(parseFloat(item.Discount) !== 0){
                item.DiscountPercentSpecial = parseFloat(item.Discount)
                // DESCOMENTAR SI QUEREMOS QUE TODOS LOS ARTICULOS CON DESCUENTOS TENGAN LA ETIQUETA DE PROMOCIÓN 
                priceItem = parseFloat(item.PrecioFinal);
                discount = parseFloat(item.Discount || 0);
                priceBeforeDisc = ((100 * priceItem) / (100 - discount)).toFixed(2);
            }else{
                item.DiscountPercentSpecial = 0;
            }
            item.Price = Number(item.PrecioFinal).toFixed(2);
            // Precios por descuentos especiales
            if(priceBeforeDisc != -1){
                if(item.IsGrossPrc === 'Y'){
                    let decimalesUno = 1 + (item.taxRate / 100);
                    item.Price = Number(priceItem/decimalesUno).toFixed(2);
                }
                item.PriceBeforeDiscount = Number(priceBeforeDisc);
                item.PriceTaxBeforeDiscount = Number(((item.PriceBeforeDiscount * (item.taxRate / 100)) + item.PriceBeforeDiscount).toFixed(2));
            }else{
                if(item.IsGrossPrc === 'Y'){
                    let decimalesUno = 1 + (item.taxRate / 100);
                    item.Price = Number(item.PrecioFinal/decimalesUno).toFixed(2);
                }
            }
            //#######################################################################################################################

            item.priceTax = Number((parseFloat((item.Price * (item.taxRate / 100)) + item.Price)).toFixed(2));
            item.PriceECommerce = item.PriceECommerce;
            item.U_FMB_Handel_Show100 = item.U_FMB_Handel_Show100;
            item.PriceTaxECommerce = Number((parseFloat((item.PriceECommerce * (item.taxRate / 100)) + item.PriceECommerce)).toFixed(2));
            // item.OnHandPrincipal = OnHandelPrincipal1.length ? OnHandelPrincipal1[0].OnHand : item.OnHandPrincipal;
        }
        // Items and filters
        for (let index = 0; index < results2.length; index++) {
            const item = results2[index];
            
            item.taxRate = tax;
            item.priceTax = Number((parseFloat((item.Price * (item.taxRate / 100)) + item.Price)).toFixed(2));

            // SideBar Precios
            let U_Handel_Tags:any = '';
            let U_Handel_Tags_Name:any = '';
            min = index === 0 ? results[0].priceTax : (item.priceTax < min) ? item.priceTax : min;
            max = index === 0 ? results[0].priceTax : (item.priceTax > max) ? item.priceTax : max;

            let categoSearch = item.categoSearch || [];
            categoSearch = categoSearch.split(',');
            let names = item.Names || [];
            names = names.split(',');

            
            for (let index = 0; index < categoSearch.length; index++) {
                const element = categoSearch[index];
                if(element !== '' && element != null && element != ','){
                    U_Handel_Tags += element+',';
                    U_Handel_Tags_Name += names[index]+',';
                }
            }

            U_Handel_Tags = U_Handel_Tags.substring(0, U_Handel_Tags.length - 1);
            U_Handel_Tags_Name = U_Handel_Tags_Name.substring(0, U_Handel_Tags_Name.length - 1);
            item.categoryName = U_Handel_Tags_Name;

            let data = {
                U_Handel_Tags,
                U_Handel_Tags_Name,
                categoSearch: item.categoSearch
            }
            resultCategories.push(data);
            itemsCategoryArray.push(U_Handel_Tags);
            // SideBar Fabrica
            itemsFacilityArray.push(item.U_FMB_Handel_Fabrica);
        }

        // ----------------------------- CATEGORIAS -------------------------------
        // Unir diferentes array dentro de uno solo
        let joinedItemCatArray = [].concat(...itemsCategoryArray).sort();        
        let finalJoinedItemCatArray : any = [];
        let current = null;
        let count = 0;

        for (let i = 0; i < joinedItemCatArray.length; i++) {
            if(joinedItemCatArray[i] !== '' && joinedItemCatArray[i] !== null){
                if (joinedItemCatArray[i] !== current) {
                    if (count > 0 && current != null) {
                        finalJoinedItemCatArray.push({category : current, times : count});
                    }
                    current = joinedItemCatArray[i];
                    count = 1;
                } else {
                    count++;
                }
            }
        }
        if (count > 0) {
            finalJoinedItemCatArray.push({category : current, times : count});
        }


        // ----------------------------- FABRICA -------------------------------
        itemsFacilityArray = itemsFacilityArray.sort();
        let finalItemsFacilityArray : any = [];
        current = null;
        count = 0;

        for (let i = 0; i < itemsFacilityArray.length; i++) {
            if(itemsFacilityArray[i] !== '' && itemsFacilityArray[i] !== null){
                if (itemsFacilityArray[i] !== current) {
                    if (count > 0 && current != null) {
                        finalItemsFacilityArray.push({ facility : current, times : count });
                    }
                    current = itemsFacilityArray[i];
                    count = 1;
                } else {
                    count++;
                }
            }
        }
        if (count > 0) {
            finalItemsFacilityArray.push({ facility : current, times : count });
        }

        // Asignar nombres de categorías        
        for (let index = 0; index < finalJoinedItemCatArray.length; index++) {
            const items = finalJoinedItemCatArray[index];
            if(items.category){
                for (let index = 0; index < resultCategories.length; index++) {
                    const category = resultCategories[index];
                    if (items.category === category.U_Handel_Tags){
                        items.categoryName = category.U_Handel_Tags_Name;
                        items.categoSearch = category.categoSearch;
                    }
                }
            }
        }


        let allCategories = {
            pricesSideBar: { min: min || 0, max: max || 0},
            itemsCategories: finalJoinedItemCatArray,
            itemsBrands: [],
            itemsFacilities: finalItemsFacilityArray,
            itemsDevices: [],
            itemsSpareParts: []
        };

        // results -> Todos los articulos, totalRows -> Length de coincidencias, prices -> Precios max y min, itemCateg -> categorias
        // itemsBrands -> Marcas, itemsFacilities -> Fabrica, itemsDevices -> Aparatos, itemsSpareParts -> Refacciones
console.log('con>#########################################', );
        responseModel.data = { results, totalRows, allCategories };
        responseModel.message = 'Productos';
        responseModel.status = 1
    } catch (e) {
        logger.error(`${e}`);
        responseModel.message = "ocurrio un error al traer los productos por busqueda";
    }
    response.json(responseModel);
}

function sortDynamicCategories(property:any,order:any) {
    let sort_order = 1;
    if(order === "desc"){
        sort_order = -1;
    }
    return function (a:any, b:any){
        if(a[property] < b[property]){
            return -1 * sort_order;
        } else if(a[property] > b[property]){
            return 1 * sort_order;
        }else{
            return 0 * sort_order;
        }
    }
}

export async function searchByCategory(request: Request, response: Response): Promise<void> {
    let {db_name, currency, localLanguage, priceList} = response.locals.business;
    // const {wareHouse} = response.locals.business;
    let responseModel = new ResponseModel();
    let {category} = request.params;
    let {key} = request.params;
    let {shoppingCartPublic, whs, page, view}:any = request.query;

    let {CardCode, ListNum, wareHouse} = response.locals.user;

    if (currency === 'MXP') {
        currency = 'MXN';
    }

    try {
        // Create model
        let model: ProductsModel = new ProductsModel();
        // Items con paginacion (50)
        model.action = 'searchByCategory';
        model.business = db_name;
        model.cardCode = CardCode;
        model.wareHouse = wareHouse;
        model.key = category;
        model.nextNumber = page || 0;
        model.view = view != 'null' ? view : '' ;
        let results = await ProductsProcedure(model);
        
       // // Filtros de SideBar (Todos los Items)
       model.action = 'searchByCategory';
       model.business = db_name;
       model.cardCode = CardCode;
       model.wareHouse = wareHouse;
       model.key = category;
       model.nextNumber = 99999; 
       // Call procedure
       let results2 = await ProductsProcedure(model);
       let totalRows = results2[0] ? results2.length : 0;

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

        let min = 0;
        let max = 0;
        // let available = 0;
        // let missing = 0;
        let itemsCategoryArray : any = [];
        let resultCategories : any = [];
        let itemsFacilityArray : any = [];

        // Special Pricess Full Query
        let ValidationSpecialPrices : any = false;
           // // Lista de precios
        let PriceList = ListNum && ListNum !== '' ? ListNum : priceList;

        let validateActivationSpecialPrices: any = await getValidationSpecialPrices(request, response, true);
        
        if (validateActivationSpecialPrices.status === 1 && validateActivationSpecialPrices.data == 1) {
            ValidationSpecialPrices = true;
        } 

        // results.map((item: any, index : Number) => {
        for (let index = 0; index < results.length; index++) {
            const item = results[index];
    

            let favorite = favorites.filter((favorite: any) => {
                return (favorite.ItemCode == item.ItemCode)
            });

            let cart = shoppingCart.filter((shopping: any) => {
                return (shopping.ItemCode == item.ItemCode)
            });

            let back = backOrder.filter((shopping: any) => {
                return (shopping.ItemCode == item.ItemCode)
            });

            // Special Prices Validation
            //########################################################################################################################
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
        
            // const DiscountSpecials = await DiscountSpecial(CardCode,item.ItemCode,1);
            // item.DiscountPercentSpecial = parseFloat(DiscountSpecials[0].DescuentoFinal || 0)
            // DESCOMENTAR SI QUEREMOS QUE TODOS LOS ARTICULOS CON DESCUENTOS TENGAN LA ETIQUETA DE PROMOCIÓN 
            // item.U_FMB_Handel_Promo = DiscountSpecials[0].DescuentoFinal !== 0 ? 1 : 0;
            // priceItem = parseFloat(DiscountSpecials[0].PrecioFinal);
            // discount = parseFloat(DiscountSpecials[0].DescuentoFinal || 0);
            // priceBeforeDisc = ((100 * priceItem) / (100 - discount)).toFixed(2);
            //#######################################################################################################################

            if(parseFloat(item.Discount) !== 0){
                item.DiscountPercentSpecial = parseFloat(item.Discount)
                // DESCOMENTAR SI QUEREMOS QUE TODOS LOS ARTICULOS CON DESCUENTOS TENGAN LA ETIQUETA DE PROMOCIÓN 
                priceItem = parseFloat(item.PrecioFinal);
                discount = parseFloat(item.Discount || 0);
                priceBeforeDisc = ((100 * priceItem) / (100 - discount)).toFixed(2);
            }else{
                item.DiscountPercentSpecial = 0;
            }
            // Almacenes lista de promociones
            // item.WhsCode = cart.length ? cart[0].WhsCode : item.WhsCode;
            // let model1 : ProductsModel = new ProductsModel();
            // model1.action = 'searchWhs';
            // model1.business = db_name;
            // model1.cardCode = CardCode;
            // model1.wareHouse = wareHouse;
            // model1.quantity = 0;
            // model1.itemCode = item.ItemCode;
            // let WhsList1 = await ProductsProcedure(model1);
            //     let OnHandelPrincipal1 = WhsList1.filter((WhsList: any) => {
            //     return (WhsList.WhsCode == item.WhsCode && WhsList.itemCode == item.ItemCode)
            // });
            // item.WhsList = WhsList1;
            // Almacenes lista de promociones
            item.currency = currency;
            item.localLanguage = localLanguage;
            item.favorite = !!favorite.length;
            item.backOrder = !!back.length;
            // item.quantity = cart.length ? cart[0].quantity : ((parseInt(OnHandelPrincipal1[0].OnHand) > 0) || (item.OnHandPrincipal > 0) ? 1 : "0" );
            item.quantity = cart.length ? cart[0].quantity : '1';
            item.taxRate = tax;
            item.Price = Number(item.PrecioFinal).toFixed(2);
            // Precios por descuentos especiales
            if(priceBeforeDisc != -1){
                if(item.IsGrossPrc === 'Y'){
                    let decimalesUno = 1 + (item.taxRate / 100);
                    item.Price = Number(priceItem/decimalesUno).toFixed(2);
                }
                item.PriceBeforeDiscount = Number(priceBeforeDisc);
                item.PriceTaxBeforeDiscount = Number(((item.PriceBeforeDiscount * (item.taxRate / 100)) + item.PriceBeforeDiscount).toFixed(2));
            }else{
                if(item.IsGrossPrc === 'Y'){
                    let decimalesUno = 1 + (item.taxRate / 100);
                    item.Price = Number(item.PrecioFinal/decimalesUno).toFixed(2);
                }
            }
            item.priceTax = Number((parseFloat((item.Price * (item.taxRate / 100)) + item.Price)).toFixed(2));
            
            item.PriceECommerce = item.PriceECommerce;
            item.U_FMB_Handel_Show100 = item.U_FMB_Handel_Show100;
            item.PriceTaxECommerce = Number(parseFloat(((item.PriceECommerce * (item.taxRate / 100)) + item.PriceECommerce)).toFixed(2))
            // Cambiamos los valores del almcen segun el stock
            if(item.OnHandPrincipal <= 0){
                item.OnHandPrincipal = 0;
                item.flag = 'red';
            } else {
                item.flag = 'green';
            }
            // item.OnHandPrincipal = OnHandelPrincipal1.length ? OnHandelPrincipal1[0].OnHand : item.OnHandPrincipal;
        }

        results2.map((item: any, index : Number) => {

            let favorite = favorites.filter((favorite: any) => {
                return (favorite.ItemCode == item.ItemCode)
            });

            let cart = shoppingCart.filter((shopping: any) => {
                return (shopping.ItemCode == item.ItemCode)
            });

            let back = backOrder.filter((shopping: any) => {
                return (shopping.ItemCode == item.ItemCode)
            });

            item.currency = currency;
            item.localLanguage = localLanguage;
            item.favorite = !!favorite.length;
            item.backOrder = !!back.length;
            item.quantity = cart.length ? cart[0].quantity : '';
            item.taxRate = tax;
            item.priceTax = Number((parseFloat((item.Price * (item.taxRate / 100)) + item.Price)).toFixed(2));

            // SideBar Precios
            let U_Handel_Tags:any = '';
            let U_Handel_Tags_Name:any = '';
            min = index === 0 ? results[0].priceTax : (item.priceTax < min) ? item.priceTax : min;
            max = index === 0 ? results[0].priceTax : (item.priceTax > max) ? item.priceTax : max;

           let categoSearch = item.categoSearch || [];
            categoSearch = categoSearch.split(',');
            let names = item.Names || [];
            names = names.split(',');

            
            for (let index = 0; index < categoSearch.length; index++) {
                const element = categoSearch[index];
                if(element !== '' && element != null && element != ','){
                    U_Handel_Tags += element+',';
                    U_Handel_Tags_Name += names[index]+',';
                }
            }
            U_Handel_Tags = U_Handel_Tags.substring(0, U_Handel_Tags.length - 1);
            U_Handel_Tags_Name = U_Handel_Tags_Name.substring(0, U_Handel_Tags_Name.length - 1);
            item.categoryName = U_Handel_Tags_Name;

            let data = {
                U_Handel_Tags,
                U_Handel_Tags_Name,
                categoSearch: item.categoSearch
            }
            resultCategories.push(data);
            itemsCategoryArray.push(U_Handel_Tags);
            // SideBar Fabrica
            itemsFacilityArray.push(item.U_FMB_Handel_Fabrica);
        });

        // ----------------------------- CATEGORIAS -------------------------------
        // Unir diferentes array dentro de uno solo
        let joinedItemCatArray = [].concat(...itemsCategoryArray).sort();        
        let finalJoinedItemCatArray : any = [];
        let current = null;
        let count = 0;
        for (let i = 0; i < joinedItemCatArray.length; i++) {
            if(joinedItemCatArray[i] !== '' && joinedItemCatArray[i] !== null){
                if (joinedItemCatArray[i] !== current) {
                    if (count > 0 && current != null) {
                        finalJoinedItemCatArray.push({category : current, times : count});
                    }
                    current = joinedItemCatArray[i];
                    count = 1;
                } else {
                    count++;
                }
            }
        }
        if (count > 0) {
            finalJoinedItemCatArray.push({category : current, times : count});
        }

        // ----------------------------- FABRICA -------------------------------
        itemsFacilityArray = itemsFacilityArray.sort();
        let finalItemsFacilityArray : any = [];
        current = null;
        count = 0;
        for (let i = 0; i < itemsFacilityArray.length; i++) {
            if(itemsFacilityArray[i] !== '' && itemsFacilityArray[i] !== null){
                if (itemsFacilityArray[i] !== current) {
                    if (count > 0 && current != null) {
                        finalItemsFacilityArray.push({ facility : current, times : count });
                    }
                    current = itemsFacilityArray[i];
                    count = 1;
                } else {
                    count++;
                }
            }
        }
        if (count > 0) {
            finalItemsFacilityArray.push({ facility : current, times : count });
        }

        // Asignar nombres de categorías        
        finalJoinedItemCatArray.map((items: any) => {
            if(items.category){
                for (let index = 0; index < resultCategories.length; index++) {
                    const category = resultCategories[index];
                    if (items.category === category.U_Handel_Tags){
                        items.categoryName = category.U_Handel_Tags_Name;
                        items.categoSearch = category.categoSearch;

                        
                    }
                }
            }
        });

        let allCategories = {
            pricesSideBar: { min: min, max: max },
            // stock: { available: available, missing: missing },
            itemsCategories: finalJoinedItemCatArray,
            itemsBrands: [],
            itemsFacilities: finalItemsFacilityArray,
            itemsDevices: [],
            itemsSpareParts: []
        };

        // results -> Todos los articulos, totalRows -> Length de coincidencias, prices -> Precios max y min, itemCateg -> categorias
        // itemsBrands -> Marcas, itemsFacilities -> Fabrica, itemsDevices -> Aparatos, itemsSpareParts -> Refacciones
        responseModel.data = { results, totalRows, allCategories };
        responseModel.message = 'Productos';
        responseModel.status = 1
    } catch (e) {
       logger.error(`${e}`);
        responseModel.message = "ocurrio un error al traer los productos por categoria";
    }

    response.json(responseModel);
}

export async function getItemDetails(request: Request, response: Response): Promise<void> {
    let {db_name, currency, localLanguage, priceList, type} = response.locals.business;
    //const {wareHouse} = response.locals.business;
    let responseModel = new ResponseModel();
    let {itemCode} = request.params;
    let alias = decodeURIComponent(itemCode);
    let {CardCode, ListNum, wareHouse} = response.locals.user;
    let {shoppingCartPublic}:any = request.query;
    alias = alias.replace(/['%;]/g, '');
    let arrayValue = alias.split("~");
    if(arrayValue.length >= 1){
        alias = alias.replace(/[~]/g, "/");
    }
    
    if (currency === 'MXP') {
        currency = 'MXN';
    }

    try {
        // Create model
        let model: ProductsModel = new ProductsModel();

        if(type === 'SQL'){
            model.itemCode = `'${alias}'`;
        }else{
            model.itemCode = `''${alias}''`; 
        }

        model.action = 'findOne';
        model.business = db_name;
        model.cardCode = CardCode;
        model.wareHouse = wareHouse || '';
        //model.itemCode = itemCode;
        

        // Call procedure
        const result = await ProductsProcedure(model);

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
           // // Lista de precios
        let PriceList = ListNum && ListNum !== '' ? ListNum : priceList;

        let validateActivationSpecialPrices: any = await getValidationSpecialPrices(request, response, true);
        
        if (validateActivationSpecialPrices.status === 1 && validateActivationSpecialPrices.data == 1) {
            ValidationSpecialPrices = true;
        } 

        // Todas las promos en caso de que caiga en cantidad (Para ItemDetails)
        let quantityPromoSN : any = [];
        let quantityPromoPriceList : any = [];

        // result.map((item: any) => {
        for (let index = 0; index < result.length; index++) {
            const item = result[index];
            
            
            let favorite = favorites.filter((favorite: any) => {
                return (favorite.ItemCode == item.ItemCode)
            });

            let cart = shoppingCart.filter((shopping: any) => {
                return (shopping.ItemCode == item.ItemCode)
            });

            let back = backOrder.filter((shopping: any) => {
                return (shopping.ItemCode == item.ItemCode)
            });

            // Special Prices Validation
            //########################################################################################################################
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
        
            // const DiscountSpecials = await DiscountSpecial(CardCode,item.ItemCode,1);
            // item.DiscountPercentSpecial = parseFloat(DiscountSpecials[0].DescuentoFinal || 0)
            // DESCOMENTAR SI QUEREMOS QUE TODOS LOS ARTICULOS CON DESCUENTOS TENGAN LA ETIQUETA DE PROMOCIÓN 
            // item.U_FMB_Handel_Promo = DiscountSpecials[0].DescuentoFinal !== 0 ? 1 : 0;
            // priceItem = parseFloat(DiscountSpecials[0].PrecioFinal);
            // discount = parseFloat(DiscountSpecials[0].DescuentoFinal || 0);
            // priceBeforeDisc = ((100 * priceItem) / (100 - discount)).toFixed(2);            
            //#######################################################################################################################
            if(parseFloat(item.Discount) !== 0){
                item.DiscountPercentSpecial = parseFloat(item.Discount)
                // DESCOMENTAR SI QUEREMOS QUE TODOS LOS ARTICULOS CON DESCUENTOS TENGAN LA ETIQUETA DE PROMOCIÓN 
                priceItem = parseFloat(item.PrecioFinal);
                discount = parseFloat(item.Discount || 0);
                priceBeforeDisc = ((100 * priceItem) / (100 - discount)).toFixed(2);
            }else{
                item.DiscountPercentSpecial = 0;
            }
            //Almacenes lista de promociones
            // item.WhsCode = cart.length ? cart[0].WhsCode : item.WhsCode;
            // let model1 : ProductsModel = new ProductsModel();
            // model1.action = 'searchWhs';
            // model1.business = db_name;
            // model1.cardCode = CardCode;
            // model1.wareHouse = wareHouse;
            // model1.quantity = 0;
            // model1.itemCode = item.ItemCode;
            // let WhsList1 = await ProductsProcedure(model1);
            //     let OnHandelPrincipal1 = WhsList1.filter((WhsList: any) => {
            //     return (WhsList.WhsCode == item.WhsCode && WhsList.itemCode == item.ItemCode)
            // });
            // item.WhsList = WhsList1;
            //Almacenes lista de promociones            
            item.currency = currency;
            item.localLanguage = localLanguage;
            item.favorite = !!favorite.length;
            item.backOrder = !!back.length;
            // item.quantity = cart.length ? cart[0].quantity : ((parseInt(OnHandelPrincipal1[0].OnHand) > 0) || (item.OnHandPrincipal > 0) ? 1 : "0" );
            item.quantity = cart.length ? cart[0].quantity : '';
            item.taxRate = tax;
            // Precios por descuentos especiales
            item.Price = Number(item.PrecioFinal).toFixed(2);
            // Precios por descuentos especiales
            if(priceBeforeDisc != -1){
                if(item.IsGrossPrc === 'Y'){
                    let decimalesUno = 1 + (item.taxRate / 100);
                    item.Price = Number(priceItem/decimalesUno).toFixed(2);
                }
                item.PriceBeforeDiscount = Number(priceBeforeDisc);
                item.PriceTaxBeforeDiscount = Number(((item.PriceBeforeDiscount * (item.taxRate / 100)) + item.PriceBeforeDiscount).toFixed(2));
            }else{
                if(item.IsGrossPrc === 'Y'){
                    let decimalesUno = 1 + (item.taxRate / 100);
                    item.Price = Number(item.PrecioFinal/decimalesUno).toFixed(2);
                }
            }
            item.priceTax = Number((parseFloat((item.Price * (item.taxRate / 100)) + item.Price)).toFixed(2));
            item.PriceECommerce = item.PriceECommerce;
            item.U_FMB_Handel_Show100 = item.U_FMB_Handel_Show100;
            item.UserPriceDetailsView = item.UserPriceDetailsView;
            item.PriceTaxECommerce = Number(parseFloat(((item.PriceECommerce * (item.taxRate / 100)) + item.PriceECommerce)).toFixed(2))
            // Cambiamos los valores del almcen segun el stock
            if(item.MaximoStock <= 0){
                item.OnHandPrincipal = 0;
                item.flag = 'red';
            } else {
                item.flag = 'green';
            }
            // item.OnHandPrincipal = OnHandelPrincipal1.length ? OnHandelPrincipal1[0].OnHand : item.OnHandPrincipal;
        }
        responseModel.data = result[0] || {};
        responseModel.message = 'Producto';
        responseModel.status = 1
    } catch (e) {
       logger.error(e);
        responseModel.message = "ocurrio un error al traer el detalle del producto";
    }

    response.json(responseModel);
}

export async function getCategories(request: Request, response: Response): Promise<void> {
    let {db_name} = response.locals.business;
    let responseModel = new ResponseModel();

    try {
        let model: CategoriesModel = new CategoriesModel();

        const getChildren: any = (categories: any, father: any, search: string) => {
            let newChildren: any = [];
         
            for (let i = 0; i < categories.length; i++) {
                if (categories[i].U_Parent) {
                    if (categories[i].parentArray.includes(father.Code)) {
                        let newSearch = search + ',' + categories[i].Code;
                        let children = getChildren(categories, categories[i], newSearch);
                        newChildren.push({
                            category: {
                                code: categories[i].Code,
                                name: categories[i].Name,
                                search: newSearch,
                                enabled: !(!!children.length)
                            },
                            children: children
                        });
                    }
                }
            }

            return newChildren;
        };


        model.action = 'findAll';
        model.business = db_name;
        let result = await CategoriesProcedure(model);

        result.map((category: any) => {
            let parentArray = category.U_Parent || '';
            parentArray = parentArray.split('|');
            category.parentArray = parentArray;
        });
        // get first father array
        let newCategories: any = [];
        for (let i = 0; i < result.length; i++) {
            if (!result[i].U_Parent) {
                let children = getChildren(result, result[i], result[i].Code);
                newCategories.push({
                    category: {code: result[i].Code, name: result[i].Name, search: result[i].Code, enabled: !(!!children.length)},
                    children: children
                });
            }
        }
        responseModel.status = 1;
        responseModel.message = 'lista de categorias';
        responseModel.data = {categories: newCategories};

        response.json(responseModel);
        return;
    } catch (e) {
      logger.error("e", e);
    }
    response.json(responseModel)
}

export async function getImage(request: Request, response: Response): Promise<void> {
    let responseModel = new ResponseModel();
    let {itemCode} = request.params;
    try {
        // Create model
        let exists = fs.existsSync('./images/' + itemCode);
        if (exists) {
            response.sendFile(path.resolve('./images/' + itemCode));
            return;
        }
        response.sendFile(path.resolve('./images/noImage.png'));
    } catch (e) {
       logger.error(e);
        responseModel.message = "ocurrio un error al traer la imagen del producto";
        response.json(responseModel);
    }
}

export async function getImageCategories(request: Request, response: Response): Promise<void> {
    let responseModel = new ResponseModel();
    let {itemCode} = request.params;
    try {
        // Create model
        let exists = fs.existsSync('./categories/' + itemCode);
        if (exists) {
            response.sendFile(path.resolve('./categories/' + itemCode));
            return;
        }
        response.sendFile(path.resolve('./images/noImage.png'));
    } catch (e) {
       logger.error(e);
        responseModel.message = "ocurrio un error al traer la imagen del producto";
        response.json(responseModel);
    }
}

export async function getPolitics(request: Request, response: Response): Promise<void> {
    let responseModel = new ResponseModel();
    let {itemCode} = request.params;
    try {
        // Create model
        let exists = fs.existsSync('./politicas/' + itemCode);
        if (exists) {
            response.sendFile(path.resolve('./politicas/' + itemCode));
            return;
        }
        response.sendFile(path.resolve('./images/noImage.png'));
    } catch (e) {
       logger.error(e);
        responseModel.message = "ocurrio un error al traer la imagen del producto";
        response.json(responseModel);
    }
}

export async function getFile(request: Request, response: Response): Promise<void> {
    let responseModel = new ResponseModel();
    try {
        let {file} = request.params;
        let exists = fs.existsSync('./files/' + file);
        if (exists) {
            response.sendFile(path.resolve('./files/' + file));
            return;
        }
        responseModel.message = "El archivo no existe";
        response.json(responseModel);
    } catch (e) {
      logger.error(e);
        responseModel.message = "ocurrio un error al traer el archivo";
        response.json(responseModel);
    }
}

export async function getBillspdf(request: Request, response: Response): Promise<void> {
    let responseModel = new ResponseModel();
    let {docEntry} = request.params;
    try {
        // Create model
        let exists = fs.existsSync('./facturas/' + docEntry+'.pdf');
        if (exists) {
            response.sendFile(path.resolve('./facturas/' + docEntry+'.pdf'));
            return;
        }
        response.sendFile(path.resolve('./images/noImage.png'));
    } catch (e) {
       logger.error(e);
        responseModel.message = "ocurrio un error al traer la factura del cliente";
        response.json(responseModel);
    }
}

export async function getBillsxml(request: Request, response: Response): Promise<void> {
    let responseModel = new ResponseModel();
    let {docEntry} = request.params;
    try {
        // Create model
        let exists = fs.existsSync('./facturas/' + docEntry+'.xml');
        if (exists) {
            response.sendFile(path.resolve('./facturas/' + docEntry+'.xml'));
            return;
        }
        response.sendFile(path.resolve('./images/noImage.png'));
    } catch (e) {
       logger.error(e);
        responseModel.message = "ocurrio un error al traer la factura del cliente";
        response.json(responseModel);
    }
}

export async function getCategoriesRocha(request: Request, response: Response): Promise<void> {
    let {db_name} = response.locals.business;
    let responseModel = new ResponseModel();

    try {
        let model: CategoriesModel = new CategoriesModel();

        model.action = 'findAll';
        model.business = db_name;
        let result = await CategoriesProcedure(model);
        console.log('con>', result);

        result.map((category: any) => {
            let parentArray = category.U_Parent || '';
            parentArray = parentArray.split('|');
            category.parentArray = parentArray;
        });
        console.log('con>before', result[5]);



        const getChildren: any = 
        (categories: any, father: any, search: string) => {
            let newChildren: any = [];

            for (let i = 0; i < categories.length; i++) {
                if (categories[i].U_Parent) {
                    if (categories[i].parentArray.includes(father.Code)) {
                        let newSearch = search + ',' + categories[i].Code;
                        let children = getChildren(categories, categories[i], newSearch);
                        newChildren.push({
                            category: {
                                code: categories[i].Code,
                                name: categories[i].Name,
                                search: newSearch,
                                enabled: !(!!children.length)
                            },
                            children: children
                        });
                    }
                }
            }

            return newChildren;
        };

        // get first father array
        let newCategories: any = [];
        for (let i = 0; i < result.length; i++) {
            if (!result[i].U_Parent) {
                let children = getChildren(result, result[i], result[i].Code);
                newCategories.push({
                    category: {code: result[i].Code, name: result[i].Name, search: result[i].Code, enabled: !(!!children.length)},
                    children: children
                });
            }
        }

        responseModel.status = 1;
        responseModel.message = 'lista de categorias';
        responseModel.data = {categories: newCategories};

        response.json(responseModel);
        return;
    } catch (e) {
      logger.error("e", e);
    }
    response.json(responseModel)
}