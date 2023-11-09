import wwebpkg from 'whatsapp-web.js';
const { Client, LocalAuth, NoAuth, MessageMedia } = wwebpkg;

import qrcode from 'qrcode-terminal';
import fs from 'fs';

import mime from 'mime-types';
import parsePhoneNumber from 'libphonenumber-js';
import * as url from 'url';
const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

const log_file = fs.createWriteStream(__dirname + '/log.txt', {flags: 'w'});


class WhatsAppController{
    //Inicaliza o whatsapp e realiza o login
    static async initialize(req, res){  
        
        let numeroTelefone = '554187438065'
        const client = new Client({
            puppeteer: {
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--unhandled-rejections=strict'
                ]
            },
            authStrategy: new LocalAuth({
                clientId: numeroTelefone,
            })
        })
        
       
        //coleta e apresenta o qrcode
        client.on('qr', qr => {
            qrcode.generate(qr, {small: true});
        });

        //inicaliza o cliente whatsapp
        client.initialize();

        //começa a ler o whatsapp
        client.on('ready', () => {
            console.log('Client is ready!');
        });
        
        if(req.method == 'POST'){            
            return client;
        }
        
        return res.status(200).send("Escaneie o código Whatsapp no terminal do servidor.");
        
    }

    static async sendMessage(req, res){
        const client = new Client({
            authStrategy: new LocalAuth(),
            puppeteer: {
                headless: true,
                //executablePath: pupPath
            }
        });
        
        client.initialize();
    
        client.on('qr', (qr) => {
            // NOTE: This event will not be fired if a session is specified.
            qrcode.generate(qr, {small: true});
        });
    
        client.on('auth_failure', msg => {
            // Fired if session restore was unsuccessful
            console.log('WWEB AUTHENTICATION FAILURE'+msg, true);
        });
    
    
        client.on('ready', async () => {
            console.log('WWEB READY');
            await client.sendPresenceAvailable();
    
            let my_number_country = parsePhoneNumber("+" + (client.info.wid.user)).country;
    
            
            for(let numberArr of req.body.numbersTo){
                console.log(numberArr.number);
                if(numberArr.number !== '') {

                    let parsed_number = WhatsAppController.parseNumber(numberArr.number, my_number_country);
                    if(parsed_number === null) {    //if number is not valid skip it
                        console.log(numberArr.number + ": INVALID NUMBER", true);
                    }
    
                    await WhatsAppController.sendEverything(client, parsed_number + "@c.us", req.body.message);   //'@c.us' represents a person's userdId
    
                    //delay to try avoiding ban
                    //await new Promise((resolve) => setTimeout(resolve, randBetween(delayms[0], delayms[1])));	//in ms
                    await new Promise((resolve, reject) => setTimeout(resolve, 5000));	//in ms
                } //else nothing                    
            }
            
            await client.sendPresenceUnavailable();
            await client.destroy();
            console.log('ALL DONE!');
            return res.status(200).json('success');
        });        
    }

    static parseNumber(number, country){
        try{
            let parsed = parsePhoneNumber(number, country);
            return parsed.number.toString().replace(/[- )(+]/g, '');    //clean number
        } catch(err){
            console.log(err,true);
            return null;
        }
    }

    static async sendEverything(WWebClient, chatId, messageToSend){
        //if number is not on Whatsapp
        if(! (await WWebClient.isRegisteredUser(chatId))){
            console.log(chatId.split('@c.us')[0] + ": NOT ON WHATSAPP");
        }
        else{
            let thisChat = await WWebClient.getChatById(chatId);            

            //send seen
            await thisChat.sendSeen();
    
            //send "typing..."
            await thisChat.sendStateTyping();
    
            //if message exists
            let ressult = await thisChat.sendMessage(messageToSend);
            console.log(chatId.split('@c.us')[0] + ": SENT");
        }
    }

    static log(msg, error=false) {
        let today=new Date();
        let formattedDateTime='['+today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate()+' '+today.getHours() + ':' + today.getMinutes() + ':' + today.getSeconds()+'] ';
    
        if(!error){
            console.log(msg);
            log_file.write(formattedDateTime + "INFO: " + msg + '\n');
        }
        else{
            console.error(msg);
            log_file.write(formattedDateTime + "ERROR: " + msg + '\n');
        }
    }
    
};
 
export default WhatsAppController;





