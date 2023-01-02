function getTab() {
    return new Promise((resolve) => {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            resolve(tabs[0].id);
        });
    });
}

function captureVisibleTab() {
    return new Promise((resolve) => {
        chrome.tabs.captureVisibleTab(null, {}, function (image) {
            resolve(image);
        });
    })
}

function checkExistence() {
    if(document.getElementById('overlay-mdTess')) {
        return true;
    } else {
        return false;
    }
}

async function grabLang() {
    let language = await chrome.storage.local.get(["langSel"]);
    return language.langSel ? language.langSel : "eng";
}

async function grabMode() {
    let mode = await chrome.storage.local.get(["modeSel"]);
    return mode.modeSel ? mode.modeSel : "tess";
}

chrome.commands.onCommand.addListener((command) => {
    console.log(`Command: ${command}`);
    if(command == 'screenshot') {
        checkServer().then(active => {
            if(active) {
                chrome.runtime.sendMessage({message: "commandStarted"});
                grabText();
            }
        })
    }
});

function checkServer() {
    return new Promise((resolve, reject) => {
        fetch("http://localhost:9191/status").then((data) => {
            getTab().then(id => {
                chrome.scripting.executeScript({
                    target: {tabId: id},
                    func: checkExistence
                }, (injectionResults) => {
                    console.log(injectionResults);
                    resolve(!injectionResults[0].result)
                })
            });
        }).catch((err) => {
            console.log(err);
            reject("Server not running!");
        })
    })
    
}

function grabText() {
    getTab().then(id => {
        chrome.scripting.executeScript({
            target: {tabId: id},
            files: ['inject.js']
        })
    })
}

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        switch(request.message) {
            case 'checkIfCanRun':
                checkServer().then(active => {
                    sendResponse(active);
                }).catch(err => {
                    sendResponse(false);
                })
                
            return true;
            case 'grabMyText':
                grabText();
            break;
            case 'cropIt':
                console.log('Capturing Visible Tab');
                captureVisibleTab().then(image => sendResponse(image));
            return true;
            case 'Done':
                if(request.imageCropped) {
                    console.log('Got the screenshot, grabbing text!');
                    grabMode().then(mode => {
                        grabLang().then(lang => {
                            fetch('http://127.0.0.1:9191/decode', {
                                method: 'POST',
                                headers: {
                                    'Accept': 'application/json',
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({
                                    image: request.imageCropped,
                                    lang,
                                    mode
                                })
                            })
                            .then(res => res.json())
                            .then(res => {
                                sendResponse(res);
                            }); 
                        })
                    })
                    
                    return true;
                }
            break;
            default:
                console.log('Got weird message', request.message);
            break;
        }
    }
)
