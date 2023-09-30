"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _morphdom = _interopRequireDefault(require("morphdom"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
var is_global_event = function is_global_event(name) {
  return ["hashchange", "popstate"].includes(name);
};
var component = function component(initialState, render, _ref) {
  var _ref$events = _ref.events,
    events = _ref$events === void 0 ? {} : _ref$events,
    _ref$updateOptions = _ref.updateOptions,
    updateOptions = _ref$updateOptions === void 0 ? function (state, options) {
      return state;
    } : _ref$updateOptions,
    _ref$triggerEvent = _ref.triggerEvent,
    triggerEvent = _ref$triggerEvent === void 0 ? false : _ref$triggerEvent;
  var state = initialState;
  var redraw = function redraw(mounted, newState) {
    var rendered = draw(newState);
    if (mounted.nodeName !== rendered.nodeName) {
      mounted.replaceWith(rendered);
      return rendered;
    } else {
      mounted.querySelectorAll(".component").forEach(function (mounted) {
        mounted.unmount(mounted, mounted.handler);
        mounted.handler = undefined;
        mounted.mount = undefined;
        mounted.unmount = undefined;
      });
      (0, _morphdom["default"])(mounted, rendered.cloneNode(true));
      var components = rendered.querySelectorAll(".component");
      mounted.querySelectorAll(".component").forEach(function (mounted, index) {
        mounted.handler = components[index].mount(mounted);
        mounted.mount = components[index].mount;
        mounted.unmount = components[index].unmount;
      });
      return mounted;
    }
  };
  var maybeDispatchEvent = function maybeDispatchEvent(node, oldState) {
    if (triggerEvent) {
      var event = triggerEvent(oldState, state);
      if (event) {
        node.dispatchEvent(event);
      }
    }
  };
  var handler = function handler(event) {
    if (!events.hasOwnProperty(event.type)) {
      return;
    }
    event.preventDefault();
    event.stopImmediatePropagation();
    var newState = events[event.type](state, event);
    if (newState !== state) {
      var node = redraw(this, newState);
      var oldState = state;
      state = newState;
      maybeDispatchEvent(node, oldState);
    }
  };
  var mount = function mount(node) {
    var h = handler.bind(node);
    for (var event in events) {
      if (events.hasOwnProperty(event)) {
        var target = is_global_event(event) ? window : node;
        target.addEventListener(event, h, true);
      }
    }
    return h;
  };
  var unmount = function unmount(node, handler) {
    for (var event in events) {
      if (events.hasOwnProperty(event)) {
        var target = is_global_event(event) ? window : node;
        target.removeEventListener(event, handler, true);
      }
    }
  };
  var draw = function draw(state) {
    var rendered = render(state);
    rendered.classList.add("component");
    rendered.handler = mount(rendered);
    rendered.mount = mount;
    rendered.unmount = unmount;
    return rendered;
  };
  return function () {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
    var newState = updateOptions(state, options);
    if (state !== newState) {
      state = newState;
    }
    return draw(state);
  };
};
var _default = component;
exports["default"] = _default;
