/**
 * Module dependencies.
 */

var ejs = require('..')
  , fs = require('fs')
  , read = fs.readFileSync
  , assert = require('should')
  , Q = require('q');

function fixturePath(name) {
  return __dirname + '/ejs-fixtures/' + name;
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
users.push({ name: 'tobi' });
users.push({ name: 'loki' });
users.push({ name: 'jane' });

(function (it) {
  describe('ejs.compile(str, options)', function(){
    it('should compile to a function', function(){
      var fn = ejs.compile('<p>yay</p>');
      return fn().then(function (val) {
        val.should.equal('<p>yay</p>');
      });
    })

    it('should allow customizing delimiters', function(res){
      var fn = ejs.compile('<p>{= name }</p>', { open: '{', close: '}' });
      res.push(fn({ name: 'tobi' }).then(function (val) {
        val.should.equal('<p>tobi</p>');
      }));

      var fn = ejs.compile('<p>::= name ::</p>', { open: '::', close: '::' });
      res.push(fn({ name: 'tobi' }).then(function (val) {
        val.should.equal('<p>tobi</p>');
      }));

      var fn = ejs.compile('<p>(= name )</p>', { open: '(', close: ')' });
      res.push(fn({ name: 'tobi' }).then(function (val) {
        val.should.equal('<p>tobi</p>');
      }));
    })

    it('should default to using ejs.open and ejs.close', function(res){
      ejs.open = '{';
      ejs.close = '}';
      var fn = ejs.compile('<p>{= name }</p>');
      res.push(fn({ name: 'tobi' }).then(function (val) {
        val.should.equal('<p>tobi</p>');
      }));

      var fn = ejs.compile('<p>|= name |</p>', { open: '|', close: '|' });
      res.push(fn({ name: 'tobi' }).then(function (val) {
        val.should.equal('<p>tobi</p>');
      }));

      return Q.all(res).then(function () {
        delete ejs.open;
        delete ejs.close;
      });
    })
  })

  describe('ejs.render(str, options)', function(){
    it('should render the template', function(){
      return ejs.render('<p>yay</p>').then(function (val) {
        val.should.equal('<p>yay</p>');
      });
    })

    it('should accept locals', function(){
      return ejs.render('<p><%= name %></p>', { name: 'tobi' }).then(function (val) {
        val.should.equal('<p>tobi</p>');
      });
    })
  })

  describe('ejs.renderFile(path, options, fn)', function(){
    it('should render a file', function(){
      return ejs.renderFile(fixturePath('para.ejs')).then(function (html){
        html.should.equal('<p>hey</p>');
      });
    })

    it('should accept locals', function(){
      var options = { name: 'tj', open: '{', close: '}' };
      return ejs.renderFile(fixturePath('user.ejs'), options).then(function (html) {
        html.should.equal('<h1>tj</h1>');
      });
    })
  })

  describe('<%=', function(){
    it('should escape', function(){
      return ejs.render('<%= name %>', { name: '<script>' }).then(function (val) {
        val.should.equal('&lt;script&gt;');
      });
    })
  })

  describe('<%-', function(){
    it('should not escape', function(){
      return ejs.render('<%- name %>', { name: '<script>' }).then(function (val) {
        val.should.equal('<script>');
      });
    })
  })

  describe('%>', function(){
    it('should produce newlines', function(){
      return ejs.render(fixture('newlines.ejs'), { users: users }).then(function (val) {
        val.should.equal(fixture('newlines.html'));
      });
    })
  })

  describe('-%>', function(){
    it('should not produce newlines', function(){
      return ejs.render(fixture('no.newlines.ejs'), { users: users }).then(function (val) {
        val.should.equal(fixture('no.newlines.html'));
      });
    })
  })

  describe('single quotes', function(){
    it('should not mess up the constructed function', function(){
      return ejs.render(fixture('single-quote.ejs')).then(function (val) {
        val.should.equal(fixture('single-quote.html'));
      });
    })
  })

  describe('double quotes', function(){
    it('should not mess up the constructed function', function(){
      return ejs.render(fixture('double-quote.ejs')).then(function (val) {
        val.should.equal(fixture('double-quote.html'));
      });
    })
  })

  describe('backslashes', function(){
    it('should escape', function(){
      return ejs.render(fixture('backslash.ejs')).then(function (val) {
        val.should.equal(fixture('backslash.html'));
      });
    })
  })

  describe('messed up whitespace', function(){
    it('should work', function(){
      return ejs.render(fixture('messed.ejs'), { users: users }).then(function (val) {
        val.should.equal(fixture('messed.html'));
      });
    })
  })

  describe('exceptions', function(){
    it('should produce useful stack traces', function(){
      return ejs.render(fixture('error.ejs'), { filename: 'error.ejs' }).then(function () {
        assert(false, 'This should not have been successfully rendered');
      },function (err) {
        err.path.should.equal('error.ejs');
        err.stack.split('\n').slice(0, 8).join('\n').should.equal(fixture('error.out'));
      });
    })
  })

/*
//QEJS has it's own syntax for includes and inheritance which has yet to be unified with QEJS

  describe('includes', function(){
    it('should include ejs', function(){
      var file = 'test/fixtures/include.ejs';
      return ejs.render(fixture('include.ejs'), { filename: file, pets: users }).then(function (val) {
        val.should.equal(fixture('include.html'));
      });
    })

    it('should work when nested', function(){
      var file = 'test/fixtures/menu.ejs';
      ejs.render(fixture('menu.ejs'), { filename: file, pets: users })
        .should.equal(fixture('menu.html'));
    })

    it('should include arbitrary files as-is', function(){
      var file = 'test/fixtures/include.css.ejs';
      ejs.render(fixture('include.css.ejs'), { filename: file, pets: users })
        .should.equal(fixture('include.css.html'));
    })
  })
 */
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