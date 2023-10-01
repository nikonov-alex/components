"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.update_component = exports.make_component = exports.draw_component = void 0;
var _morphdom = _interopRequireDefault(require("morphdom"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, _toPropertyKey(descriptor.key), descriptor); } }
function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }
function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return _typeof(key) === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (_typeof(input) !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (_typeof(res) !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
var is_global_event = function is_global_event(name) {
  return ["hashchange", "popstate"].includes(name);
};
var Component = /*#__PURE__*/function () {
  function Component(initialState, render, opts) {
    var _this = this,
      _opts$events;
    _classCallCheck(this, Component);
    _defineProperty(this, "_httpResponseHandler", function (response) {
      _this._maybeStateChanged(_this._receiveHTTPMessage(_this._state, response));
    });
    _defineProperty(this, "_eventHandler", function (event) {
      if (!_this._events.hasOwnProperty(event.type)) {
        return;
      }
      event.preventDefault();
      event.stopImmediatePropagation();
      _this._maybeStateChanged(_this._events[event.type](_this._state, event));
    });
    this._state = initialState,
    // todo: need deep clone here
    this._root = null, this._render = render, this._events = (_opts$events = opts.events) !== null && _opts$events !== void 0 ? _opts$events : {}, this._updateOptions = opts.updateOptions, this._triggerEvent = opts.triggerEvent, this._sendHTTPMessage = opts.sendHTTPMessage, this._receiveHTTPMessage = opts.receiveHTTPMessage, this._opts = opts;
  }
  _createClass(Component, [{
    key: "_redraw",
    value: function _redraw(newState) {
      var rendered = this._draw(newState);
      if (this._root.nodeName !== rendered.nodeName) {
        this._root.replaceWith(rendered);
        this._root = rendered;
      } else {
        this._root.querySelectorAll(".component").forEach(function (node) {
          node.component._unmount();
          delete node.component;
        });
        (0, _morphdom["default"])(this._root, rendered.cloneNode(true));
        var components = rendered.querySelectorAll(".component");
        this._root.querySelectorAll(".component").forEach(function (node, index) {
          node.component = components[index].component;
          node.component._root = node;
          node.component._mount();
        });
      }
    }
  }, {
    key: "_maybeDispatchEvent",
    value: function _maybeDispatchEvent(oldState) {
      if (this._triggerEvent) {
        var event = this._triggerEvent(oldState, this._state);
        if (event) {
          this._root.dispatchEvent(event);
        }
      }
    }
  }, {
    key: "_maybeMakeRequest",
    value: function _maybeMakeRequest(oldState) {
      if (this._sendHTTPMessage) {
        var request = this._sendHTTPMessage(oldState, this._state);
        if (request) {
          var promise = fetch(request);
          if (this._receiveHTTPMessage) {
            promise.then(this._httpResponseHandler);
          }
        }
      }
    }
  }, {
    key: "_maybeStateChanged",
    value: function _maybeStateChanged(newState) {
      if (newState !== this._state) {
        this._redraw(newState);
        var oldState = this._state;
        this._state = newState;
        this._maybeMakeRequest(oldState);
        this._maybeDispatchEvent(oldState);
      }
    }
  }, {
    key: "_mount",
    value: function _mount() {
      for (var event in this._events) {
        if (this._events.hasOwnProperty(event)) {
          var target = is_global_event(event) ? window : this._root;
          target.addEventListener(event, this._eventHandler, true);
        }
      }
    }
  }, {
    key: "_unmount",
    value: function _unmount() {
      for (var event in this._events) {
        if (this._events.hasOwnProperty(event)) {
          var target = is_global_event(event) ? window : this._root;
          target.removeEventListener(event, this._eventHandler, true);
        }
      }
    }
  }, {
    key: "_draw",
    value: function _draw(state) {
      var rendered = this._render(state);
      rendered.classList.add("component");
      rendered.component = this;
      return rendered;
    }
  }]);
  return Component;
}();
var make_component = function make_component(initialState, render, opts) {
  return new Component(initialState, render, opts);
};
exports.make_component = make_component;
var draw_component = function draw_component(component) {
  component._root = component._draw(component._state);
  component._mount();
  return component._root;
};
exports.draw_component = draw_component;
var update_component = function update_component(component, options) {
  return !component._updateOptions ? component : make_component(component._updateOptions(component._state, options), component._render, component._opts);
};
exports.update_component = update_component;
