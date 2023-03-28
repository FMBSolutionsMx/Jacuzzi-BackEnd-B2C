import { Router } from "express";
import Business from "../middleware/Business";
import Authentication from "../middleware/Authentication";
import { searchByKey, searchByCategory, getItemDetails, getCategories, getImage, getImageCategories, getPolitics, getFile, getBillspdf, getBillsxml} from "../controllers/ItemsController";
import { loginPartner, getBusinessPartnerInfo, twoStepsVerification, twoStepsMail, showPartner, createPartner, updateAddressPartner, loginOUSR, searchAccount, sendJobMail, updatePartner, jobTypes, requestCard , deleteAddressPartner} from "../controllers/UsersController";
import { loginSeller, listClient, searchClient } from "../controllers/SellerController";
import { getProfile, updateFavorites, updateShoppingCart, updateShoppingCartLocal, getShoppingCart, deleteShoppingCart, updateBackOrder, deleteBackOrder,removeShopping } from "../controllers/ProfileController";
import {infoResetPoints, insertResetPoints} from "../controllers/PointsHistoryController";
import {AuthorizationModels, createDocuments, orders, order, dataProfile, ordersSeller,SaveFileOV } from "../controllers/OrdersController";
import { billings, dataBill, getPDF, getXML } from "../controllers/BillController"
import { getCountries, getStates, getTaxes, getPackageStore, getInfoCP, getValidationSpecialPrices, updateSPStatus } from "../controllers/CatalogsController";
import { getCFDI } from '../controllers/CfdiController';
import { getFlete } from '../controllers/CatalogsController';
import { Quotation, dataQuotation, createQuotation } from '../controllers/QuotationController';
import { Delivery, dataDelivery, createDelivery } from '../controllers/DeliveryController';
import { Saved, dataSaved, dataDocument, createSavedCart } from '../controllers/SavedController';
import { Preliminary, dataPreliminary, createPreliminary } from '../controllers/PreliminaryController';
import { Collection } from '../controllers/CollectionController';
import { Overdues, OverduesTwo, OverduesThree, OverduesFour, OverduesFive } from '../controllers/OverController';
import functionControllers from '../controllers/FuctionsController';
import bannersController from '../controllers/BannerControles';
import {getBannerHome, getCategoriesHome,getProductsHome,getProductsEspecial,getSpecialPrice,ProductsEspecial} from '../controllers/FeaturedController';
import {getMarca,getFiltros,getAparato,getRefaccion,getFabricante, getProductoAdvance, getMaterial} from '../controllers/SearchController';
import {getPromo, obtenerPromocionales, getItems, searchConditions, insertPromocionales,obtenerConditions,obtenerPromocionalesDisparador, aprobarPromocionales, activarPromocionales,updatePromocionales,getPromocionales,getBonificaciones/*,getValidateWhs*/} from '../controllers/BonificacionesController';
import {getAutorizaciones, detailsAutorization, createAutorization, rejectedAutorization} from '../controllers/AutorizacionesController';
import {getDetailsPartner} from '../controllers/PartnerController';
import { itemsDeliveries, itemsInvoices, totalDeliveries, totalInvoices, itemsDeliveriesCredito, itemsInvoicesCredito , dataResumen} from '../controllers/ResumenController';
import {subscribeUnsubscribe, verifySubscription,verSuscritos} from '../controllers/NewsLetterController';
import { infoCoupons } from '../controllers/CouponsController';
import { Raiting, getRaiting, getAutoComplete } from '../controllers/RaitingController';
import { sendData, Analitycs, Search, sendMessage } from '../controllers/SendDataController';
import NewsBlogController from '../controllers/NewsBlogController';
import { createPayment } from '../controllers/IncomingPayments';

class Routes {

    public router: Router = Router();

    constructor() {
        this.config();
    }

    config(): void {
        // uploadFiles
        this.router.post('/uploadfile/:distine/:nameFile', functionControllers.UploadFile);
        this.router.post('/deletefile/:distine/:nameFile', functionControllers.DeleteFile);
        this.router.get('/admin/profiles/:cardcode', functionControllers.ProfileAdmin);
        // admin Banners
        this.router.get('/getbanners', bannersController.GetSlideFront);
        this.router.post('/admin/getbanners', bannersController.GetAllRecords);
        this.router.post('/admin/getbanner/:id', bannersController.GetRecord);
        this.router.post('/admin/savebanner', bannersController.Store);
        this.router.put('/admin/savebanner', bannersController.Update);
        this.router.delete('/admin/deletebanner/:id', bannersController.Delete);
        //seller
        this.router.post("/seller/login", Business, loginSeller);
        this.router.post("/seller/listClient", Business, listClient);
        this.router.post("/seller/searchClient", Business, searchClient);
        //login
        this.router.post("/users/login", Business, loginPartner);
        this.router.post("/users/loginTwoSteps", Business, twoStepsVerification);
        this.router.post("/users/loginTwoStepsMail", Business, twoStepsMail);
        this.router.post("/users/UserNoite", showPartner);
        this.router.post("/users/create", Business, createPartner);
        this.router.post("/users/updateAddresses", Business, Authentication, updateAddressPartner);
        this.router.post("/users/updatePartner", Business, Authentication, updatePartner);
        this.router.post("/users/sendJobMail", Business, Authentication, sendJobMail);
        this.router.post("/users/validate", Business, searchAccount);
        this.router.get("/users/:cardCode", Business, Authentication, getBusinessPartnerInfo);
        this.router.post("/users/sendRequestCardMail", Business, requestCard);
        //this.router.post("/users/show", Business, showPartner);
        //this.router.post("/users/update", Business, updatePartner);

        //puntos
        this.router.get("/points/resetPoints/", Business, Authentication, infoResetPoints);
        this.router.post("/points/insertResetPoints", Business,  insertResetPoints);

        //profiles
        this.router.get("/profile/", Business, Authentication, async (req, res) => { await getProfile(req, res) });
        
        //newsletter
        this.router.post("/newsletter/subscribeUnsubscribe", Business, subscribeUnsubscribe);
        this.router.get("/newsletter/:mail", Business, verifySubscription);

        //items
        this.router.get("/item/:itemCode", Business, Authentication, getItemDetails);
        this.router.get("/item_flete", Business, getFlete);
        this.router.get("/item/getImage/:itemCode", getImage);
        this.router.get("/item/getFile/:file", getFile);
        this.router.get("/items/searchByKey/:key", Business, Authentication, searchByKey);
        this.router.post("/items/searchByKey", Business, Authentication,searchByKey);
        this.router.get("/items/searchByCategory/:category", Business, Authentication, searchByCategory);
       // this.router.get("/items/dashBoard/", Business, Authentication, getItemsDashboard);
        //favorites
        this.router.post("/favorite/update/:exist", Business, Authentication, updateFavorites);
        //shopping Cart
        this.router.post("/shoppingCart/update", Business, Authentication, updateShoppingCart);
        this.router.post("/shoppingCart/updatelocal", Business, Authentication, updateShoppingCartLocal);
        this.router.post("/shoppingCart/delete", Business, Authentication, deleteShoppingCart);
        this.router.post("/shoppingCart", Business, Authentication, async (req, res) => { await getShoppingCart(req, res) });
        this.router.post("/removeShopping", Business,Authentication,removeShopping);
        //backOrder
        this.router.post("/backOrder/update", Business, Authentication, updateBackOrder);
        this.router.post("/backOrder/delete", Business, Authentication, deleteBackOrder);
        //0rders
        this.router.post("/AuthorizationModels", Business, Authentication, AuthorizationModels);
        this.router.post("/createDocument", Business, Authentication, createDocuments);
        this.router.post("/saveFileOV",Business, Authentication,SaveFileOV);
        this.router.get("/orders/:fechaInicio/:fechaFinal", Business, Authentication, orders);
        this.router.post("/ordersSeller", Business, Authentication, ordersSeller);
        this.router.get("/dataProfiled", Business, Authentication, dataProfile);
        this.router.get("/order/:docEntry", Business, Authentication, order);
        //Bill
        this.router.get("/bill/:fechaInicio/:fechaFinal", Business, Authentication, billings);
        this.router.get("/dataBill/:docEntry", Business, Authentication, dataBill);
        this.router.get("/bills/getPDF/:file", getPDF);
        this.router.get("/bills/getXML/:file", getXML);
        //Quotation
        this.router.get("/quotations/:fechaInicio/:fechaFinal", Business, Authentication, Quotation);
        this.router.post("/createQuotations", Business, Authentication, createQuotation);
        this.router.get("/dataQuotation/:docEntry", Business, Authentication, dataQuotation);

        //Home categories and banners
        this.router.get("/categories/getImage/:itemCode", getImageCategories);
        this.router.get("/categories/getPolitics/:itemCode", getPolitics);

        //Deliverys
        this.router.get("/deliverys/:fechaInicio/:fechaFinal", Business, Authentication, Delivery);
        this.router.get("/dataDelivery/:docEntry", Business, Authentication, dataDelivery);
        this.router.post("/createDelivery", Business, Authentication, createDelivery);
        //Saveds
        this.router.get("/saveds/:fechaInicio/:fechaFinal", Business, Authentication, Saved);
        this.router.get("/saved/:docEntry", Business, Authentication, dataSaved);
        this.router.post("/docuemntList", Business, Authentication, dataDocument);
        this.router.post("/createSavedCart", Business, Authentication, createSavedCart);
        //Preliminary
        this.router.get("/preliminarys/:fechaInicio/:fechaFinal", Business, Authentication, Preliminary);
        this.router.post("/createPreliminary", Business, Authentication, createPreliminary);
        this.router.get("/dataPreliminarys/:docEntry", Business, Authentication, dataPreliminary);
        //Collection
        this.router.get("/collections/:fechaInicio/:fechaFinal", Business, Authentication, Collection);
        //Overdue
        this.router.get("/overdueOne", Business, Authentication, Overdues);
        this.router.get("/overdueTwo", Business, Authentication, OverduesTwo);
        this.router.get("/overdueThree", Business, Authentication, OverduesThree);
        this.router.get("/overdueFour", Business, Authentication, OverduesFour);
        this.router.get("/overdueFive", Business, Authentication, OverduesFive);
        //catalogs
        this.router.get("/catalog/countries", Business, getCountries);
        this.router.get("/catalog/states/:key", Business, getStates);
        this.router.get("/catalog/packageStore", Business, getPackageStore);
        this.router.get("/catalog/getTaxes", Business, async (req, res) => { await getTaxes(req, res) });
        this.router.get("/catalog/cp/:key", Business, getInfoCP);
        //categories
        this.router.get("/categories/", Business, Authentication, getCategories);
        //cfdi
        this.router.get("/catalog/cfdi", Business, getCFDI);

        //Resumen
        this.router.post("/getTotalDeliveries",totalDeliveries);
        this.router.post("/getTotalInvoices",totalInvoices);
        this.router.post("/getitemsDeliveries",itemsDeliveries);
        this.router.post("/getitemsInvoices",itemsInvoices);
        this.router.post("/getitemsDeliveriesCredito",itemsDeliveriesCredito);
        this.router.post("/getitemsInvoicesCredito",itemsInvoicesCredito);
        this.router.post("/getDataResumen",dataResumen);

         //Destacados // Featured
         this.router.get("/getCategoriesHome/:section",Business,getCategoriesHome);
         this.router.get("/getProductsHome",Business,getProductsHome);
         this.router.get("/getBannerHome",Business,getBannerHome);
         this.router.post("/getProductsEspecial",Business, Authentication, getProductsEspecial)
         this.router.post("/ProductsEspecial",Business, Authentication, ProductsEspecial)

        this.router.get("/filtros",Business,getFiltros);
         this.router.get("/getMarcas",Business,getMarca);
         this.router.get("/getAparato",Business,getAparato);
         this.router.get("/getRefaccion",Business,getRefaccion);
         this.router.get("/getFabricante",Business,getFabricante);
         this.router.get("/getMaterial",Business,getMaterial);
         this.router.post("/searchAdvance", Business, getProductoAdvance);

        //Login OUSR
        this.router.post("/users/loginousr", Business, loginOUSR);

        //BONIFICACIONES
        this.router.post("/Promo", Business, getPromo);
        this.router.post("/getPromocion", Business, obtenerPromocionales); 
        this.router.post("/Items", Business, getItems);
        this.router.post("/searchConditions", Business, searchConditions);
        this.router.post("/InsertPromo", Business, insertPromocionales);
        this.router.post("/getConditions", Business, obtenerConditions); 
        this.router.post("/getPromocionDisparador", Business, obtenerPromocionalesDisparador); 
        this.router.post("/AprobarPromo", Business, aprobarPromocionales);
        this.router.post("/ActivarPromo", Business, activarPromocionales);
        this.router.post("/UpdatePromo", Business, updatePromocionales);
        this.router.post("/Promocionales", Business, getPromocionales);
        this.router.post("/catalogs/getBonificacion", Business, Authentication, getBonificaciones);
        //Update Partner 
        this.router.get("/detailsprofile/:user",Business, Authentication, getDetailsPartner);
        //this.router.post("/updatePartner", Business, updatePartner);
        this.router.get("/catalog/packageStore", Business, getPackageStore);
        //Autorizaciones
        this.router.post("/Autorizaciones", Business, getAutorizaciones);
        this.router.get("/detailAuto/:docEntry", Business, Authentication, detailsAutorization);
        this.router.post("/createAutorization", Business, Authentication, createAutorization);
        this.router.post("/rejectedAutorization", Business, Authentication, rejectedAutorization);
        this.router.get("/jobTypes", Business, jobTypes);
        //Descuentos
        // this.router.post("/catalogs/getDescuento", Business, getDescuento);    

        // Special Prices
        this.router.get("/getValidationSpecialPrices", Business, async (req, res)=> { await getValidationSpecialPrices(req, res)});        
        this.router.post("/updateSPStatus", Business, updateSPStatus);
        
        // Cupones
        this.router.get("/getCoupon/:coupon", Business, infoCoupons);

        //Raiting
        this.router.post("/raiting", Business, Raiting)
        this.router.get("/getRaiting/:itemCode/:cardCode", Business, getRaiting);

        this.router.get("/AutoComplete", Business, Authentication, getAutoComplete);

        //DATA
        this.router.post("/sendData", Business, sendData)

        // admin NewsBlog
        this.router.get('/getNewsBlog/:fechaInicio/:fechaFinal', NewsBlogController.GetSlideFront);
        this.router.post('/admin/getNewsBlog', NewsBlogController.GetAllRecords);
        this.router.post('/admin/getNewsBlog/:id', NewsBlogController.GetRecord);
        this.router.post('/admin/saveNews', NewsBlogController.Store);
        this.router.put('/admin/saveNews', NewsBlogController.Update);
        this.router.delete('/admin/deleteNews/:id', NewsBlogController.Delete);

        //delete Address 
        this.router.post("/users/deleteAddress", Business, Authentication, deleteAddressPartner); 

        //Validacion de precios especiales
        this.router.get("/SpecialPrice",Business, Authentication,getSpecialPrice);

        // Obtener facturas para descargar
        this.router.get("/bills/getBillspdf/:docEntry", getBillspdf);
        this.router.get("/bills/getBillsxml/:docEntry", getBillsxml);
        
        // SendMessageModal
        this.router.post("/sendMessage", Business, sendMessage);

        //Analitycs
        this.router.post("/Analitycs", Business, Authentication, Analitycs);
        // Search
        this.router.post("/Search", Business, Search);

        // Correos de personas subscritas
        this.router.post('/getAllEmails',Business, verSuscritos);

        // Creacion de pago
        this.router.post("/createPayment", Business, Authentication, createPayment);
        // Almacenes
        // this.router.post("/catalogs/validateWhsCode", Business, Authentication, getValidateWhs);
    }
    
}
import { format } from "url";

const router = new Routes();
export default router.router;