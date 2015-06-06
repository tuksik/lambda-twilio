var async = require('async'),
  ig = require('instagram-node').instagram(),
  config = require('./config.json'),
  twilio = require('twilio')(config.twilio.sid, config.twilio.token);

ig.use({ client_id: config.instagram.client_id,
  client_secret: config.instagram.client_secret });

exports.handler = function(event, context) {
  context = context || {
    succeed: function(){},
    fail: function(){},
    done: function(){}
  };

  if( !event.tag || !event.tel ){
    return context.done(new Error('invalid params'));
  }

  async.waterfall([
    function( done ){
      ig.tag_media_recent(event.tag, done);
    },
    function( medias, pagination, remaining, limit, done ){
      var mediaImages = medias.slice(0,3).map(function( media ){
        return media.images.low_resolution.url;
      });
      done(null, mediaImages);
    },
    function( mediaImages, done ){
      async.forEach(mediaImages, function( image, done ){
        twilio.sendMessage({
          to:'+1' + event.tel.trim(),
          from: config.twilio['from-number'],
          mediaUrl: image
        }, done)
      }, done)
    }
  ], function( err ){
    console.log(arguments);
    if(err) return context.fail(err);
    context.succeed(event);
    // context.done();
  })
};
