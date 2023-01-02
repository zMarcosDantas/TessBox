
var overlay = document.createElement('div');
overlay.id = 'overlay-mdTess';
overlay.style = 'display: block; position: fixed; width: 100%; height: 100%; left: 0; top: 0; background-color: rgba(0,0,0,0.0); z-index:2147483647;';

if(!document.getElementById('status-mdTess')) {
    var bar = document.createElement('div');
    var barText = document.createElement('p')
    bar.id = 'status-mdTess'
    bar.style = 'display: block; position: fixed; bottom: 0; width: 100%; background-color: gray; z-index:2147483647; text-align: center; padding: 5px;'
    barText.id = 'statusText-mdTess'
    
    bar.appendChild(barText)
    document.body.appendChild(bar);
}

barText.innerText = "Select the area you want to copy the text"
barText.style = 'font-size: 16px; color: white; margin: 0;'

var box = document.createElement('div');
box.id = 'box-mdTess';
box.style = 'display:block; position:fixed; width:0px; height:0px; left:0; top:0;border:3px dashed #672dd3; background-color: rgba(255,255,255/*34,180,177*/, 0.1); /*box-shadow: 1px 1px 100px #22b4b1;*/ z-index:2147483647;';

overlay.appendChild(box);
document.body.appendChild(overlay);

document.body.style.cursor = 'crosshair';

const mdControl = {
    moving: false,
    x: 0,
    y: 0,
    w: 0,
    h: 0, 
    xI: 0,
    yI: 0,
    xF: 0,
    yF: 0,
}

const mdDown = (ev) => {
    mdControl.moving = true;
    
    mdControl.xI   = ev.clientX;
    mdControl.yI   = ev.clientY;
    box.style.left = mdControl.xI + 'px';
    box.style.top  = mdControl.yI + 'px';
}

const mdMove = (ev) => { // box logic
    if(mdControl.moving) {

        mdControl.xF = ev.clientX;
        mdControl.yF = ev.clientY;

        if(mdControl.xF < mdControl.xI) {
            mdControl.x  = mdControl.xF;
            mdControl.w  = mdControl.xI - mdControl.xF;
        } else {
            mdControl.x  = mdControl.xI;
            mdControl.w  = mdControl.xF - mdControl.xI;
        }
         
        if(mdControl.yF < mdControl.yI) {
            mdControl.y  = mdControl.yF;
            mdControl.h  = mdControl.yI - mdControl.yF; 
        } else {
            mdControl.y  = mdControl.yI;
            mdControl.h  = mdControl.yF - mdControl.yI;
        }

        box.style.left   = mdControl.x  + 'px';
        box.style.top    = mdControl.y  + 'px';
        box.style.width  = mdControl.w  + 'px';
        box.style.height = mdControl.h  + 'px';
        
    }
}

const timeout = function(time) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(true);
        }, time)
    })
}

const mdUp = async (ev) => {
    mdControl.moving = false;
    await timeout(200);
    
    chrome.runtime.sendMessage({message: 'cropIt'}, function(response) {

        let dom_image = new Image();
        let dom_canvas = document.createElement('canvas');
        let dom_canvas_ctx = dom_canvas.getContext('2d');
        dom_canvas_ctx.imageSmoothingEnabled = false;
        dom_image.onload = () => {
            console.log('Cropping', mdControl.x, mdControl.y, mdControl.w, mdControl.h);
            dom_canvas.width  = mdControl.w;
            dom_canvas.height = mdControl.h;
            dom_canvas_ctx.drawImage(dom_image,
                mdControl.x * window.devicePixelRatio, mdControl.y * window.devicePixelRatio,
                mdControl.w * window.devicePixelRatio, mdControl.h * window.devicePixelRatio, // fix pixelRatio here
                0,0,
                mdControl.w, mdControl.h);

            let finalImage = dom_canvas.toDataURL("image/jpg", 1.0);
            finishAndStop(finalImage);
        }

        dom_image.src = response;
    });
    
    box.remove();

}

document.body.addEventListener('mousedown', mdDown)

document.body.addEventListener('mousemove', mdMove)

document.body.addEventListener('mouseup', mdUp);

const finishAndStop = (croppedImage) => {
    document.body.style.cursor = '';
    document.body.removeEventListener('mousedown', mdDown)
    document.body.removeEventListener('mousemove', mdMove)
    document.body.removeEventListener('mouseup', mdUp);
    barText.innerText = "Waiting for response...";
    chrome.runtime.sendMessage({message: 'Done', imageCropped: croppedImage}, function(response) {
        console.log('Response', response);
        if(response.success) {
            copyToClipBoard(response.success);
        } else {
            bar.innerText = `Failed to copy...`
            bar.style.backgroundColor = 'rgba(155, 27, 27, 0.9)'
            setTimeout(() => {
                overlay.remove();
                bar.remove()
            }, 3000) // await doesnt work here :(
        }

    });
}

const grabRegex = () => {
    return new Promise((resolve,reject) => {
        chrome.storage.local.get(['regex'], function(result) {
            if(result.regex) {
                resolve([new RegExp(result.regex.from, 'g'), result.regex.to]);
            } else {
                reject("No regex found!");
            }
            
        });
    })
}

const grabTextType = () => {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get(['textType'], function(result) {
            if(result.textType) {
                resolve(result.textType);
            } else {
                reject("No type found!");
            }
            
        });
    });
}

const pageIsFocused = () => {
    return new Promise(resolve => {
        let focusInterval = setInterval(() => {
            if(document.hasFocus()) {
                clearInterval(focusInterval);
                resolve(true);
            } else {
                if(barText.innerText != "Focus the page to copy!") {
                    barText.innerText = `Focus the page to copy!`;
                    bar.style.backgroundColor = 'rgb(255,202,54, 0.9)'
                    bar.style.color = 'white'
                }
            }
        }, 500)
    })
}

const copyToClipBoard = async(text) => {

    try {
        let regex = await grabRegex();
        text = text.replace(regex[0], regex[1])
    } catch(err) {
        console.log(err);
    }
    
    try {
        let type = await grabTextType();
        if(type == "1") {
            text = text.toLowerCase();
        } else if(type == "2") {
            text = text.toUpperCase();
        }
    } catch(err) {
        console.log(err);
    }

    console.log("Copying to clipboard", text)

    await pageIsFocused();

    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    try {
        document.execCommand('copy');
    } catch (err) {
        return showStatus(text, false, err);
    }
    textArea.blur();
    document.body.removeChild(textArea);
    return showStatus(text, true);
    
}

const showStatus = async (text, status, err) => {
    if(status) {
        console.log("Text successfully copied!");
        barText.innerText = `Text copied! - ${text.split(" ")[0].replace(/\r|\n/g, "")}...`
        bar.style.backgroundColor = 'rgb(103, 45, 211, 0.9)'
        bar.style.color = 'white'
    } else {
        console.log("An error happened", err);
        barText.innerText = `Failed to copy...`
        bar.style.backgroundColor = 'rgba(155, 27, 27, 0.9)'
        bar.style.color = 'white'
    }
    
    await timeout(1500);
    overlay.remove();
    bar.remove()

}

