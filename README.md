
# TessBox

This is a simple self-hosted Tesseract and EasyOCR integrations based on express server and a chrome extension.

## How does it work?

I created a server with express that receives a screenshot of the zone of the page the user want to read the text. The screenshot is received by the server that uses the tesseract CLI and easyOCR CLI to OCR it and return the responses to the user. The text is auto copied if the page is on focus.

## How to use?

* All you need is to have Tesseract and EasyOCR installed in your machine. You can find out how to install them following the steps of the repositories:  

    1. [Tesseract](https://tesseract-ocr.github.io/tessdoc/Downloads.html)  
    2. [EasyOCR](https://github.com/JaidedAI/EasyOCR)  
    Both have to be acessible as command line to work.

* Add the extension to the browser as developer. (chrome://extensions)
* Run the index.js file to execute the express server.
* Voilà! Everything should be working fine now.

## Extension

![Extension](https://github.com/zMarcosDantas/TessBox/blob/main/screenshots/popup.png?raw=true)

* The extension is really simple to use. You can click on the icon to use, or use CTRL+Y as shortcut (if you want to change it, go to manifest file and change there).
* There will be two modes: Tesseract and EasyOCR.
* I added the most spoken in the world.
* For tesseract language models you have to install there: [Tesseract Lang Models](https://github.com/tesseract-ocr/tessdoc/blob/main/Data-Files.md)
* If you want to replace something of the text after copied, you can use the regex input.
* You can change the text type aswell (Normal, Lowercase and Uppercase). 
