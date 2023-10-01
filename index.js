import morphdom from "morphdom";
var is_global_event = function (name) {
    return ["hashchange", "popstate"].includes(name);
};
var Component = /** @class */ (function () {
    function Component(initialState, _render, opts) {
        var _this = this;
        var _a;
        this._render = _render;
        this._root = document.createElement("div");
        this._httpResponseHandler = function (response) {
            _this._maybeStateChanged(
            // @ts-ignore
            _this._receiveHTTPMessage(_this._state, response));
        };
        this._eventHandler = function (event) {
            if (!_this._events.hasOwnProperty(event.type)) {
                return;
            }
            event.preventDefault();
            event.stopImmediatePropagation();
            _this._maybeStateChanged(_this._events[event.type](_this._state, event));
        };
        this._state = initialState, // todo: need deep clone here
            this._events = (_a = opts.events) !== null && _a !== void 0 ? _a : {},
            this._updateOptions = opts.updateOptions,
            this._triggerEvent = opts.triggerEvent,
            this._sendHTTPMessage = opts.sendHTTPMessage,
            this._receiveHTTPMessage = opts.receiveHTTPMessage,
            this._opts = opts;
    }
    Component.prototype._redraw = function (newState) {
        var rendered = this._draw(newState);
        if (this._root.nodeName !== rendered.nodeName) {
            this._root.replaceWith(rendered);
            this._root = rendered;
        }
        else {
            this._root.querySelectorAll(".component").forEach(function (node) {
                // @ts-ignore
                node.component._unmount();
                // @ts-ignore
                delete node.component;
            });
            morphdom(this._root, rendered.cloneNode(true));
            var components_1 = rendered.querySelectorAll(".component");
            this._root.querySelectorAll(".component").forEach(function (node, index) {
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
        if (this._triggerEvent) {
            var event_1 = this._triggerEvent(oldState, this._state);
            if (event_1) {
                this._root.dispatchEvent(event_1);
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
        for (var event_2 in this._events) {
            if (this._events.hasOwnProperty(event_2)) {
                var target = is_global_event(event_2)
                    ? window
                    : this._root;
                target.addEventListener(event_2, this._eventHandler, true);
            }
        }
    };
    Component.prototype._unmount = function () {
        for (var event_3 in this._events) {
            if (this._events.hasOwnProperty(event_3)) {
                var target = is_global_event(event_3)
                    ? window
                    : this._root;
                target.removeEventListener(event_3, this._eventHandler, true);
            }
        }
    };
    Component.prototype._draw = function (state) {
        var rendered = this._render(state);
        rendered.classList.add("component");
        // @ts-ignore
        rendered.component = this;
        return rendered;
    };
    return Component;
}());
var make_component = function (initialState, render, opts) {
    return new Component(initialState, render, opts);
};
var draw_component = function (component) {
    component["_root"] = component._draw(component["_state"]);
    component._mount();
    return component["_root"];
};
var update_component = function (component, options) {
    return !component["_updateOptions"]
        ? component
        : make_component(component["_updateOptions"](component["_state"], options), component["_render"], component["_opts"]);
};
export { make_component, draw_component, update_component, Component };
//# sourceMappingURL=index.js.map