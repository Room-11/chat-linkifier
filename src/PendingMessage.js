var PendingMessage;

(function() {

    'use strict';

    PendingMessage = function(obj, senderId)
    {
        var i, l;

        this.messageId = obj.id;
        this.patterns = obj.patterns;
        this.senderId = senderId;
        this.timeout = setTimeout(function() {
            this.sendResponse();
        }.bind(this), 2000);

        this.result = {};
        for (i = 0, l = obj.patterns.length; i < l; i++) {
            this.result[obj.patterns[i]] = false;
        }
    };

    PendingMessage.prototype.messageId = null;

    PendingMessage.prototype.patterns = null;

    PendingMessage.prototype.senderId = null;

    PendingMessage.prototype.timeout = null;

    PendingMessage.prototype.result = null;

    PendingMessage.prototype.postResult = function(search, quickRef)
    {
        this.result[search] = quickRef;

        this.patterns.splice(this.patterns.indexOf(search), 1);
        if (!this.patterns.length) {
            this.sendResponse();
        }
    };

    PendingMessage.prototype.sendResponse = function()
    {
        var messageId = this.messageId,
            result = this.result;

        clearTimeout(this.timeout);

        chrome.tabs.sendMessage(this.senderId, {id: messageId, result: result});
    };
}());
