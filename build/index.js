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
  var root;
  var updateRoot = function updateRoot(newRoot) {
    root = newRoot;
  };
  var redraw = function redraw(newState) {
    var rendered = draw(newState);
    if (root.nodeName !== rendered.nodeName) {
      root.replaceWith(rendered);
      updateRoot(rendered);
    } else {
      root.querySelectorAll(".component").forEach(function (component) {
        component.unmount(component.eventHandler);
        component.updateRoot = undefined;
        component.eventHandler = undefined;
        component.mount = undefined;
        component.unmount = undefined;
      });
      (0, _morphdom["default"])(root, rendered.cloneNode(true));
      var components = rendered.querySelectorAll(".component");
      root.querySelectorAll(".component").forEach(function (component, index) {
        component.updateRoot = components[index].updateRoot;
        component.eventHandler = components[index].eventHandler;
        component.mount = components[index].mount;
        component.unmount = components[index].unmount;
        component.updateRoot(component);
        component.mount(component.eventHandler);
      });
    }
  };
  var maybeDispatchEvent = function maybeDispatchEvent(oldState) {
    if (triggerEvent) {
      var event = triggerEvent(oldState, state);
      if (event) {
        root.dispatchEvent(event);
      }
    }
  };
  var maybeStateChanged = function maybeStateChanged(newState) {
    if (newState !== state) {
      redraw(newState);
      var oldState = state;
      state = newState;
      maybeDispatchEvent(oldState);
    }
  };
  var eventHandler = function eventHandler(event) {
    if (!events.hasOwnProperty(event.type)) {
      return;
    }
    event.preventDefault();
    event.stopImmediatePropagation();
    maybeStateChanged(events[event.type](state, event));
  };
  var mount = function mount(eventHandler) {
    for (var event in events) {
      if (events.hasOwnProperty(event)) {
        var target = is_global_event(event) ? window : root;
        target.addEventListener(event, eventHandler, true);
      }
    }
  };
  var unmount = function unmount(eventHandler) {
    for (var event in events) {
      if (events.hasOwnProperty(event)) {
        var target = is_global_event(event) ? window : root;
        target.removeEventListener(event, eventHandler, true);
      }
    }
  };
  var draw = function draw(state) {
    var rendered = render(state);
    rendered.classList.add("component");
    rendered.eventHandler = eventHandler;
    rendered.updateRoot = updateRoot;
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
    updateRoot(draw(state));
    mount(eventHandler);
    return root;
  };
};
var _default = component;
exports["default"] = _default;
