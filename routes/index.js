
/*
 * GET home page.
 */

var URL   = require('url')
  , http = require('http')
  , qs    = require('querystring')
;

function image_url(url) {
  console.log("\x1b[33m" + url + "\x1b[0m");
  io.sockets.emit('image', url);
}

function check_url(url) {
  // FIXME: JavaScript で一度チェックしたURLはどうやって外す？
  //        連想配列か何かは使えるのか？

  if (url.match('4sq.com/') || url.match('fourquare.com/'))
    return;

  console.log("\x1b[32m" + url + "\x1b[0m");
  try {
    if (url.match('^http://instagr.am/p/')) {
      var cl = http.createClient(80, 'instagr.am');
      var req = cl.request('GET', '/api/v1/oembed/?format=json&maxheight=330&url=' + url, {'host': 'instagr.am'});
      req.on('response', function(res) {
        res.on('data', function(chunk) {
          image_url(JSON.parse(chunk).url);
        });
      });
      req.end();
      return;
    }

    if (url.match('^http://picplz.com/')) {
      image_url(url + '/thumb/400');
      return;
    }

    if (url.match('^http://twitpic.com/')) {
      image_url('http://twitpic.com/show/full/' + url.substring(19));
      return;
    }

    var parsed = URL.parse(url);
    if (!parsed['host'])
      return;

    var cl = http.createClient(80, parsed['host']);
    var req = cl.request('HEAD', parsed['path']);

    req.on('response', function(res) {
      if (res['headers']['location']) {
        check_url(res['headers']['location']);
      } else if (res['headers']['content-type'] && res['headers']['content-type'].substring(0, 6) == 'image/') {
        image_url(url);
      }
    });
    req.end();
  } catch (e) {

  }
}

function search_access(status)
{
        var post_date = new Date(status['created_at']);
        var year  = post_date.getFullYear();
        var month = ("0" + (post_date.getMonth() + 1)).substr(-2);
        var day   = ("0" + post_date.getDate()).substr(-2);
        var hour  = ("0" + post_date.getHours()).substr(-2);
        var min   = ("0" + post_date.getMinutes()).substr(-2);
        var sec   = ("0" + post_date.getSeconds()).substr(-2);

        var name = status['from_user_name'];
        var text = status['text'];
        var icon = status['profile_image_url'];


        io.sockets.emit('tweet', {
            text: text
          , name: name
          , icon: icon
          , at: year + "/" +  month + "/" + day + " " + hour + ":" + min + ":" + sec
        });

        var urls = text.match(/http:[^ ]+/g);

        if (urls) {
          for (var i = 0; i < urls.length; i++) 
            check_url(urls[i]);
        }

/*
        if (status && status['entities']) {
          if (status['entities']['urls']) {
            var urls = status['entities']['urls'];
            for (var i = 0; i < urls.length; i++) {
              check_url(urls[i]['expanded_url']);
            }
          }
      
          if (status['entities']['media']) {
            var media = status['entities']['media'];
            for (var i = 0; i < media.length; i++) {
              image_url(media[i]['media_url']);
            }
          }
        }
*/
}

function search(keyword) {
  console.log(keyword);

try {
  var cl = http.createClient(80, 'search.twitter.com');
  var req = cl.request('GET', '/search.json?' + qs.stringify({'q' : keyword, 'rpp':100, 'lang':'ja'}));
  req.on('response', function(res) {
  	res.setEncoding('utf8');
  	var buf = '';
    console.log("statusCode: ", res.statusCode);
    console.log("headers: ", res.headers);
    res.on('data', function(chunk) {
    	buf = buf + chunk;
    });
    res.on('end', function() {
        var result = JSON.parse(buf);

//console.log("------");
//console.log(status);
//console.log("------");

        if (result['results']) {
          for (i = 0; i < result['results'].length; i++)
            search_access(result['results'][i]);
        }
        

    });
  });
  req.end();
      } catch (e) {
        console.log(e);
      }
}


exports.index = function(req, res){
  if (req['body']['keyword']) {
    search(req['body']['keyword']);
  }
  res.render('index', {title: 'index'});
};

exports.tweet = function(req, res){
  res.render('tweet', {title: 'tweet stream'});
};

exports.image = function(req, res){
  res.render('image', {title: 'image stream'});
};
