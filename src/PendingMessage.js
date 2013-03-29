/*jslint plusplus: true, white: true, browser: true */
/*global chrome */

/**
 * Represents a message waiting for the results of a lookup
 */
var PendingMessage;
(function() {

    'use strict';

    /**
     * Constructor
     *
     * @param {object}  obj      Message object received from content script
     * @param {integer} senderId ID of the tab that sent the message
     */
    PendingMessage = function(obj, senderId)
    {
        var i, l;

        this.messageId = obj.id;
        this.patterns  = obj.patterns;
        this.pending   = obj.patterns.length;
        this.senderId  = senderId;

        this.timeout = setTimeout(function() {
            this.sendResponse();
        }.bind(this), 2000);

        this.result = {};
        for (i = 0, l = obj.patterns.length; i < l; i++) {
            this.result[obj.patterns[i]] = false;
        }
    };

    /**
     * @var {string} The ID of the message
     */
    PendingMessage.prototype.messageId = null;

    /**
     * @var {Array} The message lookup patterns
     */
    PendingMessage.prototype.patterns = null;

    /**
     * @var {integer} The number of lookup results remaining
     */
    PendingMessage.prototype.pending = null;

    /**
     * @var {integer} ID of the tab that sent the message
     */
    PendingMessage.prototype.senderId = null;

    /**
     * @var {integer} ID of the timeout for this message
     */
    PendingMessage.prototype.timeout = null;

    /**
     * @var {object} Map of lookup results
     */
    PendingMessage.prototype.result = null;

    /**
     * @var {boolean} Whether the response has been sent
     */
    PendingMessage.prototype.sent = false;

    /**
     * Callback to handle lookup result
     *
     * @param {string}         search   The lookup pattern
     * @param {string|boolean} quickRef The lookup result
     */
    PendingMessage.prototype.postResult = function(search, quickRef)
    {
        this.result[search] = quickRef;

        if (--this.pending <= 0) {
            this.sendResponse();
        }
    };

    /**
     * Send the lookup result(s) to the content script
     */
    PendingMessage.prototype.sendResponse = function()
    {
        var messageId, result;

        if (!this.sent) {
            clearTimeout(this.timeout);
            this.sent = true;

            messageId = this.messageId;
            result = this.result;

            chrome.tabs.sendMessage(this.senderId, {id: messageId, result: result});
        }
    };

}());
