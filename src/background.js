/*jslint plusplus: true, white: true, browser: true, regexp: true */
/*global PendingMessage, PendingMessageTracker, LookupCache, chrome */

// Controls the scripts in the background page

(function() {

    'use strict';

    var filter = {
            urls: ['*://php.net/manual-lookup.php*', '*://*.php.net/manual-lookup.php*']
        },
        spec = ["responseHeaders","blocking"],
        pendingMessages = new PendingMessageTracker(new LookupCache(1000));

    function onHeaders(details) {
        var i, l, responseCode, result = false;

        if (details.url.match(/&__linkify/)) {
            responseCode = parseInt(details.statusLine.match(/^HTTP\/\d\.\d (\d+)/i)[1], 10);

            if (responseCode === 302) {
                for (i = 0, l = details.responseHeaders.length; i < l; i++) {
                    if (details.responseHeaders[i].name.toLowerCase() === 'location') {
                        result = details.responseHeaders[i].value.match(/\.([^.]+)\.php$/)[1];
                        break;
                    }
                }
            }

            pendingMessages.postResult(details.url.match(/pattern=([^&]+)/)[1], result);
            return {cancel: true};
        }
    }

    chrome.webRequest.onHeadersReceived.addListener(onHeaders, filter, spec);

    chrome.extension.onMessage.addListener(function(message, sender) {
        pendingMessages.addMessage(new PendingMessage(message, sender.tab.id));
    });

}());
