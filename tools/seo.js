module.exports.generateMeta = function (
  title,
  description,
  image,
  url,
  keywords
) {
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
    keywords || 'Chat,Anonymous Chat,AUN,Bchat'
  }"/>
  `;
};

module.exports.redirectToVue = function (route, vars) {
  return function (req, res, next) {
    const ua = req.useragent;

    if (
      !req.xhr ||
      !req.headers.accept.indexOf('json') > -1 ||
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
      let to = route;

      if (vars.length > 0) {
        // TODO: make more flexible to allow multiple params
        to += req.params[vars[0].key];
      }

      return res.redirect(to);
    }

    return next();
  };
};
