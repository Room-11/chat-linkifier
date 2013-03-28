/*jslint plusplus: true, white: true, browser: true */
/*global chrome */

/**
 * Provides a simple API to relay messages between the page context and a content script
 */
var ChromeExtensionRelay;
(function() {

    'use strict';

     var processSendQueue, handleSend, handleComplete, handleDrain;

    /**
     * Process the next item in the queue of messages waiting to be sent
     */
    processSendQueue = function()
    {
        if (this.sendQueue.length && this.textEl.data === '') {
            this.textEl.data = JSON.stringify(this.sendQueue[0][0]);
            this.relayEl.dispatchEvent(this.sndEvent);
        }
    };

    /**
     * Handle a Send event received from the remote script
     */
    handleSend = function()
    {
        var i, l, response,
            messageData = JSON.parse(this.textEl.data),
            responder = function(data) {
                if (response === undefined) {
                    response = data;
                }
            };

        for (i = 0, l = this.messageCallbacks.length; i < l; i++) {
            this.messageCallbacks[i].call(null, messageData, responder);
        }

        this.textEl.data = response !== undefined ? JSON.stringify(response) : '!';
        this.relayEl.dispatchEvent(this.rcvEvent);
    };

    /**
     * Handle a Complete event received from the remote script
     */
    handleComplete = function()
    {
        if (this.textEl.data !== '!' && typeof this.sendQueue[0][1] === 'function') {
            this.sendQueue[0][1].call(null, this.textEl.data === '' ? '' : JSON.parse(this.textEl.data));
        }

        this.textEl.data = '';
        this.sendQueue.shift();

        if (this.sendQueue.length) {
            processSendQueue.call(this);
        } else {
            this.relayEl.dispatchEvent(this.drnEvent);
        }
    };

    /**
     * Handle a Drain event received from the remote script
     */
    handleDrain = function()
    {
        processSendQueue.call(this);
    };

    /**
     * Constructor
     *
     * @param {string} id ID suffix for this instance to use
     */
    ChromeExtensionRelay = function(id)
    {
        var sndPrefix, rcvPrefix;

        this.relayEl = document.getElementById('extension-relay-' + id);
        if (this.relayEl) {
            this.textEl = this.relayEl.firstChild;
        } else {
            this.relayEl = document.createElement('div');
            this.textEl = document.createTextNode('');
            this.relayEl.appendChild(this.textEl);
            this.relayEl.id = 'extension-relay-' + id;
            this.relayEl.style.display = 'none';
            document.body.appendChild(this.relayEl);
        }

        sndPrefix = chrome.extension ? 'Extn' : 'Page';
        rcvPrefix = chrome.extension ? 'Page' : 'Extn';
        this.relayEl.addEventListener(rcvPrefix + 'Send',     handleSend.bind(this));
        this.relayEl.addEventListener(sndPrefix + 'Complete', handleComplete.bind(this));
        this.relayEl.addEventListener(rcvPrefix + 'Drain',    handleDrain.bind(this));
        this.sndEvent = document.createEvent('Event');
        this.rcvEvent = document.createEvent('Event');
        this.drnEvent = document.createEvent('Event');
        this.sndEvent.initEvent(sndPrefix + 'Send',     false, false);
        this.rcvEvent.initEvent(rcvPrefix + 'Complete', false, false);
        this.drnEvent.initEvent(sndPrefix + 'Drain',    false, false);

        this.sendQueue = [];
        this.messageCallbacks = [];
    };

    /**
     * @var {HTMLDivElement} Element used for relaying events
     */
    ChromeExtensionRelay.prototype.relayEl = null;

    /**
     * @var {Text} Text node used for passing data
     */
    ChromeExtensionRelay.prototype.textEl = null;

    /**
     * @var {Event} Event dispatched when a message is being send
     */
    ChromeExtensionRelay.prototype.sndEvent = null;

    /**
     * @var {Event} Event dispatched when a received message has been processed
     */
    ChromeExtensionRelay.prototype.rcvEvent = null;

    /**
     * @var {Event} Event dispatched when a the send queue is empty
     */
    ChromeExtensionRelay.prototype.drnEvent = null;

    /**
     * @var {Array} Queue of messages waiting to be send
     */
    ChromeExtensionRelay.prototype.sendQueue = null;

    /**
     * @var {Array} Stack of message handler callbacks
     */
    ChromeExtensionRelay.prototype.messageCallbacks = null;

    /**
     * Send a message to the remote script
     *
     * @param {object}   message  The message to send
     * @param {function} callback Callback to execute when the message has been processed by the remote script
     *
     * @throws Error When the callback is specified and not a valid function
     */
    ChromeExtensionRelay.prototype.sendMessage = function(message, callback)
    {
        if (callback !== undefined && callback !== null && typeof callback !== 'function') {
            throw new Error('Callback must be a valid function');
        }

        this.sendQueue.push([message, callback]);
        processSendQueue.call(this);
    };

    /**
     * Register a callback to handle messages from the remote script
     *
     * @param {function} callback Callback to execute when a message is received from the remote script
     *
     * @throws Error When the callback is not a valid function
     */
    ChromeExtensionRelay.prototype.onMessage = function(callback)
    {
        if (typeof callback !== 'function') {
            throw new Error('Message handler must be a valid function');
        }

        this.messageCallbacks.push(callback);
    };
}());
