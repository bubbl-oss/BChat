// tinyxhr by Shimon Doodkin - licanse: public doamin - https://gist.github.com/4706967
//
// tinyxhr("http://site.com/ajaxaction",function (err,data,xhr){ if (err) console.log("goterr ",err,'status='+xhr.status); console.log(data)  });
// tinyxhr("http://site.com/ajaxaction",function (err,data,xhr){ if (err) console.log("goterr ",err,'status='+xhr.status); console.log(data)  },'POST','value1=1&value2=2');
// tinyxhr("http://site.com/ajaxaction.json",function (err,data,xhr){ if (err) console.log("goterr ",err,'status='+xhr.status); console.log(data); console.log(JSON.parse(data))  },'POST',JSON.stringify({value:1}),'application/javascript');
// cb - a callback function like: function (err,data,XMLHttpRequestObject){ if (err) throw err;   }
//

function tinyxhr(url, cb, method, post, contenttype) {
  var requestTimeout, xhr;
  try {
    xhr = new XMLHttpRequest();
  } catch (e) {
    try {
      xhr = new ActiveXObject('Msxml2.XMLHTTP');
    } catch (e) {
      if (console) console.log('tinyxhr: XMLHttpRequest not supported');
      return null;
    }
  }
  requestTimeout = setTimeout(function () {
    xhr.abort();
    cb(new Error('tinyxhr: aborted by a timeout'), '', xhr);
  }, 10000);
  xhr.onreadystatechange = function () {
    if (xhr.readyState != 4) return;
    clearTimeout(requestTimeout);
    cb(
      xhr.status != 200
        ? new Error('tinyxhr: server respnse status is ' + xhr.status)
        : false,
      xhr.responseText,
      xhr
    );
  };
  xhr.open(method ? method.toUpperCase() : 'GET', url, true);

  xhr.withCredentials = true;

  if (!post) xhr.send();
  else {
    xhr.setRequestHeader(
      'Content-type',
      contenttype ? contenttype : 'application/x-www-form-urlencoded'
    );
    xhr.send(post);
  }
}

//tinyxhr("/test",function (err,data,xhr){ if (err) console.log("goterr ",err); console.log(data)  });
// tinyxhr.min.js;
// tinyxhr by Shimon Doodkin - licanse: public doamin - https://gist.github.com/4706967
//
// tinyxhr("http://site.com/ajaxaction",function (err,data,xhr){ if (err) console.log("goterr ",err,'status='+xhr.status); console.log(data)  });
// tinyxhr("http://site.com/ajaxaction",function (err,data,xhr){ if (err) console.log("goterr ",err,'status='+xhr.status); console.log(data)  },'POST','value1=1&value2=2');
// tinyxhr("http://site.com/ajaxaction.json",function (err,data,xhr){ if (err) console.log("goterr ",err,'status='+xhr.status); console.log(data); console.log(JSON.parse(data))  },'POST',JSON.stringify({value:1}),'application/javascript');
// cb - a callback function like: function (err,data,XMLHttpRequestObject){ if (err) throw err;   }
//

function tinyxhr(url, cb, method, post, contenttype) {
  var c = url,
    a = cb,
    i = method,
    f = post,
    b = contenttype;
  var d, h;
  try {
    h = new XMLHttpRequest();
  } catch (g) {
    try {
      h = new ActiveXObject('Msxml2.XMLHTTP');
    } catch (g) {
      if (console) {
        console.log('tinyxhr: XMLHttpRequest not supported');
      }
      return null;
    }
  }
  d = setTimeout(function () {
    h.abort();
    a(new Error('tinyxhr: aborted by a timeout'), '', h);
  }, 10000);
  h.onreadystatechange = function () {
    if (h.readyState != 4) {
      return;
    }
    clearTimeout(d);
    a(
      h.status != 200
        ? new Error('tinyxhr: server respnse status is ' + h.status)
        : false,
      h.responseText,
      h
    );
  };
  h.open(i ? i.toUpperCase() : 'GET', c, true);
  if (!f) {
    h.send();
  } else {
    h.setRequestHeader(
      'Content-type',
      b ? b : 'application/x-www-form-urlencoded'
    );
    h.send(f);
  }
}
