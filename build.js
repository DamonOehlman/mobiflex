var interleave = require('interleave'),
    less = require('less'),
    fs = require('fs'),
    config = {
        aliases: {
            'eve': 'github://DmitryBaranovskiy/eve/eve.js'
        }
    };

// build each of the builds
interleave('src/js', {
    multi: 'pass',
    path: 'dist/',
    config: config
});