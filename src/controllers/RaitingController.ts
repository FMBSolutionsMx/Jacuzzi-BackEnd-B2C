import { Response} from "express";
import moment from 'moment';
import { Request, IResult, IRecordSet } from "mssql";
import ResponseModel from "../models/ResponseModel";
import SeriesProcedure from "../procedures/SeriesProcedure";
import { DatabaseService } from "../util/database";
import { logger } from "../util/logger";
import RaitingProcedure from "../procedures/RaitingProcedure";
import SearchProcedue from "../procedures/SearchProcedure";
import SearchModel  from "../models/SearchModel";
import CatalogsProcedure from "../procedures/CatalogsProcedures";

export async function Raiting(req: any, response: Response): Promise<void> {
    const db = new DatabaseService();
    let {db_name} = response.locals.business;
    let responseModel = new ResponseModel();
    let {itemcode, cardcode, titulo, comentario, rating} = req.body;
    try {
        const result = await db.Query(`INSERT INTO [Raiting] (itemCode,cardCode,calificacion,titulo,comentario) VALUES ('${itemcode}','${cardcode}',${rating},'${titulo}','${comentario}')`);
        
        responseModel.status = 1;
        responseModel.data =  {hola: result.rowsAffected[0]};
        response.json(responseModel);
    } catch (e) {
        logger.error(e);
        responseModel.message = "Ocurrió un problema inesperado";
        response.json(responseModel);
    }
}

export async function getRaiting(req: any, response: Response): Promise<void> {
    const db = new DatabaseService();
    const { itemCode, cardCode } = req.params;
    const responseModel = new ResponseModel();
    // let localstorage = request.body.localShoppingCart;
    try {

        let result = await RaitingProcedure('selectRaiting', itemCode, '');
        let result1 = await RaitingProcedure('AVG', itemCode, '');
        let result2 = await RaitingProcedure('ALL', itemCode, '');
        let result3 = await RaitingProcedure('Comentario', itemCode, cardCode);
        let result4 = await RaitingProcedure('Top1', itemCode, cardCode);
        
        let comentar = true;
        if(result3.length === 1 && result4.length === 1 || result3.length === 0 && result4.length === 0){
            comentar = false;
        }
        if ( !result){
            responseModel.data = [];
            responseModel.message = "No se encontro algún cupón válido"
        }else{
            responseModel.data = {data : result, promedio: result1, All : result2, comentar}; // result1.recordsets[0]
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

export async function getAutoComplete(this: any, req: any, response: Response): Promise<void> {
    const {type} = response.locals.business;
    const db = new DatabaseService();
    const responseModel = new ResponseModel();
    let model = new SearchModel();
    try {        
        let U_Handel_Tags:any = '';
        let U_Handel_Tags_Name:any = '';
        let itemsCategoryArray : any = [];
        let resultCategories : any = [];
        const getChildren: any = (categories: any, father: any, search: string, ) => {
            let newChildren: any = [];
         
            for (let i = 0; i < categories.length; i++) {
                
                if (categories[i].U_Parent) {
                    if (categories[i].parentArray.includes(father.Code) && categories[i].search === father.search ) {
                        let newSearch = search + ',' + categories[i].Code;
                        let children = getChildren(categories, categories[i], newSearch);
                        newChildren.push({
                            category: {
                                code: categories[i].Code,
                                name: categories[i].Name,
                                enabled: !(!!children.length),
                                search: father.search,
                            },
                            children: children
                        });
                    }
                }
            }

            return newChildren;
        };

        let result = await RaitingProcedure('AutoComplete', '', '');
        let result2 = await RaitingProcedure('searchCategory', '', '');

        model.action = 'getCurrency';
        let currency: any = await SearchProcedue(model); 
        currency = currency ? currency[0] : ''; // No tocar se ve raro pero esta chido

        if(type === 'SQL'){
            currency = currency[0];
        }
            ///////Solis#####
        model.action = "getPackageStore";
        let packageFilter: any = await CatalogsProcedure(model);
        
        for (let index = 0; index < result2.length; index++) {
            const item = result2[index];  
            let U_Handel_Tags:any = '';
            let U_Handel_Tags_Name:any = '';

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
                categoSearch: item.categoSearch,
                categoSearchName: item.Names

            }
            resultCategories.push(data);
            itemsCategoryArray.push(U_Handel_Tags);
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

         // Asignar nombres de categorías        
        finalJoinedItemCatArray.map((items: any,index:any) => {
            if(items.category){
                for (let j = 0; j < resultCategories.length; j++) {

                    const category = resultCategories[j];
                    if (items.category === category.U_Handel_Tags){
                        items.categoryName = category.U_Handel_Tags_Name;
                        items.search = category.categoSearch;    
                        items.NameComple = category.categoSearchName;
                            
                    }
                }
            }
        });

        let newCategories: any = [];


       
        for (let index = 0; index < finalJoinedItemCatArray.length; index++) {
            const category = finalJoinedItemCatArray[index];
            // Van sin espacios ###############
            let childrenArray = category.category || '';
            childrenArray = childrenArray.split(',');
            category.childrenArray = childrenArray;

            let childrenArrayName = category.categoryName || '';
            childrenArrayName = childrenArrayName.split(',');
            category.childrenArrayName = childrenArrayName;
            // ###########################################

            // ######### Posición
            let childrenArrayPosition = category.search || '';
            childrenArrayPosition = childrenArrayPosition.split(',');
            category.childrenArrayPosition = childrenArrayPosition;

            let childrenArrayNamePos = category.NameComple || '';
            childrenArrayNamePos = childrenArrayNamePos.split(',');
            category.childrenArrayNamePos = childrenArrayNamePos;
            let search:any = null;
            let flag:any= true;
            for (let index = childrenArrayPosition.length -1; index >= 0; index--) {
                const element = childrenArrayPosition[index];
            
                if(element && flag){
                    flag = false;
                    search = index
                }                
            }
            for (let index = 0; index < childrenArrayPosition.length; index++) {
                const parent = childrenArrayPosition[index];
                if(parent){
                    let element = {
                        code: parent,
                        name: childrenArrayNamePos[index],
                        search: category.search,
                        position: index,
                        children: [],
                        choose: index === search ? true : false,
                    }
                    newCategories.push(element);
                }
                
               
            }
        }


        let newParentsArray:any = []
        for (let index = 0; index < newCategories.length; index++) { //recorrer mi arreglo de opciones
            const node = newCategories[index];
            
            let exist:any = newParentsArray.find((nextNode:any)=> nextNode.position === node.position  && nextNode.code === node.code); // Valido si mi nodo existe dentro de el nuevo arreglo

            if(!exist){ // Si no existe dentro del nuevo arreglo
                
                let filas:any =  newCategories.filter((nextNode:any)=> nextNode.search === node.search); // Filtro todos los que son de mismo search

                let padre:any = {}
                for (let index = 0; index < filas.length; index++) {  // Busco dentro de los filtrados si el nodo tiene un padre
                    const fila = filas[index];
                    if (node.position === fila.position ) {
                        padre = filas[index - 1];
                    }
                }
                if(!padre){ //Si no tiene padre se convierte en uno principal
                    node.U_Parent = null;
                    node.enabled = true;                        
                    newParentsArray.push(node);

                }else{ // si tiene padre buscamos al padre para asignarlo como hijo
                    
                    let papaUno:any = newParentsArray.find((nextNode:any)=> nextNode.position === padre.position  && nextNode.code === padre.code && nextNode.search === padre.search);//Se convierte en padre principal solo si cumple 3 condiciones
                    if(papaUno){ // si tiene un padre en el arreglo nuevo y este padre es su padre original
                        newParentsArray.push(node); // agregamos el nodo al nuevo arreglo

                        for (let index = 0; index < newParentsArray.length; index++) { //recorro el nuevo arreglo buscando al padre del nodo
                            const padre = newParentsArray[index];
                            if (papaUno.position === padre.position  && papaUno.code === padre.code && papaUno.search === padre.search) { // Si encuentro al padre origial, agrego al nodo como su hijo
                                padre.enabled = false;
                                padre.children.push(node);
                            }else{
                                node.enabled = true;
                            }
                        }
                    }else{ //Su no encuentra al padre origial, bucaremos a un nuevo padre en base a caracteristias del antiguo padre
                        
                        let papaDos:any = newParentsArray.find((nextNode:any)=> nextNode.position === padre.position  && nextNode.code === padre.code ); //Buscar padre por coincidencia al nodo original
                        if(papaDos){ //Si encintramos un padre parecido al original 
                            newParentsArray.push(node);
                            for (let index = 0; index < newParentsArray.length; index++) { //recorro el nuevo arreglo buscando al padre del nodo
                                const padre = newParentsArray[index];
                                if (papaDos.position === padre.position  && papaDos.code === padre.code ) {
                                    padre.enabled = false;
                                    padre.children.push(node);
                                }else{
                                    node.enabled = true;
                                }
                            }
                        }
                    }
                }
            }else{//Si existe el nodo en la lista
                let filas:any =  newCategories.filter((nextNode:any)=> nextNode.search === node.search); // Filtro todos los que son de mismo search
                
                let padre:any = {}
                for (let index = 0; index < filas.length; index++) {// Busco dentro de los filtrados si el nodo tiene un padre
                    const fila = filas[index];
                    if (node.position === fila.position ) {
                        padre = filas[index - 1];
                    }
                }
                
                if(padre){//Si tiene padre entro
                    let exist:any = newParentsArray.find((nextNode:any)=> nextNode.position === padre.position  && nextNode.code === padre.code && nextNode.search === padre.search); //Busco a su padre original en el nuevo arreglo
                    if(exist){ //Si encuentra a su padre original lo agrega
                        newParentsArray.push(node);

                        for (let index = 0; index < newParentsArray.length; index++) { //recorro el nuevo arreglo buscando al padre del nodo
                            const padre = newParentsArray[index];
                            if (exist.position === padre.position  && exist.code === padre.code ) { // Si encuentro al padre en el arreglo agrego a nodo como su hijo 
                                padre.enabled = false;
                                padre.children.push(node);
                            }else{
                                node.enabled = true;
                            }
                        }
                    }
                }
               
            }           

        }

        let newParents:any = [] ;
        for (let index = 0; index < newParentsArray.length; index++) {
            const element = newParentsArray[index];
            if(element.U_Parent === null){  // Filtramos solo los nodos padre
                newParents.push(element);
            }
        }


        if ( !result && !result2){
            responseModel.data = [];
            responseModel.message = "No se encontro alguna coincidencia"
            responseModel.status = 1;
        }else{
            responseModel.data = {data : result, searchCategory: newParents, currency, packageFilter}; 
            responseModel.message = "Autocomplete"
            responseModel.status = 1;
        }
        
        response.json(responseModel);
    } catch (e) {
        logger.error(""+e);
        responseModel.message = "No se encontro alguna coincidencia";
        response.json(responseModel);
    }
}

