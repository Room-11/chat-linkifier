var QueryString;

(function() {
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
