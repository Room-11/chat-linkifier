/*jslint plusplus: true, white: true, browser: true */
/*global localStorage */

/**
 * Manages the cache of lookups
 */
var LookupCache;
(function() {

    'use strict';

    /**
     * Set the most recently accessed item
     *
     * @param {string} item The most recently accessed item
     */
    var setMostRecent = function(item)
    {
        var itemList = JSON.parse(localStorage.getItem('@itemList') || '[]'),
            position = itemList.indexOf(item);

        if (position >= 0) {
            itemList.splice(position, 1);
        }

        itemList.push(item);

        while (itemList.length > this.limit) {
            localStorage.removeItem(itemList.shift());
        }

        localStorage.setItem('@itemList', JSON.stringify(itemList));
    };

    /**
     * Constructor
     *
     * @param {integer} limit The maximum number of items to hold in the cache
     */
    LookupCache = function(limit)
    {
        this.limit = limit || 1000;
    };

    /**
     * @var {integer} The maximum number of items to hold in the cache
     */
    LookupCache.prototype.limit = null;

    /**
     * Add an item to the cache
     *
     * @param {string}         pattern  The item key
     * @param {string|boolean} quickRef The item value
     */
    LookupCache.prototype.setItem = function(pattern, quickRef)
    {
        setMostRecent.call(this, pattern);
        localStorage.setItem(pattern, quickRef);
    };

    /**
     * Get an item from the cache
     *
     * @param {string} pattern The item key
     */
    LookupCache.prototype.getItem = function(pattern)
    {
        setMostRecent.call(this, pattern);
        return localStorage.getItem(pattern) !== 'false'
                   ? localStorage.getItem(pattern)
                   : false;
    };

    /**
     * Check if the cache contains an item
     *
     * @param {string} pattern The item key
     */
    LookupCache.prototype.hasItem = function(pattern)
    {
        return localStorage.getItem(pattern) !== null;
    };

}());
