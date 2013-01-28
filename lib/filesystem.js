var fs = require('fs');
var path = require('path');
var exists = fs.existsSync?fs.existsSync:path.existsSync;

var cache = {};

module.exports.resolverRead = resolverRead;
function resolverRead(cacheEnabled, to, from){
  if (cacheEnabled && cache['to:' + to + 'from:' + from]) {
    return {str: '', path: cache['to:' + to + 'from:' + from]};
  }
  var path = resolvePath(to, from);
  if (cacheEnabled) cache['to:' + to + 'from:' + from + ':resolves-to'] = path;
  return readFile(path);
}


function resolvePath(to, from){
  var paths = [];
  var i = -1;
  var extnames;
  if(!from) return to;


  if (path.extname(to) === '') {
    extnames = ['.qejs', '.ejs', '.html'];
  } else {
    extnames = [''];
  } 

  var dirname = path.dirname(from);

  var root = path.dirname(require.main.filename);
  while (true) {
    i++;
    if(i === extnames.length){
      i = 0;
      var old = dirname;
      dirname = path.join(dirname, '..');
      if(old === dirname) return failedToFind(to, from, paths);
    }
    var p = path.join(dirname, to) + extnames[i];
    paths.push(p);
    if (exists(p)) return p;
  }
}
function failedToFind(to, from, paths) {
  throw new Error('No file could be resolved for "' + to + '" from "' + from + '".  The following paths were tried:\n'
   + paths.map(function (p) {return ' - "' + p + '"'}).join("\n"));
}

var read = fs.readFileSync;
function readFile(path) {
  var res = {str: read(path, 'utf8'), path: path};
  return res;
}