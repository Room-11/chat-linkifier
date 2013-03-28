var LinkifiedMessage;

(function() {

    'use strict';

    var lengthLimit, lookupExpr;

    lengthLimit = 500;
    lookupExpr = /^((?:`(?=\S)(?![a-z_\x7f-\xff][a-z0-9_\x7f-\xff]*(?:\(\))?`)(?:[^`\\]|\\.)*[^\s`]`|\[`[a-z_\x7f-\xff][a-z0-9_\x7f-\xff]*\(\)`\]|(?![a-z_\x7f-\xff][a-z0-9_\x7f-\xff]*\(\))[^`])*)(?:(^|[^\[])(?:(\b([a-z_\x7f-\xff][a-z0-9_\x7f-\xff]*)\(\)(?!`))|(`([a-z_\x7f-\xff][a-z0-9_\x7f-\xff]*)(?:\(\))?`))(?=$|[^\]]))/i;

    LinkifiedMessage = function(ajaxOpts)
    {
        var match, search, display, original, pattern;

        this.queryString = new QueryString(ajaxOpts.data);
        this.ajaxOpts = ajaxOpts;

        this.id = (new Date()).getTime() + "" + Math.random();

        this.tokens = [];
        this.search = [];
        this.patterns = {};

        if (this.queryString.text && this.queryString.text.indexOf("\n") < 0 && this.queryString.text.match(lookupExpr)) {
            this.hasWork = true;
            this.originalTextLength = this.queryString.text.length;

            while (match = this.queryString.text.match(lookupExpr)) {
                if (match[1] || match[2]) {
                    this.tokens.push(match[1] + match[2]);
                }

                search = match[4] || match[6];
                display = match[5] || "`" + match[3] + "`";
                original = match[3] || match[5];
                pattern = new LinkifyPattern(search, display, original);

                this.tokens.push(pattern);
                if (this.patterns[search] === undefined) {
                    this.search.push(search);
                    this.patterns[search] = pattern;
                }

                this.queryString.text = this.queryString.text.slice(match[0].length);
            }
            if (this.queryString.text) {
                this.tokens.push(this.queryString.text);
            }
        }
    };

    LinkifiedMessage.prototype.queryString = null;

    LinkifiedMessage.prototype.ajaxOpts = null;

    LinkifiedMessage.prototype.id = '';

    LinkifiedMessage.prototype.hasWork = false;

    LinkifiedMessage.prototype.originalTextLength = 0;

    LinkifiedMessage.prototype.tokens = null;

    LinkifiedMessage.prototype.patterns = null;

    LinkifiedMessage.prototype.processLookupResult = function(lookupResult)
    {
        var pattern, i, l, newLength, status = document.querySelector('#chat div.message.pending i');

        status.parentNode.removeChild(status);

        for (pattern in lookupResult) {
            if (lookupResult[pattern]) {
                this.patterns[pattern].processLookupResult(lookupResult[pattern]);
            }
        }

        this.queryString.text = '';
        newLength = this.originalTextLength;

        for (i = 0, l = this.tokens.length; i < l; i++) {
            if (typeof this.tokens[i] === 'string') {
                this.queryString.text += this.tokens[i];
            } else if (newLength + this.tokens[i].linkified.length <= lengthLimit) {
                this.queryString.text += this.tokens[i].linkified;
                newLength += this.tokens[i].linkified.length - this.tokens[i].original.length;
            } else {
                this.queryString.text += this.tokens[i].original;
            }
        }

        this.ajaxOpts.data = this.queryString.toString();
        this.ajaxOpts.url = this.ajaxOpts.url + '?__linkify';
        $.ajax(this.ajaxOpts);
    };
}());
