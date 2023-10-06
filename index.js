"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Component = exports.update_component = exports.draw_component = exports.make_component = void 0;
var tslib_1 = require("tslib");
var morphdom_1 = tslib_1.__importDefault(require("morphdom"));
var Component = /** @class */ (function () {
    function Component(initialState, _render, opts) {
        var _this = this;
        var _a, _b, _c;
        this._render = _render;
        this._root = document.createElement("div");
        this._httpResponseHandler = function (response) {
            response.text().then(function (body) {
                return _this._maybeStateChanged(
                // @ts-ignore
                _this._receiveHTTPMessage(_this._state, response, body));
            });
        };
        this._localEventHandler = function (event) {
            if (!_this._localEvents.hasOwnProperty(event.type)) {
                return;
            }
            if (["submit", "click"].includes(event.type)) {
                event.preventDefault();
            }
            event.stopImmediatePropagation();
            _this._maybeStateChanged(_this._localEvents[event.type](_this._state, event));
        };
        this._globalEventHandler = function (event) {
            if (!_this._globalEvents.hasOwnProperty(event.type)) {
                return;
            }
            _this._maybeStateChanged(_this._globalEvents[event.type](_this._state, event));
        };
        this._state = initialState; // todo: need deep clone here
        this._localEvents = (_a = opts.localEvents) !== null && _a !== void 0 ? _a : {};
        this._globalEvents = (_b = opts.globalEvents) !== null && _b !== void 0 ? _b : {};
        this._updateOptions = opts.updateOptions;
        this._triggerLocalEvent = opts.triggerLocalEvent;
        this._triggerGlobalEvent = opts.triggerGlobalEvent;
        this._sendHTTPMessage = opts.sendHTTPMessage;
        this._receiveHTTPMessage = opts.receiveHTTPMessage;
        this._captureEvents = (_c = opts.captureEvents) !== null && _c !== void 0 ? _c : false;
        this._opts = opts;
        this._maybeMakeRequest(null);
    }
    Component.prototype._redraw = function (newState) {
        var rendered = this._draw(newState);
        if (this._root.nodeName !== rendered.nodeName) {
            this._root.replaceWith(rendered);
            this._root = rendered;
        }
        else {
            this._root.querySelectorAll(".na-component").forEach(function (node) {
                // @ts-ignore
                node.component._unmount();
                // @ts-ignore
                delete node.component;
            });
            (0, morphdom_1.default)(this._root, rendered.cloneNode(true));
            var components_1 = rendered.querySelectorAll(".na-component");
            this._root.querySelectorAll(".na-component").forEach(function (node, index) {
                // @ts-ignore
                node.component = components_1[index].component;
                // @ts-ignore
                node.component._root = node;
                // @ts-ignore
                node.component._mount();
            });
        }
    };
    Component.prototype._maybeDispatchEvent = function (oldState) {
        if (this._triggerLocalEvent) {
            var event_1 = this._triggerLocalEvent(oldState, this._state);
            if (event_1) {
                this._root.dispatchEvent(event_1);
            }
        }
        if (this._triggerGlobalEvent) {
            var event_2 = this._triggerGlobalEvent(oldState, this._state);
            if (event_2) {
                window.dispatchEvent(event_2);
            }
        }
    };
    Component.prototype._maybeMakeRequest = function (oldState) {
        if (this._sendHTTPMessage) {
            var request = this._sendHTTPMessage(oldState, this._state);
            if (request) {
                var promise = fetch(request);
                if (this._receiveHTTPMessage) {
                    promise.then(this._httpResponseHandler);
                }
            }
        }
    };
    Component.prototype._maybeStateChanged = function (newState) {
        if (newState !== this._state) {
            this._redraw(newState);
            var oldState = this._state;
            this._state = newState;
            this._maybeMakeRequest(oldState);
            this._maybeDispatchEvent(oldState);
        }
    };
    Component.prototype._mount = function () {
        for (var event_3 in this._localEvents) {
            if (this._localEvents.hasOwnProperty(event_3)) {
                this._root.addEventListener(event_3, this._localEventHandler, this._captureEvents);
            }
        }
        for (var event_4 in this._globalEvents) {
            if (this._globalEvents.hasOwnProperty(event_4)) {
                window.addEventListener(event_4, this._globalEventHandler, this._captureEvents);
            }
        }
    };
    Component.prototype._unmount = function () {
        for (var event_5 in this._localEvents) {
            if (this._localEvents.hasOwnProperty(event_5)) {
                this._root.removeEventListener(event_5, this._localEventHandler, this._captureEvents);
            }
        }
        for (var event_6 in this._globalEvents) {
            if (this._globalEvents.hasOwnProperty(event_6)) {
                this._root.removeEventListener(event_6, this._globalEventHandler, this._captureEvents);
            }
        }
    };
    Component.prototype._draw = function (state) {
        var rendered = this._render(state);
        rendered.classList.add("na-component");
        // @ts-ignore
        rendered.component = this;
        return rendered;
    };
    return Component;
}());
exports.Component = Component;
var make_component = function (initialState, render, opts) {
    return new Component(initialState, render, opts);
};
exports.make_component = make_component;
var draw_component = function (component) {
    // @ts-ignore
    component._root = component._draw(component._state);
    // @ts-ignore
    component._mount();
    // @ts-ignore
    return component._root;
};
exports.draw_component = draw_component;
var update_component = function (component, options) {
    // @ts-ignore
    return !component._updateOptions
        ? component
        : (function (updateOptions) { return make_component(updateOptions(
        // @ts-ignore
        component._state, options), 
        // @ts-ignore
        component._render, 
        // @ts-ignore
        component._opts
        // @ts-ignore
        ); })(component._updateOptions);
};
exports.update_component = update_component;
//# sourceMappingURL=index.js.map