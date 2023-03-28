import { Response} from "express";
import moment from 'moment';
import { Request, IResult, IRecordSet } from "mssql";
import ResponseModel from "../models/ResponseModel";
import AnalitycsProcedure from "../procedures/AnalitycsProcedure";
import EmailProcedure from "../procedures/EmailProcedure";
import { helpers } from "../middleware/helper";
import { DatabaseService } from "../util/database";
import { logger } from "../util/logger";

export async function sendData(req: any, response: Response): Promise<void> {
    const db = new DatabaseService();
    let responseModel = new ResponseModel();
    let {CardCode, CardName, Date, Time, TypeUser, Email, Business, Session} = req.body;
    try {
        // const result = await db.Query(`INSERT INTO [Access] (CardCode,CardName,Date,Time,TypeUser,Email,IP,Business,Session) 
        // VALUES ('${CardCode}','${CardName}','${Date}','${Time}','${TypeUser}','${Email}','${req._remoteAddress}','${Business}',${Session})`);
        
        responseModel.status = 1;
        responseModel.data =  {};
        response.json(responseModel);
    } catch (e) {
        logger.error('Error al insertar Session',e);
        responseModel.message = "Error al insertar Session";
        response.json(responseModel);
    }
}

export async function Analitycs(req: any, response: Response): Promise<void> {
    let {db_name} = response.locals.business;
    let responseModel = new ResponseModel();
    let { fechaInicio, fechaFinal, tipo } = req.body.data;
    // console.log('con<',  fechaInicio, fechaFinal, tipo );
    try {

        let detalle = {
            param1 : tipo,
            param2 : fechaInicio,
            param3 : fechaFinal,
            param4 : '',
            param5 : ''
        }
        let result = await AnalitycsProcedure(detalle);
        // console.log('con<<<<---',result.length);
        if(result.length > 0){
            responseModel.status = 1;
            responseModel.data = { list: result};
            response.json(responseModel);
        }else{
            responseModel.status = 0;
            responseModel.data = { list: []};
            response.json(responseModel);
        }
        
    } catch (e) {
        logger.error(e);
        responseModel.status = 0;
        responseModel.message = "Ocurrió un problema inesperado";
        response.json(responseModel);
    }
}

export async function Search(req: any, response: Response): Promise<void> {
  let {type} = response.locals.business;
    const db = new DatabaseService();
    let responseModel = new ResponseModel();
    let {cve_user,search,date,time,origin,num_results} = req.body;
    try {
        // console.log('con<<<<', cve_user,search,date,time,origin,num_results);
        const result = await db.Query(`INSERT INTO [Search] (cve_user,search,date,time,origin,num_results) 
        VALUES ('${cve_user}','${search}','${date}','${time}','${origin}','${num_results}')`);
        responseModel.status = 1;
        responseModel.data =  {respuesta: result.rowsAffected[0]};
        response.json(responseModel);
    } catch (e) {
        logger.error('Error al insertar Busquedas',e);
        responseModel.message = "Error al insertar Busquedas";
        response.json(responseModel);
    }
}

export async function sendMessage(req: any, response: Response) {
    const {articulo,cantidad,message,nombre,apellido,empresa,email,cp,estado,ciudad,telefono} = req.body;
    
    const responseModel = new ResponseModel();
    try {
        let msghtml =  `

        <html>
        <head>
        <meta charset="UTF-8">
        <meta content="text/html; charset=iso-8859-1" http-equiv="Content-Type">
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Open+Sans&display=swap" rel="stylesheet">
      </head>
      
      <body style="margin: 0px; padding: 0px; width: 100%!important; background-color: white;">
      
        <style type="text/css">
          a[x-apple-data-detectors] {
            color: inherit !important;
            text-decoration: none !important;
            font-size: inherit !important;
      
            font-weight: inherit !important;
            line-height: inherit !important;
          }
      
          a {
            text-decoration: none;
          }
      
          b {
            font-weight: bold;
          }
      
          * {
            -webkit-text-size-adjust: none;
          }
      
          body {
            font-family: 'Helvetica';
            margin: 0 auto !important;
            padding: 0px !important;
            width: 100%;
            margin-right: auto;
            margin-left: auto;
          }
      
          html,
          body {
            margin: 0px;
            padding: 0px !important;
          }
      
          table,
          td,
          th {
            border-collapse: collapse;
            border-spacing: 0px;
            mso-table-lspace: 0pt;
            mso-table-rspace: 0pt;
          }
      
          div,
          p,
          a,
          li,
          td {
            -webkit-text-size-adjust: none;
          }
      
          * {
            -webkit-text-size-adjust: none;
          }
      
          img {
            display: block !important;
          }
      
          .ReadMsgBody {
            width: 100%;
          }
      
          .ExternalClass p,
          .ExternalClass span,
          .ExternalClass font,
          .ExternalClass td,
          .ExternalClass div {
            line-height: 100%;
            margin: 0px;
            padding: 0px;
          }
      
          .ExternalClass {
            width: 100%;
          }
      
          span.MsoHyperlink {
            mso-style-priority: 99;
            color: inherit;
          }
      
          span.MsoHyperlinkFollowed {
            mso-style-priority: 99;
            color: inherit;
          }
      
          .nav .yshortcuts {
            color: #666666
          }
      
          .blacklink .yshortcuts {
            color: #000000
          }
      
          .graylink .yshortcuts {
            color: #999999
          }
      
          .footerLink a {
            color: #999999 !important;
            text-decoration: none !important;
          }
      
          .timeline {
            position: relative;
            margin-left: 17%;
            margin-top: 40px;
            margin-bottom: -14px;
          }
      
          .timeline li {
            list-style: none;
            float: left;
            width: 20%;
            margin-left: 7px;
            position: relative;
            text-align: center;
            text-transform: uppercase;
      
            color: #F1F1F1;
          }
      
          .timeline li img {
            list-style: none;
            float: left;
            width: 20%;
            position: absolute;
            text-align: center;
            margin-top: -60;
            margin-left: 23;
          }
      
          ul:nth-child(1) {
            color: #09488F;
          }
      
          .timeline li:before {
            counter-increment: year;
            content: counter(year);
            width: 50px;
            height: 50px;
            border: 3px solid #F1F1F1;
            border-radius: 50%;
            display: block;
            text-align: center;
            line-height: 50px;
            margin: 0 auto 10px auto;
            background: #F1F1F1;
            color: #F1F1F1;
            transition: all ease-in-out .3s;
          }
      
          .timeline li:after {
            content: "";
            position: absolute;
            width: 100%;
            height: 5px;
            background-color: #F1F1F1;
            top: 25px;
            left: -50%;
            z-index: -999;
            transition: all ease-in-out .3s;
          }
      
          .timeline li:first-child:after {
            content: none;
          }
      
          /*texto que va debajo de la lista activa*/
          .timeline li.active {
            color: #C55930;
          }
      
          /*texto que va dentro del circulo activo*/
          .timeline li.active:before {
            background: #C55930;
            color: #C55930;
          }
      
          .timeline li.active+li:after {
            background: #C55930;
          }
      
          div,
          button {
            margin: 0 !important;
            padding: 0;
            display: block !important;
          }
      
          @media screen and (max-width: 600px) and (min-width: 480px) {
            .scale {
              width: 100% !important;
              min-width: 1px !important;
              max-width: 600px !important;
              height: auto !important;
              max-height: none !important;
            }
          }
      
          @media (max-width: 480px) {
            .scale {
              width: 100% !important;
              min-width: 1px !important;
              max-width: 480px !important;
              height: auto !important;
              max-height: none !important;
            }
      
            .scale-480 {
              width: 100% !important;
              min-width: 1px !important;
              max-width: 480px !important;
              height: auto !important;
              max-height: none !important;
            }
      
            .stack {
              display: block !important;
              width: 100% !important;
            }
      
            .hide {
              display: none !important;
              width: 0px !important;
              height: 0px !important;
              max-height: 0px !important;
              padding: 0px 0px 0px 0px !important;
              overflow: hidden !important;
              font-size: 0px !important;
              line-height: 0px !important;
            }
      
            .ship-text {
              padding: 12px 0px 12px 0px !important;
              font-size: 12px !important;
              line-height: 120% !important;
              letter-spacing: 0px !important;
            }
      
            .logo-box {
              padding: 10px 0px 10px 0px !important;
            }
      
            .headline {
              padding: 25px 25px 10px 25px !important;
              font-size: 30px !important;
              line-height: 110% !important;
              letter-spacing: 0px !important;
            }
      
            .reviews {
              padding: 20px 10px 10px 10px !important;
            }
      
            .copy {
              font-size: 12px !important;
              line-height: 16px !important;
              padding: 5px 10px 0px 10px !important;
            }
      
            .product {
              font-size: 12px !important;
            }
      
            .cta {
              width: 130px !important;
              height: auto !important;
            }
      
            .contact-pad {
              padding: 20px 0px 20px 0px !important;
            }
      
            .contact-text {
              font-size: 14px !important;
              line-height: 120% !important;
            }
      
            .trust-pad {
              padding: 10px !important;
            }
      
            /* Custom CSS */
            .mob-br {
              display: block !important;
            }
      
            .pr {
              padding: 0px 0px 0px 0px !important;
            }
          }
      
          @media (max-width: 400px) {
            .trust-pad {
              padding: 10px 0px !important;
            }
      
            .mob-br-400 {
              display: block !important;
            }
      
            .ship-text {
              font-size: 11px !important;
            }
          }
        </style>
      
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #D6D6D6;">
          <tbody>
            <tr>
              <td width="100%" align="center" valign="top">
                <table style="border: border-collapse;" cellpadding="0" cellspacing="0" border="0">
                  <tbody>
                    <tr>
                      <td align="center">
                        <table align="center" border="0" cellpadding="0" cellspacing="0"
                          style="min-width: 600px; width: 600px;" width="600" class="scale">
                          <tbody>
                            <tr>
                              <td bgcolor="#FFFFFF" align="center" valign="top">
                                <table align="center" border="0" cellpadding="0" cellspacing="0"
                                  style="min-width: 600px; width: 600px;" width="600" class="scale">
                                  <tbody> 
                                    <!-- ESTO ES COMO UN BR PORQUE DA UN ESPACIO EN BLANCO -->
                                    <tr><td style="height: 15px"></td></tr>
                                    <!-- CUERPO DEL MENSAJE -->
                                    <tr>
                                      <td class="logo-box" width="100%" align="center"
                                        style="background-color: #C55930; padding: 25px 0px 25px 0px;" bgcolor="#008af0">
                                        <a style="text-decoration: none;" href=" " target="_blank">
                                          <img
                                            style="width: 100%; max-width: 150px; height: auto; max-height: none; margin: 0px auto;"
                                            src="https://blogger.googleusercontent.com/img/a/AVvXsEhB43RwNpaaT7HL5R_4rvYOkyF9yMZfbYTn72T84UOZFNr8T1oQ0PoBzH8gWleuyFO1UXlyisK3Eh9FB8z4gf9lpTdP172uqzOWwV02Dfb0Xr7DyDPAAC4Vpu6ID8CXjJ73Z20x58Qd2sXprKAd8824SZCpAc0ZcZq5_vnfVc6P_j2GylJat7dXwEW3wQ=s700"
                                            width="480" height="46" border="0">
                                        </a>
                                      </td>
                                    </tr>
                                    
                                    <!-- CUERPO DEL MENSAJE -->
                                    <tr>
                                      <td
                                        style="font-family: Helvetica; color: #444444; font-size: 30px; font-weight: 700; line-height: 45px; mso-line-height-rule: exactly; text-align: center; padding: 35px 10px 10px 10px;"
                                        align="center" class="headline">
                                        <a style="text-decoration: none; color: #444444;">
                                          Cotización IRCO Commercial</a>
                                      </td>
                                    </tr>
    
    
                                    <tr>
                                      <td
                                        style="font-family: Helvetica; color: #000000; font-size: 15px; line-height: 25px; font-weight:bold; mso-line-height-rule: exactly; text-align: justify; padding: 20px 20px 10px 20px;"
                                        align="center" class="copy">
                                        <a style="color: #000000; text-decoration: none;">Información del artículo.</a>
                                      </td>
                                    </tr>
    
                                    <tr>
                                        <td
                                          style="font-family: Helvetica; color: #000000; font-size: 15px; line-height: 20px; mso-line-height-rule: exactly; text-align: justify; padding: 0px 20px 0px 20px;"
                                          align="center" class="copy">
                                            <a style="color: #000000; text-decoration: none;">
                                                <b>Artículo: </b> ${articulo}<br />
                                                <b>Cantidad: </b> ${cantidad}<br />
                                                <b>Especificaciones: </b> <br />
                                                    ${message}
                                            </a>
                                            <br>
                                        </td>
                                    </tr>
    
                                    <tr>
                                      <td
                                        style="font-family: Helvetica; color: #000000; font-size: 15px; line-height: 25px; font-weight:bold; mso-line-height-rule: exactly; text-align: justify; padding: 20px 20px 10px 20px;"
                                        align="center" class="copy">
                                        <a style="color: #000000; text-decoration: none;">Información de contacto.</a>
                                      </td>
                                    </tr>
    
                                    <tr>
                                        <td
                                          style="font-family: Helvetica; color: #000000; font-size: 15px; line-height: 20px; mso-line-height-rule: exactly; text-align: justify; padding: 0px 20px 0px 20px;"
                                          align="center" class="copy">
                                            <a style="color: #000000; text-decoration: none;">
    
                                                <b>Nombre: </b> ${nombre}<br />
                                                <b>Empresa </b> ${empresa}<br />
                                                <b>Correo: </b> ${email}<br />
                                                <b>Código postal: </b> ${cp}<br />
                                                <b>Estado: </b> ${estado}<br />
                                                <b>Ciudad: </b> ${ciudad}<br />
                                                <b>Télefono: </b> ${telefono}<br />
                                            </a>
                                            <br>
                                        </td>
                                    </tr>
    
                                  </tbody>
                                </table>
                                <br>
                                <!-- DETALLE DEL PEDIDO  -->
                                <div style="padding: 0px 20px 0px 20px;">
                                  <table align="center" border="0" cellpadding="0" cellspacing="0"
                                    style="min-width: 600px; width: 600px;" width="600" class="scale">
                                  </table>
                                </div>
    
                                <!-- SECCION FOOTER BARRA DE CONTACTO  -->
                                <table border="0" cellpadding="0" cellspacing="0"
                                  style="min-width: 600px; width: 600px; background-color: #C55930;" width="600"
                                  class="scale">
                                  <tbody>
                                    <tr>
                                      <td width="100%" align="center" valign="middle" style="vertical-align: middle;">
                                        <table cellpadding="0" cellspacing="0" border="0">
                                          <tbody>
                                            <tr>
                                              <td style="padding: 40px 0px 40px 0px;" class="contact-pad" align="center">
                                                <table cellpadding="0" cellspacing="0" border="0">
                                                  <tbody>
                                                    <tr>
                                                      <td style="padding: 0px 7px 0px 0px;" align="center" width="27"><a
                                                          style="text-decoration: none; color: #ffffff;"
                                                          href="https://ircomx.com/contacto/" target="_blank"
                                                          rilt="ContactUs_Icon"><img style="display: inline;"
                                                            src="https://1.bp.blogspot.com/-VoID1BgvhrY/YRGMjLGW24I/AAAAAAAAAbE/mWax9GkDfJsDgCObf6geHCCP5FbyftsZACLcBGAsYHQ/s20/telefono_Mesa%2Bde%2Btrabajo%2B1.png"
                                                            width="20" height="20" alt="" border="0"></a>
                                                      </td>
                                                      <td
                                                        style="font-size: 22px; font-weight: 700; color: #ffffff; text-align: center;"
                                                        class="contact-text" align="center"><a
                                                          style="text-decoration: none; color: #ffffff;"
                                                          href="https://ircomx.com/contacto/" target="_blank"
                                                          rilt="ContactUs_Text"> Llámanos al 667 760 5233 Ext. 107 y 108 </a>
                                                      </td>
                                                    </tr>
                                                  </tbody>
                                                </table>
                                              </td>
                                            </tr>
                                          </tbody>
                                        </table>
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                                <br>
                                <!-- SECCION FOOTER BAJA ICONOS Y REDES SOCIALES  -->
                                <table align="center" border="0" cellpadding="0" cellspacing="0"
                                  style="background-color: #ffffff; min-width: 600px; width: 600px;" width="600"
                                  class="scale">
                                  <tbody>
                                    <tr>
                                      <td style="padding:0 0 21px;">
                                        <table align="center" style="margin:0 auto;" cellpadding="0" cellspacing="0">
                                          <tbody>
                                            <tr>
                                              <!-- facebook -->
                                              <td class="active-i">
                                                <a style="text-decoration:none;"
                                                  href="https://www.facebook.com/ircocommercial" target="_blank">
                                                  <img src="https://blogger.googleusercontent.com/img/a/AVvXsEgde4jxkeChupZEDSxVmwtK3r2K5tCzWQziQqM2KNVIP3vardtmFJQSl5YReE7aDn368cdOgyucSJ0RBZp9Id7MS-rtno79fbYGtZK8Z9EtPKxB-N4s-b9Im7Hvm4RThFC4AJGxbPdkSuE9ujwp931J6NpYHWEtLz8pSHiLmCIEM87LL5EPYiftoVnqlw=w128-h128-p-k-no-nu" width="30"
                                                    style="font:13px/20px Roboto, Arial, Helvetica, sans-serif; color:#fff; vertical-align:top;"
                                                    alt="fb">
                                                </a>
                                              </td>
                                              <!-- WHATS CONTACTO -->
                                              <td width="20"></td>
                                              <td class="active-i">
                                                <a style="text-decoration:none;" href="https://api.whatsapp.com/message/ZPC6FBIMZR2ME1" target="_blank">
                                                  <img
                                                    src="https://blogger.googleusercontent.com/img/a/AVvXsEjqaqX5ldiIPbcp5NTJMpyEGGv5-UKLAOqQ0gBfsxFM_EY9BfVRlpc4N-BH7O93dKuJHlUB7q0fjDMN4Tb953KRDYohHn4F3JMznQNheMMTdeZhataZ-1VWc8U0YicOuo-3ay0PBVAURVD-xtcm5C3Qay064Fmh9KPjj5oINGSjO8kLIdl3eTLJAxmkEg=s512"
                                                    width="30"
                                                    style="font:13px/20px Roboto, Arial, Helvetica, sans-serif; color:#fff; vertical-align:top;"
                                                    alt="ig">
                                                </a>
                                              </td>
                                              <!-- Linkedin -->
                                              <td width="20"></td>
                                              <td class="active-i">
                                                <a style="text-decoration:none;"
                                                  href="https://www.linkedin.com/company/ircocommercial" target="_blank">
                                                  <img src="https://blogger.googleusercontent.com/img/a/AVvXsEjjRyYybHb4R6-HFrss9Uqf0pVz16Vb5tGPkdjJ1PYynwfFaw7n7WgLi6GaqufMLYqkwUJrUVvGNcNcwQEhcK3Oc4ldlXfW-bWZztlLDp09QtfvSjr0ekF_oEExjoW8aVVMwr7Cfq7v4SJQ44dXybk77uoYZih3BSM9SVQnYXmEJYCNouXHJmoXDrZQkg=w128-h128-p-k-no-nu" width="30"
                                                    style="font:13px/20px Roboto, Arial, Helvetica, sans-serif; color:#fff; vertical-align:top;"
                                                    alt="tw">
                                                </a>
                                              </td>
                                              <!-- web -->
                                              <td width="20"></td>
                                              <td class="active-i">
                                                <a style="text-decoration:none;" href="https://ircomx.com/" target="_blank">
                                                  <img
                                                    src="https://blogger.googleusercontent.com/img/a/AVvXsEh3HK6D2z1Ex7SnDv2C6z8sCYtFXc5cIdDLo26tQQONMyCPhwsCww8KRey6jTGgUKGDFj2dKeayvEuK0kgftLR_ELwaxLbozfEpKAfMGY9uWRoRFEA9MUZFF-hmJKV10aICo8mdtud5E50Qo4YOdDusrYSEq9b6afNfLklmiKwh499yS23-e87FWSQ2Zw=w128-h128-p-k-no-nu"
                                                    width="30"
                                                    style="font:13px/20px Roboto, Arial, Helvetica, sans-serif; color:#fff; vertical-align:top;"
                                                    alt="tw">
                                                </a>
                                              </td>
                                              <!-- instagram -->
                                              <td width="20"></td>
                                              <td class="active-i">
                                                <a style="text-decoration:none;" href="https://www.instagram.com/ircomx/"
                                                  target="_blank">
                                                  <img
                                                    src="https://blogger.googleusercontent.com/img/a/AVvXsEihGR_WFsY_mcr1O98nFd3UJgyHDzBiFdCCIJfo8pUxKzafRg4Ejs40lIX9Pq5ay-zTp1fdP2Hgqqf0tZ2J6WGe8uihlEkEbWdmEEKMhIvGFj5tzyfbo_dYIlSEWKZsWX3_57FklXJRHH85STBRAAAy4VM_8qvzX_v8S0xer6l7xOKOm4g60_ETnuiMmw=w128-h128-p-k-no-nu"
                                                    width="30"
                                                    style="font:13px/20px Roboto, Arial, Helvetica, sans-serif; color:#fff; vertical-align:top;"
                                                    alt="tw">
                                                </a>
                                              </td>
                                              <!-- youtube -->
                                              <td width="20"></td>
                                              <td class="active-i">
                                                <a style="text-decoration:none;" href="https://www.youtube.com/channel/UCKXH3Y4ePOk_hnN3tnmHPYQ" target="_blank">
                                                  <img
                                                    src="https://blogger.googleusercontent.com/img/a/AVvXsEh0Hl8ESN5td3FWq1e6FkjZck1H_RPmy7MuFEU5Y6HQuFnATwuwci2ot51JNOCWplh9M13s7R_AB7-Lw3dHMl6pkoS-GdW9QeTXqVBqxDDgM3GEPCY1jgjJGlI55uObZlWyFUidKSkGCuWNO0jxR27PK-Kwze41WjrbJb3F3w0Ywaqg2aT8mu60nnjueA=w128-h128-p-k-no-nu"
                                                    width="30"
                                     
                                                    style="font:13px/20px Roboto, Arial, Helvetica, sans-serif; color:#fff; vertical-align:top;"
                                                    alt="tw">
                                                </a>
                                              </td>
                                            </tr>
                                          </tbody>
                                        </table>
                                      </td>
                                    </tr>
                                    <tr>
                                      <td valign="top">
                                        <table border="0" cellpadding="0" cellspacing="0" style="width: 100%;" width="100%">
                                          <tbody>
                                            <tr>
                                              <td
                                                style="padding: 0px 20px 7px 20px; font-size: 12px; color: #999999; text-align: center; line-height: 100%; mso-line-height-rule: exactly;">
                                                <span class="footerLink">
                                                  © 2021. Todos los derechos reservados.
                                                </span>
                                                <br>
                                                <br>
                                                <a href="https://ircomx.com/" style="color:#999999;"
                                                  target="_blank">ircocommercial.com</a>
                                              </td>
                                            </tr>
                                          </tbody>
                                        </table>
                                        <br>
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                                <!-- ESTO ES COMO UN BR PORQUE DA UN ESPACIO EN BLANCO -->
                                <tr><td style="height: 15px"></td></tr>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
      </body>
      </html>
        `;
        let dataMail = await EmailProcedure("getOrder");
        let bcc;
        if (dataMail[0].validateOrderBCC === 1){
            bcc = dataMail[0].orderBCC;
        }else{
            bcc="";
        }
        let subject = dataMail[0].orderSubject;
        await helpers.sendEmail("tlm01@ircomx.com",email,"","Nueva Cotización IRCO Commercial",msghtml,null );

        responseModel.message = 'Correo enviado exitosamente';
        responseModel.status = 1;
        responseModel.data = {}  
        response.json(responseModel);

    } catch (error) {
        logger.error('Mandar correo de sugerencia: ', error)
        response.json(responseModel);
    }    
}