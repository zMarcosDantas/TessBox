const tesseract = require("node-tesseract-ocr")
const cors      = require('cors');
const express   = require('express');
const app       = express();
const Easy      = require("./easyocr/index");
const OCR       = new Easy("")

const langs = {
  por: "pt",
  spa: "es",
  jpn: "ja",
  ara: "ar",
  hin: "hi",
  fra: "fr",
  chi_sim: "ch_sim",
  eng: "en",
  equ: "en"
}

app.use(express.json({limit: '5mb'}));
app.use(cors());

app.get('/status', (req, res) => {
  res.json({status: "OK", message: "Running"})
})

app.post('/decode', async (req, res) => {
  let {image, lang, mode} = req.body;
  console.log("Request on mode:",mode);
  if(!image) return res.json({error:"You didnt send any images!"});
  
  const config = {
    lang: lang ? lang : 'eng',
  }
    
  let imageBuffer = Buffer.from(image.replace('data:image/png;base64,', ''), 'base64')

  if(mode == "easy") {
    OCR.imageDetection(imageBuffer, langs[config.lang], {detail: 0}).then(text => {
      console.log('New text recognized:', text.replace(/\n|\r/g, ""));
      res.json({success:text})
    }).catch(error => {
      console.log(error.message);
      res.json({error:"An error has ocurred"});
    })
  } else {
    tesseract.recognize(imageBuffer, config).then(text => {
      console.log('New text recognized:', text.replace(/\n|\r/g, ""));
      res.json({success:text});
    }).catch(error => {
      console.log(error.message)
      res.json({error: "An error has ocurred!"});
    })
  }

  
})

app.listen(9191, () => {
  console.log('Running!');
})
