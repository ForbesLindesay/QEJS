var fs = require('fs');
var qejs = require('../index');
var Q = require('q');

var sample = fs.readFileSync('./sample.qejs', 'utf-8');

var forbes = Q.defer();

qejs.renderFile('./sample.qejs', {names:['forbes','dee', 'david', 'john', 'martin', 'smith'], getAge:getAge}).then(console.log).fail(function(reason){
    var beautify = require('./beautify').js_beautify
    console.error(beautify(qejs.parse(sample)));
    return Q.reject(reason);
}).end();

function getAge(name){
    var res = Q.defer();
    setTimeout(function(){
        res.resolve(name.length*10);
    },2000);
    return res.promise;
}

