module.exports.generateMeta = function(title, description, image, url, keywords) {
  return `
  <meta name="title" content="${title}" />
  <meta name="description" content="${description}" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:image" content="${image}" />
  <meta property="og:url" content="${url}" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image" content="${image}" />
  <meta property="og:site_name" content="BChat" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="image" content="${image}" />
  <meta name="robots" content="index, follow" />
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
  <meta name="language" content="English" />
  <meta name="keywords" content="${
    keywords || "Chat,Anonymous Chat,AUN,Bchat"
  }"/>
  `;
}

module.exports.redirectToVue = function(route, vars) {
  return function(req, res, next) {
  const ua = req.useragent;

  if (
    ua.isChrome ||
    ua.isEdge ||
    ua.isSafari ||
    ua.isFirefox ||
    ua.isWebkit ||
    ua.isOpera ||
    ua.isOmniweb ||
    ua.isSeaMonkey ||
    ua.isFlock ||
    ua.isAmaya ||
    ua.isSamsung ||
    ua.isIE ||
    ua.isKindleFire ||
    ua.isBada ||
    ua.isBlackberry ||
    ua.isPad ||
    ua.isWinJs ||
    ua.isSilk ||
    ua.isSmartTV ||
    ua.isUC ||
    ua.issilkAccelerated ||
    ua.isAlamoFire
  ) {
    // IF it is any of these redirect to the main... app! ${APP_URL}... thank you Jesus!
    // if it;s /p/:slug use new redirecter
    // This is the old post link doe...
    // if (/^\/p\/.*$/.test(req.originalUrl)) {
    //   return redirectToPost(req, res, next);
    // }

    return res.redirect(route + req.params[vars[0].key] && '');
  }

  return next();
  }
};