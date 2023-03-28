import nodemailer from 'nodemailer';
import bcrypt from 'bcryptjs';
import Cryptr from 'cryptr';
import {logger} from "../util/logger";
import EmailProcedure from "../procedures/EmailProcedure";

class Helpers {
    public async sendEmail(to:string, cc:string, bcc:string, subject:string, html:string, files:any): Promise<string>{
        // create reusable transporter object using the default SMTP transport
        var resultant = "";
        // Datos y configuracion del remitente
        let dataMail = await EmailProcedure("getSender");
        ////console.log(dataMail);
        let secureValue;
        if (dataMail[0].senderSecure === "true"){
          secureValue = true;
        }else{
          secureValue = false;
        }
        let transporter = nodemailer.createTransport({
            host: dataMail[0].senderHostSMTP,//smtp
            port: dataMail[0].senderPort,
            secure: secureValue, // true for 465, false for other ports
            auth: {
                user: dataMail[0].senderAccount, // generated ethereal user
                pass: dataMail[0].senderPassword // generated ethereal password
            }
        });
        const mailOptions = {
            from: '"IRCO COMMERCIAL" <noreply@ircocommercial.com>',
            to: to, //"mail1@mail.com,mail2@mail.com"
            cc: cc, //"mail1@mail.com,mail2@mail.com"m
            bcc: bcc, //"mail1@mail.com,mail2@mail.com"
            subject: subject,
            //text: 'That was easy!',
            html: html,
            attachments:files //{ filename: 'text3.txt', path: '/path/to/file.txt' } // file on disk as an attachment
          };
        // send mail with defined transport object
        let info = await transporter.sendMail(mailOptions, function(error, info){
            if (error) {
             logger.error("Error Email",error);
              resultant = error.message;
            } else {
              resultant = info.response;
            }
            
        });
        return resultant
    }
    public async encryptPassword (password: string): Promise<string>{
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(password,salt);
      return hash;
    }
    public async matchPassword (password: string, savePassword: string): Promise<boolean>{
      try{
          return await bcrypt.compare(password,savePassword);
      }catch(e){
        logger.error('Error: Compare Passwords: ',e);
          return false;
      }
    }
    public async encryptData (data: string): Promise<string>{
      const token = "ca2f1c32bbafac4d551314ae2504220798c46ae7";
      let responseData = "uno";
      try {
        const cryptr = new Cryptr(token);
        responseData = cryptr.encrypt(data);
      } catch (error) {
        logger.error(error);
      }
      return responseData;
    }
    public desencryptData (data: string){
      const token = "ca2f1c32bbafac4d551314ae2504220798c46ae7";
      let responseData = "";
      try {
        const desencryptr = new Cryptr(token);
        responseData = desencryptr.decrypt(data);
      } catch (error) {
        logger.error(error);
      }
      return responseData;
    }
}
export const helpers = new Helpers();