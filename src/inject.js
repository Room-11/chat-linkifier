/*jslint plusplus: true, white: true, browser: true, unparam: true */
/*global ChromeExtensionRelay, $, LinkifiedMessage */

// Controls the worker injected directly into the scope of the chat page

(function() {

    'use strict';

    var pendingMessages = {},
        newMessageExpr = /\/messages\/(?:new|\d+)$/,
        relay = new ChromeExtensionRelay('linkify');

    relay.onMessage(function(data) {
        if (pendingMessages[data.id] !== undefined) {
            pendingMessages[data.id].processLookupResult(data.result);
        }
    });

    $(document).ajaxSend(function(ev, xhr, opts) {
        var message;

        if (opts.url.match(newMessageExpr)) {
            message = new LinkifiedMessage(opts);

            if (message.hasWork) {
                xhr.abort('Resolving manual links, please wait...');
                pendingMessages[message.id] = message;
                relay.sendMessage({'id': message.id, patterns: message.search});

                setTimeout(function() {
                    var status = document.querySelector('#chat div.message.pending i');

                    while (status.children.length) {
                        status.removeChild(status.children[0]);
                    }

                    status.firstChild.data = status.firstChild.data.replace(/[\s\-]+$/, '');
                }, 0);
            }
        }
    });

}());
