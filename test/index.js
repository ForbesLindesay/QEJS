var s = {  'test promises': function (assert, done) {
    var stream = testStream(assert, done);
    var options = {
      delay:function(input){
        var def = Q.defer();
        setTimeout(function(){def.resolve(input);}, 0);
        return def.promise;
      }
    }
    stream.equal(expected, qejs.render(str, options));
    var expected = '1,2,3',
      str = '<% [delay(1),delay(2),delay(3)] -> input %><%=input.join()%><% < %>'
    stream.equal(expected, qejs.render(str, options));
    var expected = '1,2,3',
      str = '<% delay([1,2,3]) -> [A,B,C] %><%=A+","+B+","+C%><% < %>'
    stream.equal(expected, qejs.render(str, options));
    var expected = '1,2,3',
      str = '<% [delay(1),delay(2),delay(3)] -> [A,B,C] %><%=A+","+B+","+C%><% < %>'
    stream.equal(expected, qejs.render(str, options));

    stream.done();
  } }




/**
 * Module dependencies.
 */

var qejs = require('..')
  , fs = require('fs')
  , read = fs.readFileSync
  , assert = require('should')
  , Q = require('q');

function fixturePath(name) {
  return __dirname + '/fixtures/' + name;
}
/**
 * Load fixture `name`.
 */

function fixture(name) {
  return read(fixturePath(name), 'utf8');
}

/**
 * User fixtures.
 */

var users = [];
users.push(Q.when({ name: 'tobi' }));
users.push(Q.when({ name: 'loki' }));
users.push(Q.when({ name: 'jane' }));

var countries = Q.when(['England', 'Scotland', 'Wales']);

(function (it) {
  describe('implicit promise resolution', function () {
    it('works when escaping', function () {
      return qejs.render('<% users.forEach(function (user) { %><%= user.get("name") %><% }) %>', {users: users}).then(function (val) {
        val.should.equal('tobilokijane');
      });
    });
    it('works when not escaping', function () {
      return qejs.render('<% users.forEach(function (user) { %><%- user.get("name") %><% }) %>', {users: users}).then(function (val) {
        val.should.equal('tobilokijane');
      });
    });
  });
  describe('explicit promise resolution', function () {
    it('ignores anything in comments and strings', function () {
      var expected = '->->\'->',
        str = '<%- /*\'"*/ "->"+\'->\\\'->\'/*->*/ %>';
      return qejs.render(str).then(function (val) {
        val.should.equal(expected);
      });
    });
    var locals = {
      delay: function (v) {
        return Q.when(v);
      }
    };
    it('supports resolving a single promise', function () {
      return qejs.render(fixture('countries.qejs'), {countries: countries}).then(function (val) {
        val.should.equal('EnglandScotlandWales');
      });
    });
    it('supports resolving arrays of promises', function (res) {
      res.push(qejs.render('<% [delay(1),delay(2),delay(3)] -> input %><%=input.join()%><% <- %>', locals).then(function (val) {
        val.should.equal('1,2,3');
      }));
      res.push(qejs.render('<% delay([1,2,3]) -> [A,B,C] %><%=A+","+B+","+C%><% <- %>', locals).then(function (val) {
        val.should.equal('1,2,3');
      }));
      res.push(qejs.render('<% [delay(1),delay(2),delay(3)] -> [A,B,C] %><%=A+","+B+","+C%><% <- %>', locals).then(function (val) {
        val.should.equal('1,2,3');
      }));
    });
  });
}(function (name, fn) {
  it(name, function (done) {
    var resref = [];
    var res = fn(resref);
    if (Array.isArray(res)) {
      res = Q.all(res);
    }
    if (!res) {
      res = Q.all(resref);
    }
    Q.when(res, function () {
      done();
    }, done).end();
  });
}));