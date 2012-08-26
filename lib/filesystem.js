var Q = require('q');
var fs = require('fs');
var path = require('path');

var cache = {};

module.exports.resolverRead = resolverRead;
function resolverRead(cacheEnabled, to, from){
  if (cacheEnabled && cache['to:' + to + 'from:' + from + ':resolves-to']) {
    return readFile(cache['to:' + to + 'from:' + from + ':resolves-to'], cacheEnabled);
  }
  var resolver = pathResolveOrder(to, from);
  function next(){
    var path = resolver.next();
    if(path){
      return when(exists(path, cacheEnabled), function (exists) {
        if (exists) {
          if (cacheEnabled) cache['to:' + to + 'from:' + from + ':resolves-to'] = path;
          return readFile(path, cacheEnabled);
        } else {
          return next();
        }
      });
    } else {
      return failedToFind(to, from);
    }
  }
  return next();
}


function pathResolveOrder(to, from){
  var i = -1;
  var extnames;
  if(!from){
    return {next: function () {
      i++;
      if (i > 0) return false;
      else return to;
    }};
  }


  if (path.extname(to) === '') {
    extnames = ['.qejs', '.ejs', '.html'];
  } else {
    extnames = [''];
  } 

  var dirname = path.dirname(from);

  var root = path.dirname(require.main.filename);
  function next(){
    i++;
    if(i === extnames.length){
      i = 0;
      var old = dirname;
      dirname = path.join(dirname, '..');
      if(old === dirname) return false;
    }
    return path.join(dirname, to) + extnames[i];
  }

  return {next:next};
}
function failedToFind(to, from) {
  var resolver = pathResolveOrder(to, from);
  var paths = [];
  var current;
  while (current = resolver.next()) {
    paths.push(current);
  }
  return Q.reject(new Error("No file could be resolved for '" + to + "' from '"+from+"'\n    The following paths were tried: \n" + paths.join("\n")));
}

var read = Q.nbind(fs.readFile,fs);
function readFile(path, cacheEnabled) {
  if(cacheEnabled && cache[path + ':string']){
    return cache[path + ':string']
  }
  var res = read(path, 'utf8').then(function (str) {
    return {str:str, path:path};
  });
  return cacheEnabled?(cache[path + ':string']=res):res;
}
function exists(path, cacheEnabled) {
  if(cacheEnabled && cache[path + ':exists']){
    return cache[path + ':exists']
  }
  var def = Q.defer();
  fs.exists(path, function (exists) {
    def.resolve(exists);
  });
  return cacheEnabled?(cache[path + ':exists']=def.promise):def.promise;
}

function when(promise, callback, errback) {
  if (Q.isFulfilled(promise)) {
    return Q.resolve(callback(Q.nearer(promise)));
  } else  {
    return promise.then(callback, errback);
  }
}