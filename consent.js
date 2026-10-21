/* Google Analytics 4 with Google Consent Mode.
   Analytics storage is denied by default. Choosing "Accept Analytics" grants
   it; "Reject Non-Essential Cookies" keeps it denied and clears any _ga
   cookies. The choice is remembered in this browser. No personal details are
   ever sent to Analytics (see track() in script.js). */
(function () {
  var GA_ID = 'G-DZBMHQG1QL';
  var KEY = 'wfaConsent';

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;

  function readChoice() {
    try { return window.localStorage.getItem(KEY); } catch (e) { return null; }
  }
  function saveChoice(value) {
    try { window.localStorage.setItem(KEY, value); } catch (e) { /* choice just won't persist */ }
  }

  var choice = readChoice();

  // Defaults must be set before the first config call.
  gtag('consent', 'default', {
    analytics_storage: choice === 'granted' ? 'granted' : 'denied',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    wait_for_update: 500
  });

  gtag('js', new Date());
  gtag('config', GA_ID);

  var tag = document.createElement('script');
  tag.async = true;
  tag.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
  document.head.appendChild(tag);

  function clearAnalyticsCookies() {
    var hostParts = window.location.hostname.split('.');
    var domains = [window.location.hostname];
    for (var i = 1; i < hostParts.length - 1; i++) {
      domains.push('.' + hostParts.slice(i).join('.'));
    }
    document.cookie.split(';').forEach(function (c) {
      var name = c.split('=')[0].trim();
      if (name === '_ga' || name.indexOf('_ga_') === 0 || name === '_gid') {
        domains.forEach(function (d) {
          document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=' + d;
        });
        document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
      }
    });
  }

  function apply(value) {
    saveChoice(value);
    gtag('consent', 'update', { analytics_storage: value === 'granted' ? 'granted' : 'denied' });
    if (value !== 'granted') clearAnalyticsCookies();
  }

  function init() {
    var banner = document.getElementById('cookie-banner');
    if (!banner) return;
    var accept = document.getElementById('cookie-accept');
    var reject = document.getElementById('cookie-reject');
    var settings = document.getElementById('cookie-settings');

    function show() {
      banner.hidden = false;
      accept.focus();
    }
    function hide() { banner.hidden = true; }

    accept.addEventListener('click', function () { apply('granted'); hide(); });
    reject.addEventListener('click', function () { apply('denied'); hide(); });
    if (settings) settings.addEventListener('click', show);

    banner.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && readChoice()) hide();
    });

    // First visit: ask. Later visits: stay quiet until "Cookie settings" is used.
    if (!choice) banner.hidden = false;
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
