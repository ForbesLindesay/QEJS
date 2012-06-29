# Asyncronous Embedded JavaScript Templates with Q

![QEJS](http://i.imgur.com/WRIlB.png)

This library impliments Embedded JavaScript with some asyncronous additions provided by Q.  It is broadly based on https://github.com/visionmedia/ejs and fully supports everything except filters.  For a full discussion of the reasoning behind this, see Features below.  The promises implimentation for ayncronous operations uses https://github.com/kriskowal/q so you'll need to make sure that all asyncronous functions/values you supply to the templates are 'thenables' so that they'll work with Q.  All that means in practice is that you need your promises to have a function `then` that you can call with a promise.

## Installation

    $ npm install qejs

## Example

    <% if (user) { %>
        <h2><%= user.getNameAsync() %></h2>
    <% } %>

## Usage

    qejs.compile(str, options);
    // => Function

    qejs.render(str, options);
    // => promise

    qejs.render(str, options).then(function(output){
            //output is a string
        });

## Options

  - `cache`           Compiled functions are cached, requires `filename`
  - `filename`        Used by `cache` to key caches
  - `scope`           Function execution context
  - `debug`           Output generated function body
  - `open`            Open tag, defaulting to "<%"
  - `close`           Closing tag, defaulting to "%>"
  - *                 All others are template-local variables

## Custom tags

Custom tags can also be applied globally:

    var qejs = require('qejs');
    qejs.open = '{{';
    qejs.close = '}}';

Which would make the following a valid template:

    <h1>{{= title }}</h1>

## Unbuffered Code

```
<% code %>
```

QEJS supports exactly the same syntax as EJS for unbuffered code, usefull for conditionals, loops etc.

## Escapes HTML

```
<%= code %>
```

This differs from EJS in that if `code` returns a promise, it is resolved and then escaped before being outputted.  While this is happening, QEJS will continue on to render the rest of the template, allowing many promised functions to be executed in parallel.

## Unescaped Buffering

```
<%- code %>
```

If `code` isn't a promise, this will work exactly like EJS, but if `code` is a promise, we will resolve it, before outputting the resolved value.  We won't do any escaping on this value, so only use for trusted values, not user input.

## Async Blocks

```
<% promise -> value %>...Use value here...<% <- %>
<% PromiseForAnArray -> [valueA, valueB, valueC...] %>...Use values individually here...<% <- %>
<% [promiseA,promiseB,promiseC...] -> values %>...Use identifier as an array of resolved values...<% <- %>
<% [promiseA,promiseB,promiseC...] -> [valueA,valueB,valueC...] %>...Use values individually here...<% <- %>
```

Async blocks are considered a relatively advanced feature, and where possible you should try and tick to just returning promises through `<%= code %>` as it's much easier to write that without creating bugs.

Having said that, async blocks are not difficult to write and I hope you'll end up really loving them for those times when you really need them.

What happens in an async block is we reserve a space for whatever text is outputted by the block, allowing you to use any QEJS inside the async block (including another async block).  We then resolve the value of the promise you give us, and we give it the name you specify on the right hand side of the arrow operator.  The async block starter must go in its own separate unbuffered code block, but you could put other things like comments inside the block with the end marker.

Once you go past the end marker of an async block, you will no longer have access to the value of the promise.  This lets us run lots of calls in parallel, and means that you can use async blocks inside `if` statments, `for` statements, `while` statements, `function` statements, pretty much anywhere you could write regular EJS.

## Inheritance and Partials

QEJS supports both inheritance and partials.  Inheritance is used to include the current template in the middle of some other template (similar to express's layout templates except a little more powerful).  Currently this only works if you use the renderFile method (or render in express with the following snippet to setup).

### Configuring express for inheritance and partials

Instead of using consolidate, simply use the following:

```javascript
app.engine('html', function (path, options, fn) {
    require('qejs').renderFile(path, options).then(function (result) {
        fn(null, result);
    }, function (err) {
        fn(err);
    }).end();
});
```

I will submit a pull request to get consolidate.js updated as soon as possible.

### Inheritance

Inheritance allows you to support features similar to those in express's layout template.  To use a layout for a template, simply call `inherits('relative/path/to/template')` anywhere in your template that is not run asyncronously.  That is to say, it can't go inside an async block, or inside the then callback of a promise.  Usually it's best to put it at the top of your file.  If you call it multiple times, it will throw an exception.

views/foobar.html

```html
<% inherits('layouts/navigation') %>
<p>The great page foobar</p>
```

layouts/navigation

```html
<% inherits('base') %>
<a href="#home">Home</a>
<a href="#about">About</a>
<div class="content">
    <%- contents %>
</div>
```

layouts/base

```html
<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="utf-8">
        <title>Document</title>
    </head>
    <body>
        <%- contents %>
    </body>
</html>
```

Be careful not to inherit from yourself as this would create errors that never got caught if you create an infinite loop of inheritance.

As you can see, paths are resolved in a very forgiving way.  They are resolved relative to the current file, then relative to the parent directory of the current directory and so on up the tree until a file is found.  It will try for files with extensions '.qejs', '.ejs' and '.html' in that order unless you specify an extension.

### Partials

You can render a child template within the current template.  By default, it does not currently have access to any local variables of the calling template, only those supplied in options.

To use, simply call render anywhere in the parent template.

layouts/base

```html
<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="utf-8">
        <title>Document</title>
    </head>
    <body>
        <%- render('views/foobar', {message:'hello world'}) %>
    </body>
</html>
```

```html
<p><%= message %></p>
```

## Newline slurping

If you end any code block with a `-` even if it's an async block, we'll support newline slurping for you (`<% code -%>` or `<% -%>` or `<%= code -%>`, `<%- code -%>`, `<% promise -> result -%>` or `<% < -%>`)  That is to say, we won't output the next new line after we see that symbol.  QEJS never outputs a newline inside a code block.

## Filters

QEJS doesn't support filters.  Although in a way it seems a shame not to maintain 100% compatability with the syncronous form of EJS, I think that it's more important to keep this library lean.  Filters don't really add a lot, you can always attach such methods to arrays yourself and use standard javascript syntax, I don't want to hurt the purity of EJS though, so I've chosen not to add this syntax (bloat).

## ExpressJS Integration

This module is fully compatible with [express 3.0.0](https://github.com/visionmedia/express) via the [consolidate.js](https://github.com/visionmedia/consolidate.js) library.

To use it you'll need to install both consolidate and QEJS.  You can do this in a single command with:

    npm install consolidate qejs

The following example demonstrates using QEJS in express:

```javascript
var express = require('express')
  , cons = require('consolidate')
  , app = express();

// assign the swig engine to .html files
app.engine('html', cons.qejs);

// set .html as the default extension 
app.set('view engine', 'html');
app.set('views', __dirname + '/views');

var users = [];
users.push({ name: 'tobi' });
users.push({ name: 'loki' });
users.push({ name: 'jane' });

app.get('/', function(req, res){
  res.render('index', {
    title: 'Consolidate.js'
  });
});

app.get('/users', function(req, res){
  res.render('users', {
    title: 'Users',
    users: users
  });
});

app.listen(3000);
console.log('Express server listening on port 3000');
```

If it doesn't work, be sure to make absolutely certain you've got the latest version of express, and make sure you have actually created a users.html and index.html view.

## Contribute

Fork this repository to add features or:

<a href="http://flattr.com/thing/699596/QEJS" target="_blank">
<img src="http://api.flattr.com/button/flattr-badge-large.png" alt="Flattr this" title="Flattr this" border="0" /></a>

## License 

(The MIT License)

Copyright (c) 2012 Forbes Lindesay &lt;contact@jepso.coma&gt;

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

## EJS License

The EJS License (by visionmedia) on which this library is based, is reproduced here:

(The MIT License)

Copyright (c) 2009-2010 TJ Holowaychuk &lt;tj@vision-media.ca&gt;

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.