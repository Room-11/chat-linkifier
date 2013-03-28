var PendingMessageTracker;

(function() {

    'use strict';

    var cacheLimit = 1000;

    PendingMessageTracker = function()
    {
        this.patternMap = {};
        this.cacheMap = {};
        this.cacheList = [];
    };

    PendingMessageTracker.prototype.patternMap = null;

    PendingMessageTracker.prototype.addMessage = function(message)
    {
        var i, l, fromCache = [], xhr;

        for (i = 0, l = message.patterns.length; i < l; i++) {
            if (this.cacheMap[message.patterns[i]] !== undefined) {
                fromCache.push(message.patterns[i]);
            } else {
                if (this.patternMap[message.patterns[i]] === undefined) {
                    this.patternMap[message.patterns[i]] = [];

                    xhr = new XMLHttpRequest();
                    xhr.open('HEAD', 'http://php.net/manual-lookup.php?scope=quickref&pattern=' + escape(message.patterns[i]) + '&__linkify', true);
                    xhr.send(null);
                }

                this.patternMap[message.patterns[i]].push(message)
            }
        }
        
        for (i = 0, l = fromCache.length; i < l; i++) {
            this.cacheList.splice(this.cacheList.indexOf(fromCache[i]), 1);
            this.cacheList.push(fromCache[i]);

            message.postResult(fromCache[i], this.cacheMap[fromCache[i]]);
        }
    };

    PendingMessageTracker.prototype.postResult = function(search, quickRef)
    {
        var i, l;

        if (this.patternMap[search] !== undefined) {
            for (i = 0, l = this.patternMap[search].length; i < l; i++) {
                this.patternMap[search][i].postResult(search, quickRef);
            }

            delete this.patternMap[search];

            this.cacheMap[search] = quickRef;
            this.cacheList.push(search);
            while (this.cacheList.length > cacheLimit) {
                delete this.patternMap[this.cacheList.shift()];
            }
        }
    };
}());
