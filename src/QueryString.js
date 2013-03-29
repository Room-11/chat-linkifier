/*jslint plusplus: true, white: true, browser: true, regexp: true */

/**
 * Map representing a query string
 */
var QueryString;
(function() {

    'use strict';

    /**
     * Constructor
     *
     * @param {string} str Base query string
     */
    QueryString = function(str)
    {
        var i, l, tokens;

        if (str) {
            tokens = str.split('&');

            for (i = 0, l = tokens.length; i < l; i++) {
                tokens[i] = tokens[i].match(/^([^=]*)=(.*)/);
                this[decodeURIComponent(tokens[i][1].replace(/\+/g, '%20'))] = decodeURIComponent(tokens[i][2].replace(/\+/g, '%20'));
            }
        }
    };

    /**
     * Convert the map to an encoded query string
     */
    QueryString.prototype.toString = function()
    {
        var key, result = [];

        for (key in this) {
            if (this.hasOwnProperty(key) && typeof this[key] !== 'function') {
                result.push(encodeURIComponent(key) + '=' + encodeURIComponent(this[key]));
            }
        }

        return result.join('&');
    };

}());
