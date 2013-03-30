/*jslint plusplus: true, white: true, browser: true, unparam: true */
/*global ChromeExtensionRelay, $, LinkifiedMessage */

/**
 * Controls the worker injected directly into the scope of the chat page
 *
 * Wrapped in setTimeout to allow other injected scripts to load before this is run
 */
setTimeout(function() {

    'use strict';

    var pendingMessages, newMessageExpr, relay, statusMessage;

    function cleanStatusMessages()
    {
        var i, l, status = document.querySelectorAll('#chat div.message.pending i');

        for (i = 0, l = status.length; i < l; i++) {
            if (status[i].firstChild.data.slice(0, statusMessage.length) === statusMessage) {
                while (status[i].children.length) {
                    status[i].removeChild(status[i].children[0]);
                }

                status[i].firstChild.data = status[i].firstChild.data.replace(/[\s\-]+$/, '');
            }
        }
    }

    pendingMessages = {};
    newMessageExpr = /\/messages\/(?:new|\d+)$/;
    relay = new ChromeExtensionRelay('linkify');
    statusMessage = 'Resolving manual links, please wait...';

    relay.onMessage(function(data) {
        if (pendingMessages[data.id] !== undefined) {
            pendingMessages[data.id].processLookupResult(data.result);
        }
    });

    $(document).ajaxSend(function(ev, xhr, opts) {
        var message;

        if (opts.url.match(newMessageExpr)) {
            message = new LinkifiedMessage(opts);

            if (message.search.length) {
                pendingMessages[message.id] = message;

                xhr.abort(statusMessage);
                relay.sendMessage({id: message.id, patterns: message.search});

                setTimeout(cleanStatusMessages, 0);
            }
        }
    });

}, 500);
