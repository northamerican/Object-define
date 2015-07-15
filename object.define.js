// Object.define.js
// Define properties, getters, setters, and self-referencing values with a concise syntax

// Function.name polyfill
// https://github.com/JamesMGreene/Function.name
(function() {
    var fnNamePrefixRegex = /^[\S\s]*?function\s*/;
    var fnNameSuffixRegex = /[\s\(\/][\S\s]+$/;

    function _name() {
      var name = "";
      if (this === Function || this === Function.prototype.constructor) {
        name = "Function";
      }
      else if (this !== Function.prototype) {
        name = ("" + this).replace(fnNamePrefixRegex, "").replace(fnNameSuffixRegex, "");
      }
      return name;
    }

    // Inspect the polyfill-ability of this browser
    var needsPolyfill = !("name" in Function.prototype && "name" in (function x() {}));
    var canDefineProp = typeof Object.defineProperty === "function" &&
      (function() {
        var result;
        try {
          Object.defineProperty(Function.prototype, "_xyz", {
            get: function() {
              return "blah";
            },
            configurable: true
          });
          result = Function.prototype._xyz === "blah";
          delete Function.prototype._xyz;
        }
        catch (e) {
          result = false;
        }
        return result;
      })();

    // Add the "private" property for testing, even if the real property can be polyfilled
    Function.prototype._name = _name;

    // Polyfill it!
    if (canDefineProp && needsPolyfill) {
      Object.defineProperty(Function.prototype, "name", {
        get: _name
      });
    }
})();

Object.defineProperty(Object.prototype, 'define', {
    value: function(obj) {
        if (!(this instanceof Object.prototype.define)) {
            return new Object.prototype.define(obj);
        }

        var that = this;

        this.obj = obj;
        this.evalQueue = [];
        this.all = {};
        this.argTypes = function(args) {
            return Array.prototype.slice.call(args).map(function(arg) {
                return typeof arg;
            });
        };

        this.attemptEval = function(name) {
            that.evalQueue.forEach(function(method, i) {
                try{
                    that.obj[method.name] = method.method.call(that.obj);
                    that.evalQueue.splice(i, 1);
                } catch(e){}
            });
        };

        // After Object.define has completed and parent function completes
        setTimeout(function() {
            var evalFailed;

            if (that.evalQueue.length) {
                evalFailed = that.evalQueue.map(function(method) {
                    return method.name;
                });
                console.error('Object.define: Could not eval ' + evalFailed.join(', '));
            }
        }, 0);
    }
});

Object.defineProperties(Object.prototype.define.prototype, {
    'get': {
        value: function() {
            var arg = arguments;
            var argType = this.argTypes(arg);
            var name;
            var value;
            var existing;
            var out;

            if(argType[0] === 'string' && argType[1] === 'function') {
                name = arg[0];
                value = arg[1];
            } else if (argType[0] === 'function') {
                name = arg[0].name;
                value = arg[0];
            } else {
                throw 'define().get expects argument of type (function) or arguments of type (string, function) instead got (' + argType[0] + ', ' + argType[1] + ')';
            }

            if(!name.length) {
                throw 'No name specified for method:' + method;
            }

            existing = this.all[name];
            out = {
                set: existing ? existing.set : undefined,
                get: value,
                configurable: true,
                enumerable: true
            };
            this.all[name] = out;

            delete this.obj[name];
            Object.defineProperty(this.obj, name, out);

            this.attemptEval(name);

            return this;
        }

    },
    'set': {
        value: function() {
            var arg = arguments;
            var argType = this.argTypes(arg);
            var name;
            var value;
            var existing;
            var out;

            if(argType[0] === 'string' && argType[1] === 'function') {
                name = arg[0];
                value = arg[1];
            } else if (argType[0] === 'function') {
                name = arg[0].name;
                value = arg[0];
            } else {
                throw 'define().set expects argument of type (function) or arguments of type (string, function) instead got (' + argType[0] + ', ' + argType[1] + ')';
            }

            if(!name.length) {
                throw 'No name specified for method:' + method;
            }

            existing = this.all[name];
            out = {
                get: existing ? existing.get : undefined,
                set: value,
                configurable: true,
                enumerable: true
            };
            this.all[name] = out;

            delete this.obj[name];
            Object.defineProperty(this.obj, name, out);

            this.attemptEval(name);

            return this;
        }
    },
    'eval': {
        value: function() {
            var name;
            var method;
            var arg = arguments;
            var argType = this.argTypes(arguments);

            if(argType[0] === 'string' && argType[1] === 'function') {
                name = arg[0];
                method = arg[1];
            } else if (argType[0] === 'function') {
                name = arg[0].name;
                method = arg[0];
            } else {
                throw 'define().eval expects argument of type (function) or arguments of type (string, function) instead got (' + argType[0] + ', ' + argType[1] + ')';
            }

            if(!name.length) {
                throw 'No name specified for method:' + method;
            }

            // Add to evaluation queue
            this.evalQueue.push({
                name: name,
                method: method
            });

            this.attemptEval(name);

            return this;
        }
    },
    'var': {
        value: function() {
            var name;
            var value;
            var arg = arguments;
            var argType = this.argTypes(arguments);

            if(argType[0] === 'string' && argType[1] !== 'undefined') {
                name = arg[0];
                value = arg[1];
            } else if (argType[0] === 'function') {
                name = arg[0].name;
                value = arg[0];
            } else if (argType[0] === 'string' && argType[1] === 'undefined') {
                throw 'define().value expects a value as the second argument (instead got' + argType[1] + ')';
            } else {
                throw 'define().value expects argument of type (function) or arguments of type (string, [any]) instead got (' + argType[0] + ', ' + argType[1] + ')';
            }

            if(!name.length) {
                throw 'No name specified for method:' + value;
            }

            Object.defineProperty(this.obj, name, {
                value: value,
                writable: true,
                configurable: true,
                enumerable: true
            });

            this.attemptEval(name);

            return this;
        }
    },
    'const': {
        value: function() {
            var name;
            var value;
            var arg = arguments;
            var argType = this.argTypes(arguments);

            if(argType[0] === 'string' && argType[1] !== 'undefined') {
                name = arg[0];
                value = arg[1];
            } else if (argType[0] === 'function') {
                name = arg[0].name;
                value = arg[0];
            } else if (argType[0] === 'string' && argType[1] === 'undefined') {
                throw 'define().const expects a value as the second argument (instead got' + argType[1] + ')';
            } else {
                throw 'define().const expects argument of type (function) or arguments of type (string, [any]) instead got (' + argType[0] + ', ' + argType[1] + ')';
            }

            if(!name.length) {
                throw 'No name specified for method:' + value;
            }

            Object.defineProperty(this.obj, name, {
                value: value,
                enumerable: true
            });

            this.attemptEval(name);

            return this;
        }
    },
    'const': {
        value: function() {
            var name;
            var value;
            var arg = arguments;
            var argType = this.argTypes(arguments);

            if(argType[0] === 'string' && argType[1] !== 'undefined') {
                name = arg[0];
                value = arg[1];
            } else if (argType[0] === 'function') {
                name = arg[0].name;
                value = arg[0];
            } else if (argType[0] === 'string' && argType[1] === 'undefined') {
                throw 'define().const expects a value as the second argument (instead got' + argType[1] + ')';
            } else {
                throw 'define().const expects argument of type (function) or arguments of type (string, [any]) instead got (' + argType[0] + ', ' + argType[1] + ')';
            }

            if(!name.length) {
                throw 'No name specified for method:' + value;
            }

            Object.defineProperty(this.obj, name, {
                value: value,
                enumerable: true
            });

            this.attemptEval(name);

            return this;
        }
    },
    'do': {
        value: function() {
            var name = arguments[0];
            var args = [].splice.call(arguments, 1);

            this.obj[name].apply(this.obj, args);

            return this;
        }
    }
});