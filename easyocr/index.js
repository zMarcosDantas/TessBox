const { spawn } = require("child_process");
const fs = require("fs");

class EasyOCR {

    constructor(folderLoc) {
        this.location = folderLoc || __dirname + "/tmp/";
    };

    capitalizeBoolean(string) {
        let stringType = String(string);
        return stringType.charAt(0).toUpperCase() + stringType.slice(1).toLowerCase();
    };

    checkDecoder(string) {
        let stringLowerCase = string.toLowerCase();
        let regex = new RegExp(/(greedy|beamsearch|wordbeamsearch)/g);
        let match = stringLowerCase.match(regex);
        return match ? match[0] : "greedy";
    }

    checkDir() {
        return new Promise((resolve, reject) => {
            let exist = fs.existsSync(this.location);
            if(!exist) {
                fs.mkdirSync(this.location);
            }
            resolve(true);
        })
    };

    imageSave(fileName, imgData) {
        return new Promise(async (resolve, reject) => {
            try {
                await this.checkDir();
                fs.writeFileSync(this.location + fileName + ".jpg", imgData);
                resolve(true);
            } catch(err) {
                reject(err);
            }
        })

    };
    
    imageDelete(fileName) {
        return new Promise((resolve, reject) => {
            try {
                let exist = fs.existsSync(this.location + fileName + ".jpg");
                if(!exist) throw "File doesn't exist!";
                
                fs.unlinkSync(this.location + fileName + ".jpg")
                resolve(true);
            } catch(err) {
                reject(err);
            }
        })

    };

    imageDetection(image, lang="en", params) {
        let fileName = new Date().getTime();

        let parameters = ["-l", lang, "-f", `${this.location}${fileName}.jpg`];
        if(params) {
            if(typeof params.gpu                     == 'boolean') parameters.push(`--gpu=${this.capitalizeBoolean(params.gpu)}`);
            if(typeof params.model_storage_directory == 'string')  parameters.push(`--model_storage_directory=${params.model_storage_directory}`);
            if(typeof params.download_enabled        == 'boolean') parameters.push(`--download_enabled=${this.capitalizeBoolean(params.download_enabled)}`);
            if(typeof params.user_network_directory  == 'boolean') parameters.push(`--user_network_directory=${this.capitalizeBoolean(params.user_network_directory)}`);
            if(typeof params.recog_network           == 'string')  parameters.push(`--recog_network=${params.recog_network}`);
            if(typeof params.detector                == 'boolean') parameters.push(`--detector=${this.capitalizeBoolean(params.detector)}`);
            if(typeof params.recognizer              == 'boolean') parameters.push(`--recognizer=${this.capitalizeBoolean(params.recognizer)}`);
            if(typeof params.verbose                 == 'boolean') parameters.push(`--verbose=${this.capitalizeBoolean(params.verbose)}`);
            if(typeof params.quantize                == 'boolean') parameters.push(`--quantize=${this.capitalizeBoolean(params.quantize)}`);
            if(typeof params.detail                  == 'number')  parameters.push(`--detail=${params.detail}`);
            if(typeof params.decoder                 == 'string')  parameters.push(`--decoder=${this.checkDecoder(params.decoder)}`);
            if(typeof params.beamWidth               == 'number')  parameters.push(`--beamWidth=${params.beamWidth}`);
            if(typeof params.batch_size              == 'number')  parameters.push(`--batch_size=${params.batch_size}`);
            if(typeof params.workers                 == 'number')  parameters.push(`--workers=${params.workers}`);
            if(typeof params.allowlist               == 'string')  parameters.push(`--allowlist=${params.allowlist}`);
            if(typeof params.blocklist               == 'string')  parameters.push(`--blocklist=${params.blocklist}`);
            if(typeof params.paragraph               == 'boolean') parameters.push(`--paragraph=${this.capitalizeBoolean(params.paragraph)}`);
        } 
        return new Promise(async (resolve, reject) => {
            try {
                await this.imageSave(fileName, image);
                const ls = spawn("easyocr", parameters);

                let content = "";
                ls.stdout.on("data", data => {
                    content += data;
                });
                
                ls.stderr.on("data", data => {
                    console.log(`stderr: ${data}`);
                });
        
                ls.on('error', error => {
                    reject(error.message);
                });
        
                ls.on("close", async code => {
                    resolve(content);
                    await this.imageDelete(fileName);
                });
            } catch(err) {
                console.log("Error", err);
                reject(err);
            }
        });  
    };
};

module.exports = EasyOCR;