//Run this file using mocha

var qejs = require('../');
var Q = require('q');
var assert = require('assert');


function equal(A,E, assert, cb, message){
    var p = Q.all([A,E]).spread(function(a,e){
        assert.equal(a, e, (message||'test'));
    },function(err){
        assert.fail(err);
    });
    if(cb){
      p.then(function(){cb();}).end();
    }
    return p;
}

/**
 * Module dependencies.
 */

module.exports = {
  'test .version': function(assert, done){
    assert.ok(/^\d+\.\d+\.\d+$/.test(qejs.version), 'Test .version format');
    done();
  },
  
  'test html': function(assert, done){
    equal(qejs.render('<p>yay</p>'), '<p>yay</p>', assert, done, 'test plain html');
  },

  'test renderFile': function(assert, done){
    var html = '<h1>tj</h1>',
      str = '<p><%= name %></p>',
      options = { name: 'tj', open: '{', close: '}' };

    equal(qejs.renderFile(__dirname + '/fixtures/user.qejs', options), html, assert, done, 'test renderFile');
  },
  
  'test buffered code': function(assert, done){
    var html = '<p>tj</p>',
      str = '<p><%= name %></p>',
      locals = { name: 'tj' };
    equal(qejs.render(str, { locals: locals }), html, assert, done, 'test buffered code');
  },
  
  'test unbuffered code': function(assert, done){
    var html = '<p>tj</p>',
      str = '<% if (name) { %><p><%= name %></p><% } %>',
      locals = { name: 'tj' };
    equal(qejs.render(str, { locals: locals }), html, assert, done, 'test unbuffered code');
  },
  
  'test `scope` option': function(assert, done){
    var html = '<p>tj</p>',
      str = '<p><%= this %></p>';
    equal(html, qejs.render(str, { scope: 'tj' }), assert, done);
  },
  
  'test escaping': function(assert, done){
    equal('&lt;script&gt;', qejs.render('<%= "<script>" %>'), assert).then(function(){
      return equal('<script>', qejs.render('<%- "<script>" %>'), assert, done);
    }).end();
  },
  
  'test newlines': function(assert, done){
    var html = '\n<p>tj</p>\n<p>tj@sencha.com</p>',
      str = '<% if (name) { %>\n<p><%= name %></p>\n<p><%= email %></p><% } %>',
      locals = { name: 'tj', email: 'tj@sencha.com' };
    equal(html, qejs.render(str, { locals: locals }), assert, done);
  },
  
  'test single quotes': function(assert, done){
    var html = '<p>WAHOO</p>',
      str = "<p><%= up('wahoo') %></p>",
      locals = { up: function(str){ return str.toUpperCase(); }};
    equal(html, qejs.render(str, { locals: locals }), assert, done);
  },

  'test single quotes in the html': function(assert, done){
    var html = '<p>WAHOO that\'s cool</p>',
      str = '<p><%= up(\'wahoo\') %> that\'s cool</p>',
      locals = { up: function(str){ return str.toUpperCase(); }};
    equal(html, qejs.render(str, { locals: locals }), assert, done);
  },

  'test multiple single quotes': function(assert, done) {
    var html = "<p>couldn't shouldn't can't</p>",
      str = "<p>couldn't shouldn't can't</p>";
    equal(html, qejs.render(str), assert, done);
  },

  'test single quotes inside tags': function(assert, done) {
    var html = '<p>string</p>',
      str = "<p><%= 'string' %></p>";
    equal(html, qejs.render(str), assert, done);
  },

  'test back-slashes in the document': function(assert, done) {
    var html = "<p>backslash: '\\'</p>",
      str = "<p>backslash: '\\'</p>";
    equal(html, qejs.render(str), assert, done);
  },
  
  'test double quotes': function(assert, done){
    var html = '<p>WAHOO</p>',
      str = '<p><%= up("wahoo") %></p>',
      locals = { up: function(str){ return str.toUpperCase(); }};
    equal(html, qejs.render(str, { locals: locals }), assert, done);
  },
  
  'test multiple double quotes': function(assert, done) {
    var html = '<p>just a "test" wahoo</p>',
      str = '<p>just a "test" wahoo</p>';
    equal(html, qejs.render(str), assert, done);
  },

  'test pass options as locals': function(assert, done){
    var html = '<p>foo</p>',
      str = '<p><%="foo"%></p>';
    equal(html, qejs.render(str), assert).then(function(){
      var html = '<p>foo</p>',
        str = '<p><%=bar%></p>';
      return equal(html, qejs.render(str, { bar: 'foo' }), assert, done);
    });
  },
  
  'test whitespace': function(assert, done){
    var html = '<p>foo</p>',
      str = '<p><%="foo"%></p>';
    equal(html, qejs.render(str), assert).then(function(){
      var html = '<p>foo</p>',
        str = '<p><%=bar%></p>';
      return equal(html, qejs.render(str, { locals: { bar: 'foo' }}), assert, done);
    }).end();
  },
  
  'test custom tags': function(assert, done){
    var html = '<p>foo</p>',
      str = '<p>{{= "foo" }}</p>';

    equal(html, qejs.render(str, {
      open: '{{',
      close: '}}'
    }), assert).then(function(){
      var html = '<p>foo</p>',
        str = '<p><?= "foo" ?></p>';

      return equal(html, qejs.render(str, {
        open: '<?',
        close: '?>'
      }), assert, done);
    }).end();
  },

  'test custom tags over 2 chars': function(assert, done){
    var html = '<p>foo</p>',
      str = '<p>{{{{= "foo" }>>}</p>';

    equal(html, qejs.render(str, {
      open: '{{{{',
      close: '}>>}'
    }), assert).then(function(){
      var html = '<p>foo</p>',
        str = '<p><??= "foo" ??></p>';

      return equal(html, qejs.render(str, {
        open: '<??',
        close: '??>'
      }),assert, done);
    }).end();
  },
  
  'test global custom tags': function(assert, done){
    var html = '<p>foo</p>',
      str = '<p>{{= "foo" }}</p>';
    qejs.open = '{{';
    qejs.close = '}}';
    equal(html, qejs.render(str), assert, done, "global tags can be set to {{ and }}");
    delete qejs.open;
    delete qejs.close;
  },
  
  'test iteration': function(assert, done){
    var html = '<p>foo</p>',
      str = '<% for (var key in items) { %>'
        + '<p><%= items[key] %></p>'
        + '<% } %>';
    equal(html, qejs.render(str, {
      locals: {
        items: ['foo']
      }
    }), assert).then(function(){
      var html = '<p>foo</p>',
        str = '<% items.forEach(function(item){ %>'
          + '<p><%= item %></p>'
          + '<% }) %>';
      return equal(html, qejs.render(str, {
        locals: {
          items: ['foo']
        }
      }), assert);
    }).fail(function(err){
        assert.fail(err);
    }).then(function(){done()}).end();
  },

  'test useful stack traces': function(assert, done){  
    var str = [
      "A little somethin'",
      "somethin'",
      "<% if (name) { %>", // Failing line 
      "  <p><%= name %></p>",
      "  <p><%= email %></p>",
      "<% } %>"
    ].join("\n");
    qejs.render(str).then(function(){assert.fail("rendered invlaid markup");}).fail(function(err){
      assert.ok(~err.message.indexOf("name is not defined"));
      assert.deepEqual(err.name, "ReferenceError");
      var lineno = parseInt(err.toString().match(/ejs:(\d+)\n/)[1]);
      assert.deepEqual(lineno,3, "Error should been thrown on line 3, was thrown on line "+lineno);
    }).then(function(){done()}).end();

  },
  
  'test useful stack traces multiline': function(assert, done){  
    var str = [
      "A little somethin'",
      "somethin'",
      "<% var some = 'pretty';",
      "   var multiline = 'javascript';",
      "%>",
      "<% if (name) { %>", // Failing line 
      "  <p><%= name %></p>",
      "  <p><%= email %></p>",
      "<% } %>"
    ].join("\n");
    qejs.render(str).then(function(){assert.fail("rendered invlaid markup");}).fail(function(err){
      assert.ok(~err.message.indexOf("name is not defined"), "Message should be 'name is not defined'");
      assert.deepEqual(err.name, "ReferenceError", "Should throw reference error");
      var lineno = parseInt(err.toString().match(/ejs:(\d+)\n/)[1]);
      assert.deepEqual(lineno, 6, "Error should been thrown on line 6, was thrown on line "+lineno);
    }).then(function(){done()}).end();
  },
  
  'test slurp' : function(assert, done) {
    var stream = testStream(assert, done);
    var expected = 'me\nhere',
      str = 'me<% %>\nhere';
    stream.equal(expected, qejs.render(str));

    var expected = 'mehere',
      str = 'me<% -%>\nhere';
    stream.equal(expected, qejs.render(str));

    var expected = 'me\nhere',
      str = 'me<% -%>\n\nhere';
    stream.equal(expected, qejs.render(str));
    
    var expected = 'me inbetween \nhere',
      str = 'me <%= x %> \nhere';
    stream.equal(expected, qejs.render(str,{x:'inbetween'}));

    var expected = 'me inbetween here',
      str = 'me <%= x -%> \nhere';
    stream.equal(expected, qejs.render(str,{x:'inbetween'}));

    var expected = 'me <p>inbetween</p> here',
      str = 'me <%- x -%> \nhere';
    stream.equal(expected, qejs.render(str,{x:'<p>inbetween</p>'}));

    var expected = '\n  Hallo 0\n\n  Hallo 1\n\n',
      str = '<% for(var i in [1,2]) { %>\n' +
            '  Hallo <%= i %>\n' +
            '<% } %>\n';
    stream.equal(expected, qejs.render(str));

    var expected = '  Hallo 0\n  Hallo 1\n',
      str = '<% for(var i in [1,2]) { -%>\n' +
            '  Hallo <%= i %>\n' +
            '<% } -%>\n';
    stream.equal(expected, qejs.render(str));

    stream.done();
  },

  'test promises' :function(assert, done){
    var stream = testStream(assert, done);
    var options = {
      delay:function(input){
        var def = Q.defer();
        setTimeout(function(){def.resolve(input);}, 0);
        return def.promise;
      }
    }

    var expected = '->->\'->',
      str = '<%- /*\'"*/ "->"+\'->\\\'->\'/*->*/ %>';
    stream.equal(expected, qejs.render(str, options));


    var expected = 'output',
      str = '<%= delay("output") %>';
    stream.equal(expected, qejs.render(str, options));

    var expected = '&lt;output&gt;';
      str = "<%= delay('<output>') %>";
    stream.equal(expected, qejs.render(str, options));

    var expected = '<output>';
      str = "<%- delay('<output>') %>";
    stream.equal(expected, qejs.render(str, options));
    var expected = 'output';
      str = '<%- delay("output") %>';
    stream.equal(expected, qejs.render(str, options));
    var expected = '1,2,3',
      str = '<% delay([1,2,3]) -> input %><%=input.join()%><% < %>'
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
  }
  
};

if (module == require.main) {
    require('test').run(module.exports);
}

function testStream(assert, done){
  var current = Q.resolve();
  var output = {};
  var n = 0;
  output.equal = function(expected, actual, message){
    current = current.then(function(){
        return actual;
      }).then(function(actual){
        n++;
        assert.equal(expected, actual, (message|| 'test ' + n));
      }).fail(function(err){n++;assert.fail(err, (message|| 'test ' + n));});
    return this;
  };
  output.done = function(){
    current = current.then(function(){done();}).end();
  };
  return output;
}