/* global cordova:false */
/* globals window */

/*!
 * Module dependencies.
 */

var exec = cordova.require('cordova/exec');

/**
 * PushNotification constructor.
 *
 * @param {Object} options to initiate Push Notifications.
 * @return {PushNotification} instance that can be monitored and cancelled.
 */

var PushNotification = function (options, handlers) {
    this._handlers = handlers;
    this._handlers.registration = this._handlers.registration ? this._handlers.registration : [];
    this._handlers.error = this._handlers.error ? this._handlers.error : [];
    this._handlers.notification = this._handlers.notification ? this._handlers.notification : [];

    // require options parameter
    if (typeof options === 'undefined') {
        throw new Error('The options argument is required.');
    }

    // store the options to this object instance
    this.options = options;

    // triggered on registration and notification
    var that = this;
    var success = function (result) {
        if (result && typeof result.registrationId !== 'undefined') {
            that.emit('registration', result);
        } else if (result && result.additionalData && typeof result.additionalData.actionCallback !== 'undefined') {
            var executeFunctionByName = function (functionName, context /*, args */) {
                var args = Array.prototype.slice.call(arguments, 2);
                var namespaces = functionName.split('.');
                var func = namespaces.pop();
                for (var i = 0; i < namespaces.length; i++) {
                    context = context[namespaces[i]];
                }
                return context[func].apply(context, args);
            };

            executeFunctionByName(result.additionalData.actionCallback, window, result);
        } else if (result) {
            that.emit('notification', result);
        }
    };

    // triggered on error
    var fail = function (msg) {
        var e = (typeof msg === 'string') ? new Error(msg) : msg;
        that.emit('error', e);
    };

    exec(success, fail, 'PushNotification', 'init', [options]);
};

function PushNotificationBuilder() {
    this._handlers = {
        'registration': [],
        'notification': [],
        'error': []
    };

    PushNotificationBuilder.prototype.withOptions = function (options) {
        this._options = options;
        return this;
    }

    PushNotificationBuilder.prototype.withNotificationHandler = function (callback) {
        this._handlers.notification.push(callback);
        return this;
    }

    PushNotificationBuilder.prototype.withErrorHandler = function (callback) {
        this._handlers.error.push(callback);
        return this;
    }

    PushNotificationBuilder.prototype.withRegistrationHandler = function (callback) {
        this._handlers.registration.push(callback);
        return this;
    }

    PushNotificationBuilder.prototype.build = function () {
        return new PushNotification(this._options, this._handlers)
    }
}

/**
 * Unregister from push notifications
 */

PushNotification.prototype.unregister = function (successCallback, errorCallback, options) {
    if (!errorCallback) {
        errorCallback = function () {
        };
    }

    if (typeof errorCallback !== 'function') {
        console.log('PushNotification.unregister failure: failure parameter not a function');
        return;
    }

    if (typeof successCallback !== 'function') {
        console.log('PushNotification.unregister failure: success callback parameter must be a function');
        return;
    }

    var that = this;
    var cleanHandlersAndPassThrough = function () {
        if (!options) {
            that._handlers = {
                'registration': [],
                'notification': [],
                'error': []
            };
        }
        successCallback();
    };

    exec(cleanHandlersAndPassThrough, errorCallback, 'PushNotification', 'unregister', [options]);
};

/**
 * Call this to set the application icon badge
 */

PushNotification.prototype.setApplicationIconBadgeNumber = function (successCallback, errorCallback, badge) {
    if (!errorCallback) {
        errorCallback = function () {
        };
    }

    if (typeof errorCallback !== 'function') {
        console.log('PushNotification.setApplicationIconBadgeNumber failure: failure parameter not a function');
        return;
    }

    if (typeof successCallback !== 'function') {
        console.log('PushNotification.setApplicationIconBadgeNumber failure: success callback parameter must be a function');
        return;
    }

    exec(successCallback, errorCallback, 'PushNotification', 'setApplicationIconBadgeNumber', [{badge: badge}]);
};

/**
 * Get the application icon badge
 */

PushNotification.prototype.getApplicationIconBadgeNumber = function (successCallback, errorCallback) {
    if (!errorCallback) {
        errorCallback = function () {
        };
    }

    if (typeof errorCallback !== 'function') {
        console.log('PushNotification.getApplicationIconBadgeNumber failure: failure parameter not a function');
        return;
    }

    if (typeof successCallback !== 'function') {
        console.log('PushNotification.getApplicationIconBadgeNumber failure: success callback parameter must be a function');
        return;
    }

    exec(successCallback, errorCallback, 'PushNotification', 'getApplicationIconBadgeNumber', []);
};

/**
 * Get the application icon badge
 */

PushNotification.prototype.clearAllNotifications = function (successCallback, errorCallback) {
    if (!successCallback) {
        successCallback = function () {
        };
    }
    if (!errorCallback) {
        errorCallback = function () {
        };
    }

    if (typeof errorCallback !== 'function') {
        console.log('PushNotification.clearAllNotifications failure: failure parameter not a function');
        return;
    }

    if (typeof successCallback !== 'function') {
        console.log('PushNotification.clearAllNotifications failure: success callback parameter must be a function');
        return;
    }

    exec(successCallback, errorCallback, 'PushNotification', 'clearAllNotifications', []);
};

/**
 * Listen for an event.
 *
 * The following events are supported:
 *
 *   - registration
 *   - notification
 *   - error
 *
 * @param {String} eventName to subscribe to.
 * @param {Function} callback triggered on the event.
 */

PushNotification.prototype.on = function (eventName, callback) {
    if (this._handlers.hasOwnProperty(eventName)) {
        this._handlers[eventName].push(callback);
    }
};

/**
 * Remove event listener.
 *
 * @param {String} eventName to match subscription.
 * @param {Function} handle function associated with event.
 */

PushNotification.prototype.off = function (eventName, handle) {
    if (this._handlers.hasOwnProperty(eventName)) {
        var handleIndex = this._handlers[eventName].indexOf(handle);
        if (handleIndex >= 0) {
            this._handlers[eventName].splice(handleIndex, 1);
        }
    }
};

/**
 * Emit an event.
 *
 * This is intended for internal use only.
 *
 * @param {String} eventName is the event to trigger.
 * @param {*} all arguments are passed to the event listeners.
 *
 * @return {Boolean} is true when the event is triggered otherwise false.
 */

PushNotification.prototype.emit = function () {
    var args = Array.prototype.slice.call(arguments);
    var eventName = args.shift();

    if (!this._handlers.hasOwnProperty(eventName)) {
        return false;
    }

    for (var i = 0, length = this._handlers[eventName].length; i < length; i++) {
        var callback = this._handlers[eventName][i];
        if (typeof callback === 'function') {
            callback.apply(undefined, args);
        } else {
            console.log('event handler: ' + eventName + ' must be a function');
        }
    }

    return true;
};

PushNotification.prototype.finish = function (successCallback, errorCallback, id) {
    if (!successCallback) {
        successCallback = function () {
        };
    }
    if (!errorCallback) {
        errorCallback = function () {
        };
    }
    if (!id) {
        id = 'handler';
    }

    if (typeof successCallback !== 'function') {
        console.log('finish failure: success callback parameter must be a function');
        return;
    }

    if (typeof errorCallback !== 'function') {
        console.log('finish failure: failure parameter not a function');
        return;
    }

    exec(successCallback, errorCallback, 'PushNotification', 'finish', [id]);
};

/*!
 * Push Notification Plugin.
 */

module.exports = {
    /**
     * Register for Push Notifications.
     *
     * This method will instantiate a new copy of the PushNotification object
     * and start the registration process.
     *
     * @param {Object} options
     * @return {PushNotification} instance
     */

    aPushNotification: function () {
        return new PushNotificationBuilder();
    },

    clearRegistration: function(successCallback, errorCallback, options) {
        exec(successCallback, errorCallback, 'PushNotification', 'unregister', [options]);
    },

    hasPermission: function (successCallback, errorCallback) {
        exec(successCallback, errorCallback, 'PushNotification', 'hasPermission', []);
    },

    /**
     * PushNotification Object.
     *
     * Expose the PushNotification object for direct use
     * and testing. Typically, you should use the
     * .init helper method.
     */

    PushNotification: PushNotification
};
