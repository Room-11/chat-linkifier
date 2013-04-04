/*jslint plusplus: true, white: true, browser: true, regexp: true */
/*global QueryString, LinkifyPattern, $ */

/**
 * Represents a message being posted to the chatroom
 */
var LinkifiedMessage;
(function() {

    'use strict';

    var lengthLimit, getTokens, addPattern, addString, stringifyTokens;

    stringifyTokens = function()
    {
        var i, l, result = '', newLength = this.originalTextLength;

        for (i = 0, l = this.tokens.length; i < l; i++) {
            if (typeof this.tokens[i] === 'string') {
                result += this.tokens[i];
            } else if (newLength + this.tokens[i].linkified.length <= lengthLimit) {
                result += this.tokens[i].linkified;
                newLength += this.tokens[i].linkified.length - this.tokens[i].original.length;
            } else {
                result += this.tokens[i].original;
            }
        }

        return result;
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
     * Add a string literal to the token list
     *
     * @param {string} str String to add
     */
    addString = function(str)
    {
        if (!this.tokens.length || this.tokens[this.tokens.length - 1] instanceof LinkifyPattern) {
            this.tokens.push(str);
        } else {
            this.tokens[this.tokens.length - 1] += str;
        }
    };

    /**
     * Get a list of tokens in the message
     */
    getTokens = function()
    {
        var i, l, match, modified,
            funcExpr = /^(\s*)((`?)([a-z_\x7f-\xff][a-z0-9_\x7f-\xff]*)\(\)\3)$/i,
            wordExpr = /^(\s*)`([a-z_\x7f-\xff][a-z0-9_\x7f-\xff]*)`$/i,
            googleExpr = /^(\s*google[ \t]+)"((?:[^"\\]|\\.)+)"$/i,
            tokens = this.queryString.text.match(/\s*(?:google[ \t]+"(?:[^"\\]|\\.)+"|`(?:[^`\\]|\\.)*`|\S+)/ig);

        for (i = 0, l = tokens.length; i < l; i++) {
            if (funcExpr.test(tokens[i])) {
                match = tokens[i].match(funcExpr);
                addPattern.call(this, match[1], match[4], "`" + match[4] + "()`", match[2]);
            } else if (wordExpr.test(tokens[i])) {
                match = tokens[i].match(wordExpr);
                addPattern.call(this, match[1], match[2], "`" + match[2] + "`", "`" + match[2] + "`");
            } else if (googleExpr.test(tokens[i])) {
                match = tokens[i].match(googleExpr);
                match[2] = match[2].replace(/\\([\\"])/g, '$1');
                modified = match[1] + '"[' + match[2] + '](https://google.com/search?q=' + escape(match[2]) + ')"';

                addString.call(this, modified);

                this.originalTextLength += modified.length - match[0].length;
                this.modified = true;
            } else {
                addString.call(this, tokens[i]);
            }
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

            if (this.modified) {
                this.queryString.text = stringifyTokens.call(this);
                this.ajaxOpts.data = this.queryString.toString();
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
     * @var {boolean} Whether the message has been modified
     */
    LinkifiedMessage.prototype.modified = false;

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
        var pattern, status = document.querySelector('#chat div.message.pending i');

        status.parentNode.removeChild(status);

        for (pattern in lookupResult) {
            if (lookupResult.hasOwnProperty(pattern) && lookupResult[pattern]) {
                this.patterns[pattern].processLookupResult(lookupResult[pattern]);
            }
        }

        this.queryString.text = stringifyTokens.call(this);
        this.ajaxOpts.data = this.queryString.toString();
        this.ajaxOpts.url = this.ajaxOpts.url + '?__linkify';
        $.ajax(this.ajaxOpts);
    };

}());
