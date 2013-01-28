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
users.push(Q.when({ name: 'tobi smith' }));
users.push(Q.when({ name: 'loki' }));
users.push(Q.when({ name: 'jane' }));

var countries = Q.when(['England', 'Scotland', 'Wales']);

(function (it) {
  describe('implicit promise resolution', function () {
    it('works when escaping', function () {
      return qejs.render('<% users.forEach(function (user) { %><%= user.get("name") %><% }) %>', {users: users}).then(function (val) {
        val.should.equal('tobi smithlokijane');
      });
    });
    it('works when not escaping', function () {
      return qejs.render('<% users.forEach(function (user) { %><%- user.get("name") %><% }) %>', {users: users}).then(function (val) {
        val.should.equal('tobi smithlokijane');
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

  describe('inheritance', function () {
    it('works regardless of how long the chain of inheriting templates is', function () {
      return qejs.renderFile(fixturePath('inherit-C.qejs')).then(function (val) {
        val.should.equal('ABC');
      });
    });
  });

  describe('rendering large files', function () {
    it('is still quick', function () {
      this.timeout(1600);//20ms per render
      return repeat(function () {
        return qejs.renderFile(fixturePath('long.qejs')).then(function (val) {
        });
      }, 100);
    });
  });
  describe('rendering lots of inherited files', function () {
    it('is still quick', function () {
      this.timeout(1600);//20ms per render
      var p = qejs.renderFile(fixturePath('inherit-C.qejs'), {cache: true}).then(function (val) {
        val.should.equal('ABC');
      });
      return repeat(function () {
        return qejs.renderFile(fixturePath('inherit-C.qejs'), {cache: true}).then(function (val) {
          val.should.equal('ABC');
        });
      }, 100);
    });
  });
}(function (name, fn) {
  it(name, function (done) {
    var resref = [];
    var res = fn.call(this, resref);
    if (Array.isArray(res)) {
      res = Q.all(res);
    }
    if (!res) {
      res = Q.all(resref);
    }
    Q.when(res, function () {
      done();
    }, done).done();
  });
}));

function repeat(fn, n) {
  var p = fn(0);
  for (var i = 1; i < n; i++) {
    p = p.then(function () { return fn(i); })
  }
  return p;
}