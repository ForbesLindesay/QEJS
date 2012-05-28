# Asyncronous Embedded JavaScript Templates with Q

![QEJS](http://i.imgur.com/kBJhz.png)

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
<% promise -> value %>...Use value here...<% < %>
<% PromiseForAnArray -> [valueA, valueB, valueC...] %>...Use values individually here...<% < %>
<% [promiseA,promiseB,promiseC...] -> values %>...Use identifier as an array of resolved values...<% < %>
<% [promiseA,promiseB,promiseC...] -> [valueA,valueB,valueC...] %>...Use values individually here...<% < %>
```

Async blocks are considered a relatively advanced feature, and where possible you should try and tick to just returning promises through `<%= code %>` as it's much easier to write that without creating bugs.

Having said that, async blocks are not difficult to write and I hope you'll end up really loving them for those times when you really need them.

What happens in an async block is we reserve a space for whatever text is outputted by the block, allowing you to use any QEJS inside the async block (including another async block).  We then resolve the value of the promise you give us, and we give it the name you specify on the right hand side of the arrow operator.  The async block starter must go in its own separate unbuffered code block, but you could put other things like comments inside the block with the end marker.

Once you go past the end marker of an async block, you will no longer have access to the value of the promise.  This lets us run lots of calls in parallel, and menas that you can use async blocks inside `if` statments, `for` statements, `while` statements, `functions` statements, pretty much anywhere you could write regular EJS.

## Newline slurping

If you end any code block with a `-` even if it's an async block, we'll support newline slurping for you (`<% code -%>` or `<% -%>` or `<%= code -%>`, `<%- code -%>`, `<% promise -> result -%>` or `<% < -%>`)  That is to say, we won't output the next new line after we see that symbol.  QEJS never outputs a newline inside a code block.

## Filters

QEJS doesn't support filters.  Although in a way it seems a shame not to maintain 100% compatability with the syncronous form of EJS, I think that it's more important to keep this library lean.  Filters don't really add a lot, you can always attach such methods to arrays yourself and use standard javascript syntax, I don't want to hurt the purity of EJS though, so I've chosen not to add this syntax (bloat).

## ExpressJS Integration

I'm really keen to get express integration working, however unfortunately at version 2.x this isn't possible because of our asyncronous rendering, Shims can be made.  However I will endevour to ensure this does support Express.js @ v3.0 as soon as possible after that's released.

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