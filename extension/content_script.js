/* vars */

let copyTextBTN  = document.getElementById('action');
let footer       = document.getElementsByTagName('footer')[0];
let regexFrom    = document.getElementById("regexFrom");
let regexTo      = document.getElementById("regexTo");
let regexError   = document.getElementById("regexError");
let radio        = document.querySelectorAll("input[name='text_type']");
let langSelector = document.querySelector("#langSel");
let modeSelector = document.querySelector("#modeSel");

/* events */

chrome.runtime.sendMessage({message: "checkIfCanRun"}, function(success) {
    if(success) {
        copyTextBTN.classList.remove('disabled')
    }
});

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if(request.message == "commandStarted") {
            copyTextBTN.classList.add('disabled')
        }

    }
)

/* storage */
chrome.storage.local.get(['regex', 'textType', "langSel", "modeSel"], function(result) {
    console.log("result", result);
    if(result.regex) { 
        regexFrom.value = result.regex.from;
        regexFrom.style.width = getTextWidth(regexFrom) + "px";
        regexTo.value = result.regex.to;
    }

    if(result.textType) {
        radio[result.textType].checked = true;
    } else {
        radio[0].checked = true;
    }

    if(result.langSel) {
        let options = langSelector.options;
        for(let option of options) {
            if(option.value == result.langSel) {
                option.selected = true;
            }
        }
    }

    if(result.modeSel) {
        let options = modeSelector.options;
        for(let option of options) {
            if(option.value == result.modeSel) {
                option.selected = true;
            }
        }
    }

});

/* events */ 

radio.forEach(el => el.addEventListener("change", radioChange))
regexFrom.addEventListener("input", regexSave)
regexTo.addEventListener("change", regexSave);
regexFrom.addEventListener("input", ev => ev.target.style.width = Math.floor(getTextWidth(ev.target)) + "px");
footer.addEventListener('click', _ => window.open('https://github.com/zMarcosDantas'))
langSelector.addEventListener("change", langChange);
modeSelector.addEventListener("change", modeChange);

copyTextBTN.addEventListener('click', ev => {
    if(copyTextBTN.classList.contains('disabled')) return;
    copyTextBTN.classList.add('disabled')
    console.log('Button Clicked!');
    chrome.runtime.sendMessage({message: "grabMyText"});
})

function radioChange(ev) {
    chrome.storage.local.set({textType: parseInt(ev.target.value)});
}

function regexSave(ev) {
    try {
        new RegExp(regexFrom.value)
        chrome.storage.local.set({regex: {
            from: regexFrom.value,
            to: regexTo.value
        }});
        regexError.classList.add("not-shown");
    } catch (err) {
        regexError.classList.remove("not-shown");
        console.log("Regex is invalid!");
    }
}

function langChange(ev) {
    chrome.storage.local.set({langSel: ev.target.value});
}

function modeChange(ev) {
    chrome.storage.local.set({modeSel: ev.target.value});
}

/* utils */

/**
 * returns the width of child text of any DOM node as a float
 * https://stackoverflow.com/a/50360743
 */
function getTextWidth(el) {
    // uses a cached canvas if available
    var canvas = getTextWidth.canvas || (getTextWidth.canvas = document.createElement("canvas"));
    var context = canvas.getContext("2d");
    // get the full font style property
    var font = window.getComputedStyle(el, null).getPropertyValue('font');
    var text = el.value;
    // set the font attr for the canvas text
    context.font = font;
    var textMeasurement = context.measureText(text);
    return textMeasurement.width;
}
