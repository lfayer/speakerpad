var pg = require('pg');

var pgConf = require('../etc/config').postgres || {};

// Configure the pg.defaults so that we can require('pg') directly without
// having to worry about basic configuration.
for(var i in pgConf){
    pg.defaults[i] = pgConf[i];
}

// The pg modules handles client pooling. After connecting, it provides a
// function done() to call when you're done to release the client back to the
// pool. Failing to do this will leak clients. This wrapper makes sure the
// convenience query function handles this automatically.
function wrapQueryCallback(cb, done){
    return function(err, results){
        done();
        return cb && cb(err, results);
    };
}

// Convenince wrapper for basic query. Most of the time you just need to make a
// single query, so handling the common connect() and done() automatically
// helps keep things clean.
function query(){
    var args = arguments;
    var argsLength = args.length;
    var callback = (typeof args[argsLength-1] === 'function')
        && args[argsLength-1];

    pg.connect(function(err, client, done){
        if(err){
            return callback && callback(err);
        }

        // Create callback that will handle done();
        var queryCallback = wrapQueryCallback(callback, done);
        // If a callback was in the arguments, replace it. Otherwise, add it.
        if(callback){
            args[argsLength-1] = queryCallback;
        } else {
            args.push(queryCallback);
        }

        client.query.apply(client, args);
    });
}

module.exports = {
    query: query
}
