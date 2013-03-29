/*jslint plusplus: true, white: true, browser: true, regexp: true */
/*global QueryString, LinkifyPattern, $ */

var LinkifiedMessage;
(function() {

    'use strict';

    var lengthLimit, lookupExpr;

    /**
     * @var {integer} Maximum length of a message
     */
    lengthLimit = 500;

    /**
     * @var {RegExp} Pattern used to match lookup candidates
     */
    lookupExpr = /^((?:`(?=\S)(?![a-z_\x7f-\xff][a-z0-9_\x7f-\xff]*(?:\(\))?`)(?:[^`\\]|\\.)*[^\s`]`|\[`[a-z_\x7f-\xff][a-z0-9_\x7f-\xff]*\(\)`\]|(?![a-z_\x7f-\xff][a-z0-9_\x7f-\xff]*\(\))[^`])*)(?:(^|[^\[])(?:(\b([a-z_\x7f-\xff][a-z0-9_\x7f-\xff]*)\(\)(?!`))|(`([a-z_\x7f-\xff][a-z0-9_\x7f-\xff]*)(?:\(\))?`))(?=$|[^\]]))/i;

    /**
     * Constructor
     *
     * @param {object} ajaxOpts jQuery .ajax() options object from intercepted request
     */
    LinkifiedMessage = function(ajaxOpts)
    {
        var match, search, display, original, pattern;

        this.queryString = new QueryString(ajaxOpts.data);
        this.ajaxOpts = ajaxOpts;

        this.id = String((new Date()).getTime()) + Math.random();

        this.tokens = [];
        this.search = [];
        this.patterns = {};

        if (this.queryString.text && this.queryString.text.indexOf("\n") < 0 && this.queryString.text.match(lookupExpr)) {
            this.hasWork = true;
            this.originalTextLength = this.queryString.text.length;

            match = this.queryString.text.match(lookupExpr);
            while (match) {
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
                match = this.queryString.text.match(lookupExpr);
            }
            if (this.queryString.text) {
                this.tokens.push(this.queryString.text);
            }
        }
    };

    /**
     * @var {QueryString} Object representing the raw POST request data
     */
    LinkifiedMessage.prototype.queryString = null;

    /**
     * @var {object} jQuery .ajax() options object from intercepted request
     */
    LinkifiedMessage.prototype.ajaxOpts = null;

    /**
     * @var {string} Unique identifier for this message
     */
    LinkifiedMessage.prototype.id = '';

    /**
     * @var {boolean} Whether the message contains any lookup candidates
     */
    LinkifiedMessage.prototype.hasWork = false;

    /**
     * @var {integer} Original length of the message in characters
     */
    LinkifiedMessage.prototype.originalTextLength = 0;

    /**
     * @var {Array} Ordered list of tokens in the message
     */
    LinkifiedMessage.prototype.tokens = null;

    /**
     * @var {Array} List of lookup patterns in the message
     */
    LinkifiedMessage.prototype.search = null;

    /**
     * @var {object} Map of lookup patterns in the message
     */
    LinkifiedMessage.prototype.patterns = null;

    /**
     * @var {string} Process the return value of a lookup
     */
    LinkifiedMessage.prototype.processLookupResult = function(lookupResult)
    {
        var pattern, i, l, newLength, status = document.querySelector('#chat div.message.pending i');

        status.parentNode.removeChild(status);

        for (pattern in lookupResult) {
            if (lookupResult.hasOwnProperty(pattern) && lookupResult[pattern]) {
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
