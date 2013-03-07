
/*!
 * EJS
 * Copyright(c) 2012 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 */

var resolverRead = require('./lib/filesystem.js').resolverRead;

/**
 * Module dependencies.
 */
var Q = require('q');

function all(promises) {
  return Q.when(promises, function (promises) {
      var countDown = promises.length;
      if (countDown === 0) {
          return Q.resolve(promises);
      }
      var deferred = Q.defer();
      promises.forEach(function (promise, index) {
          if (Q.isFulfilled(promise)) {
              promises[index] = Q.nearer(promise);
              if (--countDown === 0) {
                  deferred.resolve(promises);
              }
          } else {
              Q.when(promise, function (value) {
                  promises[index] = value;
                  if (--countDown === 0) {
                      deferred.resolve(promises);
                  }
              })
              .fail(deferred.reject);
          }
      });
      return deferred.promise;
  });
}

/**
 * Escape the given string of `html`.
 *
 * @param {String} html
 * @return {String}
 * @api public
 */
exports.escape = function escape(html){
  return when(html, function (html) {
    return String(html)
      .replace(/&(?!\w+;)/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  });
};
 


/**
 * Library version.
 */

exports.version = '0.7.2';


/**
 * Intermediate js cache.
 * 
 * @type Object
 */

var cache = {};

/**
 * Clear intermediate js cache.
 *
 * @api public
 */

exports.clearCache = function(){
  cache = {};
};


/**
 * Re-throw the given `err` in context to the
 * `str` of qejs, `filename`, and `lineno`.
 *
 * @param {Error} err
 * @param {String} str
 * @param {String} filename
 * @param {String} lineno
 * @api private
 */

function rethrow(err, str, filename, lineno){
  var lines = str.split('\n')
    , start = Math.max(lineno - 3, 0)
    , end = Math.min(lines.length, lineno + 3);

  // Error context
  var context = lines.slice(start, end).map(function(line, i){
    var curr = i + start + 1;
    return (curr == lineno ? ' >> ' : '    ')
      + curr
      + '| '
      + line;
  }).join('\n');

  // Alter exception message
  err.path = filename;
  err.message = (filename || 'ejs') + ':' 
    + lineno + '\n'  
    + context + '\n\n' 
    + err.message;
  
  throw err;
}

/**
 * Parse the given `str` of qejs, returning the function body.
 *
 * @param {String} str
 * @return {String}
 * @api public
 */

var parse = exports.parse = function(str, options){
  var options = options || {}
    , open = options.open || exports.open || '<%'
    , close = options.close || exports.close || '%>';

  var buf = [
      "var buf = [];"
    , "\nwith (locals) {"
    , "\n  buf.push('"
  ];
  
  var lineno = 1;

  var consumeEOL = false;
  for (var i = 0, len = str.length; i < len; ++i) {
    if (str.slice(i, open.length + i) == open) {
      i += open.length
  
      var prefix, postfix, line = '__stack.lineno=' + lineno;
      switch (str.substr(i, 1)) {
        case '=':
          prefix = "', escape((" + line + ', ';
          postfix = ")), '";
          ++i;
          break;
        case '-':
          prefix = "', (" + line + ', ';
          postfix = "), '";
          ++i;
          break;
        default:
          prefix = "');" + line + ';';
          postfix = "; buf.push('";
      }

      var end = str.indexOf(close, i)
        , js = str.substring(i, end)
        , start = i
        , n = 0;
        
      if ('-' == js[js.length-1]){
        js = js.substring(0, js.length - 1);
        consumeEOL = true;
      }
      function searchAndSplit(js, splitter){
        var output = [[]];
        var ignoreNext = false;
        var inSingleQuotes = false;
        var inDoubleQuotes = false;
        var inComment = false;
        function push(c){
          output[output.length-1].push(c);
        }
        for(var x = 0; x<js.length; x++){
          if(ignoreNext){
            ignoreNext = false;
            push(js[x]);
          } else if (!inSingleQuotes && !inDoubleQuotes && !inComment && js[x] === "/" && js[x+1] === "*"){
            inComment = true;
            push(js[x]);
            x++;
            push(js[x]);
          } else if (inComment && js[x] === "*" && js[x+1] === "/"){
            inComment = false;
            push(js[x]);
            x++;
            push(js[x]);
          } else if (inComment){
            push(js[x]);
          } else if(inSingleQuotes && js[x] === "'"){
            inSingleQuotes = false;
            push(js[x]);
          } else if (inDoubleQuotes && js[x] === '"'){
            inDoubleQuotes = false;
            push(js[x]);
          } else if(!inDoubleQuotes && js[x] === "'"){
            inSingleQuotes = true;
            push(js[x]);
          } else if (!inSingleQuotes && js[x] === '"'){
            inDoubleQuotes = true;
            push(js[x]);
          } else if (!inDoubleQuotes && !inSingleQuotes && !inComment){
            var fail = false;
            for (var i = 0; i < splitter.length; i++) {
              if(!fail && splitter[i] !== js[i+x]){
                fail = true;
              }
            }
            if(!fail){
              x += splitter.length - 1;
              output.push([]);
            } else {
              push(js[x]);
            }
          } else {
            if(inDoubleQuotes || inSingleQuotes){
              if(js[x] === "\\"){
                ignoreNext = true;
              }
            }
            push(js[x]);
          }
        }
        if(output.length > 1){
          return output.map(function(part){
            return part.join('');
          });
        } else {
          return false;
        }
      }
      (function(){

        var split = searchAndSplit(js, '->');
          if(split){
          var input = split[0];
          var output = split[1];
          var manyIn = (/^\s*\[.*\]\s*$/g).test(input);
          var manyOut = (/^\s*\[.*\]\s*$/g).test(output);
          if(manyIn){
            input = 'all(' + input + ')';
          } else {
            input = 'Q.when(' + input + ')';
          }
          if(manyOut){
            output = (/^\s*\[(.*)\]\s*$/g).exec(output)[1];
            prefix = "', (" + line + ', (function(buf){return ' + input + '.spread(function(';
          }else{
            prefix = "', (" + line + ', (function(buf){return ' + input + '.then(function(';
          }
          js = output;
          postfix = '){try {'+"buf.push('";
        }
      }());
      (function(){
        var split = searchAndSplit(js, '<-');
        if(split){
          prefix += split[0];
          prefix += ";return all(buf).invoke('join','')} catch (err) { rethrow(err, __stack.input, __stack.filename, __stack.lineno); } });}([]))));"
          js = split[1];
        }
      }());
        
      while (~(n = js.indexOf("\n", n))) n++, lineno++;
      buf.push(prefix, js, postfix);
      i += end - start + close.length - 1;

    } else if (str.substr(i, 1) == "\\") {
      buf.push("\\\\");
    } else if (str.substr(i, 1) == "'") {
      buf.push("\\'");
    } else if (str.substr(i, 1) == "\r") {
      buf.push(" ");
    } else if (str.substr(i, 1) == "\n") {
      if (consumeEOL) {
        consumeEOL = false;
      } else {
        buf.push("\\n");
        lineno++;
      }
    } else {
      buf.push(str.substr(i, 1));
    }
  }

  buf.push("');\n}\nreturn all(buf).invoke('join', '');");
  return buf.join('');
};

/**
 * Compile the given `str` of qejs into a `Function`.
 *
 * @param {String} str
 * @param {Object} options
 * @return {Function}
 * @api public
 */

var compile = exports.compile = function(str, options){
  options = options || {};
  
  var input = JSON.stringify(str)
    , filename = options.filename
        ? JSON.stringify(options.filename)
        : 'undefined';
  
  // Adds the fancy stack trace meta info
  str = [
    'var __stack = { lineno: 1, input: ' + input + ', filename: ' + filename + ' };',
    rethrow.toString(),
    'try {',
    exports.parse(str, options),
    '} catch (err) {',
    '  rethrow(err, __stack.input, __stack.filename, __stack.lineno);',
    '}'
  ].join("\n");
  
  if (options.debug) console.log(str);

  try {
    var fn = new Function('locals, escape, Q, all', str);
  } catch (err) {
    if ('SyntaxError' == err.name) {
      err.message += options.filename
        ? ' in ' + filename
        : ' while compiling qejs';
      err.source = str;
    }
    throw err;
  }
  return function(locals){
    return fn.call(this, locals || {}, exports.escape, Q, all);
  }
};

/**
 * Render the given `str` of qejs.
 *
 * Options:
 *
 *   - `locals`          Local variables object
 *   - `cache`           Compiled functions are cached, requires `filename`
 *   - `filename`        Used by `cache` to key caches
 *   - `scope`           Function execution context
 *   - `debug`           Output generated function body
 *   - `open`            Open tag, defaulting to "<%"
 *   - `close`           Closing tag, defaulting to "%>"
 *
 * @param {String} str
 * @param {Object} options
 * @return {>String}
 * @api public
 */
exports.render = function(str, options){
  try{
    var fn, options = options || {};


    if (typeof options.render === 'undefined' && options.filename) {
      options.render = function (subpath, suboptions) {
        suboptions = (suboptions || {});
        Object.keys(options).forEach(function (key) {
          if(key !== 'inherits' && key !== 'render' && typeof suboptions[key] === 'undefined') suboptions[key] = options[key];
        });
        return exports.renderFile(subpath, (suboptions || options), options.filename);
      };
    }

    var inherits = null;
    if(typeof options.inherits === 'undefined' && options.filename) {
      options.inherits = function (path) {
        if(inherits !== null) throw new Error("It is an error to call inherits multiple times from one QEJS file");
        inherits = path;
        return path;
      };
    }

    if (options.cache) {
      if (options.filename) {
        fn = cache[options.filename] || (cache[options.filename] = compile(str, options));
      } else {
        throw new Error('"cache" option requires "filename".');
      }
    } else {
      fn = compile(str, options);
    }

    options.__proto__ = options.locals;

    var inner = fn.call(options.scope, options);
    if (inherits && options.filename) {
      var parentoptions = {};
      Object.keys(options).forEach(function (key) {
        if(key !== 'inherits' && key !== 'render') parentoptions[key] = options[key];
      });
      parentoptions.contents = inner;
      return exports.renderFile(inherits, parentoptions, options.filename);
    } else {
      return inner;
    }
  }catch (ex){
    return Q.reject(ex);
  }
};

/**
 * Render an EJS file at the given `path`
 *
 * @param {String} path
 * @param {Object} [options]
 * @return {>String}
 * @api public
 */

exports.renderFile = function(path, options, source){
  var key = path + ':string';

  options = options || {};

  try {
    var file = resolverRead(options.cache, path, source);
    options.filename = file.path;
    return exports.render(file.str, options);
  } catch (ex) {
    return Q.reject(ex);
  }
};

function when(promise, callback, errback) {
  if (Q.isFulfilled(promise)) {
    return Q.resolve(callback(Q.nearer(promise)));
  } else  {
    return promise.then(callback, errback);
  }
}