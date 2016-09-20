mocha-ui-exports-request [![Build Status](https://secure.travis-ci.org/osher/mocha-ui-exports-request.png?branch=master)](http://travis-ci.org/osher/mocha-ui-exports-request)
=========================

Brief
------

Use a DECLEARATIVE language for your HTTP request assertions, 
and get DESCRIPTIVE spec output from your mocha tests.

This is a unit-test helper for network request assertions, 
based on Mikael's [request](https://github.com/mikeal/request) and [should.js](https://github.com/visionmedia/should.js) of visionmedia, 
designed for the [mocha-ui-exports](https://github.com/osher/mocha-ui-exports) plugin for [mocha](https://github.com/visionmedia/mocha) test framework.

Content
-------
 - [mocha-ui-exports-request](#mocha-ui-exports-request)
   - [Brief](#brief)
   - [Content](#content)
   - [Use Case](#use-case)
   - [Install](#install)
   - [Test](#test)
 - [API](#api)
   - [request](#request)
   - [RequestTester#responds](#requesttesterresponds)
 - [Contribute](#contribute)
   - [Future](#future)
   - [Lisence](#lisence)

Use Case
---------

Assume you have a cool http server that you want covered in BDD unit-tests,
and you want:
 * high resolution DESCRIPTIVE test results
 * generated by a DECLARATIVE language

Prequisites - you're programming in [node](http://nodejs.org), 
and using [mocha](https://github.com/visionmedia/mocha) as test framework.

**Example**
Lets just take for example - a notes application, that uses couch-db.
To make the example short, lets just assume 2 APIs: 
 * homepage - an HTML page
 * list-notes - an AJAX call
 * post-note - an AJAX call

You want DESCRIPTIVE test results that follow the BDD principal that makes it 
as readable as specifications.
One that looks, for example, like that:

```
  ./lib/server.js
    homepage - /
      with no parameters
        √ should return status 200
        √ should emit http-header: 'content-type' as text/html
        √ body should match : /<h1>Your notes<\/h1>/
    ajax - /ajax/listnotes
      with no parameters - should return the 5 latest notes
        √ should return status 200
        √ should emit http-header: 'content-type' as text/json
        √ body should be : '{"notes":[{"date":1396257...'
      with 'to' - should return the next page in fixture
        √ should return status 200
        √ should emit http-header: 'content-type' as text/json
        √ body should be : '{"notes":[{"date":1396257...'
      with 'to' and 'from' - should return the cut
        √ should return status 200
        √ should emit http-header: 'content-type' as text/json
        √ body should be : '{"notes":[{"date":1396257...'
    ajax - /ajax/postnote
      with valid form - should accept the note
        √ should return status 200
    all expected couch-db hits
      √ should have been called

  14 passing (81ms)
```

But you want to express your mocha tests in a DECLERATIVE way.
Declarative - means:
 - avoid flow-control
 - avoid logic
 - stick with declaration 
 - stick with descriptions
No ifs, no elses, no loops, and as few add-hock custom callbacks as possible.

Ah, assume you want to cover the back-end requests too, and use for that purpose, for example [nock](https://github.com/pgte/nock).

How would you feel if I tould you that you can do it this way:

```
    // the test target
var svr = require('../server') 
    //the helper
  , request =require('mocha-ui-exports-request')
    //plugs the recorded scenario of http requests to couch
  , nock =  require('fixtures/nock')
  ;

svr.listen(1234);

module.exports = 
{ "./lib/server.js" : 
  { "homepage - /" :
    { "with no parameters" :
      request("http://127.0.0.1:1234/")
      .responds(
        { status: 200
        , headers: 
          { "content-type" : "text/html"
          }
        , body: /<h1>Your notes<\/h1>/
        }
      )
    }
  , "ajax - /ajax/listnotes" :
    { "with no parameters - should return the 5 latest notes in fixture" :
      request("http://127.0.0.1:1234/ajax/listnotes")
      .responds(
        { status : 200
        , headers: 
          { "content-type" : "text/json"
          }
        , json:  
          { notes : 
            [ { date: new Date('2014-04-02T15:35:55.754').getTime()
              , note: "note 1" 
              }
            , { date: new Date('2014-04-02T05:22:41.832').getTime()
              , note: "note 2" 
              }
            , { date: new Date('2014-04-01T21:03:43.004').getTime()
              , note: "note 3" 
              }
            , { date: new Date('2014-04-01T13:55:48.123').getTime()
              , note: "note 4" 
              }
            , { date: new Date('2014-04-01T08:14:31.631').getTime()
              , note: "note 5" 
              }
            ] 
          }
        }
      )
    , "with 'to' - should return the next page in fixture" :
      request("http://127.0.0.1:1234/ajax/listnotes/to/2014-03-31/")
      .responds(
        { status: 200
        , headers: 
          { "content-type" : "text/json"
          }
        , json: 
          { notes : 
            [ { date: new Date('2014-03-31T09:21:55.331').getTime()
              , note: "note 6" 
              }
            , { date: new Date('2014-03-30T06:21:55.784').getTime()
              , note: "note 7" 
              }
            , { date: new Date('2014-03-29T18:13:41.575').getTime()
              , note: "note 8" 
              }
            ] 
          }
        }
      )
    , "with 'to' and 'from' - should return the cut" :
      request("http://127.0.0.1:1234/ajax/listnotes/from/2014-03-30/to/2014-03-30/")
      .responds(
        { status: 200
        , headers: 
          { "content-type" : "text/json"
          }
        , json: 
          { notes : 
            [ { date: new Date('2014-03-30T06:21:55.784').getTime()
              , note: "note 7" 
              }
            ]
          }
        }
      )
    }
  , "ajax - /ajax/postnote" :
    { "with valid form - should accept the note" :
      request(
        { uri : "http://127.0.0.1:1234/ajax/postnote"
        , form: 
          { note : "note 9"
          }
        }
      ).responds(
        { status: 200
        }
      )
    }
  , "all expected couch-db hits" :
    { "should have been called" :
       function(){
          nock.done()
       }
    }
  }
}

```


Install
--------
```
npm install mocha-ui-exports-request
```

ok, long name. I will accept better offers...

Test
----
the published package is slim: it does not contain the test suite.
You'll have to clone this repo, to `npm install` from within the cloned folder, and then to `npm test`.


API
======

request
-------

`request(reqOptions) : RequestTester`
It builds a requet-tester for the provided `reqOptions`.

`reqOptions` - any options setting valid for mikael's [request](https://github.com/mikeal/request) module, including form, post-data, multiplart, and whatever you want.

`RequestTester` - implements one method: `RequestTester#responds`, that returns a [mocha-ui-exports](https://github.com/osher/mocha-ui-exports) suite, who's setup function will fire the request, and hold it in context closure for all the asserts that follow.

RequestTester#Responds
----------------------

`reqTester#responds(options) : suite`
It builds an asserter for every one of the options provided.
Supported options:

### options.status

assert a status code. generates *"should return status ..."* asserts.

Example: 
```
module.exports = {
  '/my/resource' : 
    request( 'http://my-sut-server.com/my/resource' )
    .responds( {
      status: 200
    })
}
```

becomes:

```
/my/resource
   √ should return status 200
```

### options.headers

asserts against headers in the headers collection. generates *"should emit http-header: 'xxx' as yyy"* asserts
    keys are expected HTTP-headers, values can be strings to compare to, or RegExps to match with.
    
Example:
```
module.exports = module.exports = {
  '/my path' : 
    request( 'http://my-sut-server.com/my-path' )
    .responds( {
      headers: { 
        'x-powered-by' : 'my cool server'
        etag : /.*/
      }
    })
}
```

becomes:
```
/my-path
   √ should emit http-header: 'x-powered-by' as 'my cool server'
   √ should emit http-header: 'etag' as /.*/

```
    
### options.responseHeaders

For add-hock assertions that should be performed against the *entire* headers collection, 
and cannot be expressed as descrete assertions against a single http header.
The test titles in this case are your responsibility. Your tests will be grouped under 'response headers' section
The value of this entry should be an object where every key is a test-tile, and every value 
is a function that accepts the `response.headers` collection and performs add-hock assertions against it.

Example:
```
module.exports = module.exports = {
  '/my path' : 
    request( 'http://my-sut-server.com/my-path' )
    .responds( {
      responseHeaders: { 
        'must contain either x-powered-by or x-server-type' : function(headers) {
            Should( headers['x-powered-by'] || headers['x-server-type']).be.ok
        }
      }
    })
}
```

becomes:
```
/my-path
    response headers
      √ must contain either x-powered-by or x-server-type

```

### options.body

an array of body asserts. Assertions may be:
  - `string` - asserts that the body is equal to the given `string` value, under title like : *"body should be : {your assertion value}"*.
       When the given value is longer than 20 chars the remnant is cut and appended with ellipis (...).
  - `RegExp` - asserts that the body matches the given `RegExp` value, under title like *"body should match: ..."*
  - `object` - this is a suite object, where every key is a test tile, and every value is a test-funciton that expects the body, 
       and lets you write whatever add-hock tests you need. In this case, the test titles are your responsibility.
  - `Array` - a combination of any of the above.
  
Example:
```
module.exports = module.exports = {
  '/my path' : 
    request( 'http://my-sut-server.com/index.html' )
    .responds( {
      body: [
        /<h3>Hello Anonymous</h3>/,
        /<h2>Our Catalog</h2>/,
        { 'should contain 3 promoted products' : function(body) { 
              var n = 0;
              body.replace(/class="promotedProduct"/, function() { n++ } );
              n.should.eql(3)
          }
        }
      ]
    })
}
```

becomes:
```
/my-path
   √ body should match: /<h3>Hello Anonymous</h3>/
   √ body should match: /<h2>Our Catalog</h2>/
   response body
      √ sould contain 3 promoted products
```
  
### options.json

When provided - it is stringified and treated a a string body asserter.

Example: 
```
module.exports = {
  '/api/search' : 
    'search for non existing product' : 
      request( 'http://my-sut-server.com/search?no-such-product' )
      .responds( {
        json: { products: [ ] }
      })
    },
    'search for specific existing product' : 
      request( 'http://my-sut-server.com/search?yellow%20t%20shirt' )
      .responds( {
        json: { products: [ { name: 'XL yellow T-Shirt', description: 'a very cool shirt, organic materials, very comfortable, loved by our customers' } ] }
      })
    }
  }
}
```

becomes:

```
/api/search 
   search for non existing product
      √ body should be '{ products: [ ] }'
   search for specific existing product
      √ body should be "{"products":[{"name"..."
```

### options.err
Assert an expected error for your request. 
  - Mind that it's a network error, and not HTTP error. HTTP errors are checked with `options.status`.
  - it's useful in wierd edge-cases, for example, when you want to test that the server instance terminates
    in response to a shutdown request by an authenticated administrator.

### options.and

a subsuite of add-hock custom assertions, performed against the entire response object.
The value should be an object where every key is a test-tile, and every value is a function that accepts the `response` 
object and performs add-hock assertions against it.


Example: 
```
module.exports = {
  '/api/wierd' : {
    request('http://my-sut-server.com/search?no-such-product')
    .responds({
      headers: { 
        'x-powered-by' : 'my cool server'
        etag : /.*/
      },
      and: {
        'should redirect header, or the resource' : function(res) {
            Should.be.ok(
              res.status == 302 ||
              res.status == 200 && res.headers['content-type'] == 'application/json' 
            )
        }
      }
    })
  }
}
```

becomes:
```

/api/wierd
   √ should emit http-header: 'x-powered-by' as 'my cool server'
   √ should emit http-header: 'etag' as /.*/
   and
      √ should give a redirect header, or the resource
```
   
For more detailed API spec - don't dig for docs - run the [test](#test), just like the BDD lore sais...
Have fun ;)

Contribute
==========
Sure, why not. That's why it's here ;)


Future
------
 * negated assertions (status is not..., body does not contain...)
 * handle timeouts


Lisence
-------
 * MIT
