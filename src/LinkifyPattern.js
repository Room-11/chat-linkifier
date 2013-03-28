var LinkifyPattern;

(function() {

    'use strict';

    LinkifyPattern = function(search, display, original)
    {
        this.search = search;
        this.display = display;
        this.original = original;
        this.linkified = original;
    };

    LinkifyPattern.prototype.search = '';

    LinkifyPattern.prototype.display = '';

    LinkifyPattern.prototype.original = '';

    LinkifyPattern.prototype.linkified = '';

    LinkifyPattern.prototype.processLookupResult = function(quickRef)
    {
        this.linkified = '[' + this.display + '](http://php.net/' + quickRef + ')';
    };
}());
