/*jslint plusplus: true, white: true, browser: true, regexp: true */
/*global QueryString, LinkifyPattern, $ */

/**
 * Represents a message being posted to the chatroom
 */
var LinkifiedMessage;
(function() {

    'use strict';

    var lengthLimit, getTokens, addPattern;

    /**
     * Get a list of tokens in the message
     */
    getTokens = function()
    {
        var i, l, match,
            funcExpr = /^(\s*)((`?)([a-z_\x7f-\xff][a-z0-9_\x7f-\xff]*)\(\)\3)$/i,
            wordExpr = /^(\s*)`([a-z_\x7f-\xff][a-z0-9_\x7f-\xff]*)`$/i,
            tokens = this.queryString.text.match(/\s*(?:`(?:[^`\\\\]|\\\\.)*`|\S+)/g);

        for (i = 0, l = tokens.length; i < l; i++) {
            if (funcExpr.test(tokens[i])) {
                match = tokens[i].match(funcExpr);
                addPattern.call(this, match[1], match[4], "`" + match[4] + "()`", match[2]);
            } else if (wordExpr.test(tokens[i])) {
                match = tokens[i].match(wordExpr);
                addPattern.call(this, match[1], match[2], "`" + match[2] + "`", "`" + match[2] + "`");
            } else if (!this.tokens.length || this.tokens[this.tokens.length - 1] instanceof LinkifyPattern) {
                this.tokens.push(tokens[i]);
            } else {
                this.tokens[this.tokens.length - 1] += tokens[i];
            }
        }
    };

    /**
     * Add a new lookup pattern to the token list
     *
     * @param {string} space    Leading space from the token
     * @param {string} search   The pattern to search for
     * @param {string} display  The text to display
     * @param {string} original The original matched text from the message
     */
    addPattern = function(space, search, display, original)
    {
        var pattern;

        console.log(space);
        console.log(search);
        console.log(display);
        console.log(original);

        if (space.length) {
            if (!this.tokens.length || this.tokens[this.tokens.length - 1] instanceof LinkifyPattern) {
                this.tokens.push(space);
            } else {
                this.tokens[this.tokens.length - 1] += space;
            }
        }

        pattern = new LinkifyPattern(search, display, original);

        this.tokens.push(pattern);
        if (this.patterns[search] === undefined) {
            this.search.push(search);
            this.patterns[search] = pattern;
        }
    };

    /**
     * @var {integer} Maximum length of a message
     */
    lengthLimit = 500;

    /**
     * Constructor
     *
     * @param {object} ajaxOpts jQuery .ajax() options object from intercepted request
     */
    LinkifiedMessage = function(ajaxOpts)
    {
        this.queryString = new QueryString(ajaxOpts.data);
        this.originalTextLength = this.queryString.text.length;
        this.ajaxOpts = ajaxOpts;

        this.id = String((new Date()).getTime()) + Math.random();

        this.tokens = [];
        this.search = [];
        this.patterns = {};

        if (this.queryString.text && this.queryString.text.indexOf("\n") < 0) {
            getTokens.call(this);
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
