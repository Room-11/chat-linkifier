/*jslint plusplus: true, white: true, browser: true */

/**
 * Represents a candidate pattern for linkifying
 */
var LinkifyPattern;
(function() {

    'use strict';

    /**
     * Constructor
     *
     * @param {string} search   The pattern search term
     * @param {string} display  The markdown text to be displayed
     * @param {string} original The original text
     */
    LinkifyPattern = function(search, display, original)
    {
        this.search = search;
        this.display = display;
        this.original = original;
        this.linkified = original;
    };

    /**
     * @var {string} The pattern search term
     */
    LinkifyPattern.prototype.search = '';

    /**
     * @var {string} The markdown text to be displayed
     */
    LinkifyPattern.prototype.display = '';

    /**
     * @var {string} The original text
     */
    LinkifyPattern.prototype.original = '';

    /**
     * @var {string} The linkified (result) text
     */
    LinkifyPattern.prototype.linkified = '';

    /**
     * @var {string} Process the return value of a lookup
     */
    LinkifyPattern.prototype.processLookupResult = function(quickRef)
    {
        this.linkified = '[' + this.display + '](http://php.net/' + quickRef + ')';
    };

}());
