/*jslint plusplus: true, white: true, browser: true */
/*global chrome, ChromeExtensionRelay */

// Intermediary between the worker injected directly into the scope of the chat page and the background page

(function() {

    'use strict';

    var relay;

    function injectScripts(scripts)
    {
        var i, l, scriptEl;
        
        for (i = 0, l = scripts.length; i < l; i++) {
            scriptEl = document.createElement('script');
            scriptEl.type = 'text/javascript';
            scriptEl.src = chrome.extension.getURL(scripts[i]);
            document.head.appendChild(scriptEl);
        }
    }

    relay = new ChromeExtensionRelay('linkify');
    relay.onMessage(function(message) {
        chrome.extension.sendMessage(message);
    });
    chrome.extension.onMessage.addListener(function(message) {
        relay.sendMessage(message);
    });

    injectScripts([
        "ChromeExtensionRelay.js",
        "QueryString.js",
        "LinkifyPattern.js",
        "LinkifiedMessage.js",
        "inject.js"
    ]);

}());
