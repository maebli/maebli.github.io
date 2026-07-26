// Share row behaviour: copy-to-clipboard and Mastodon (which has no universal
// share intent, so we ask for the reader's instance once and remember it).
(function () {
  'use strict';

  var row = document.querySelector('.share');
  if (!row) return;

  var url = row.getAttribute('data-share-url') || window.location.href;
  var title = row.getAttribute('data-share-title') || document.title;

  var copyBtn = row.querySelector('[data-share="copy"]');
  if (copyBtn) {
    copyBtn.addEventListener('click', function () {
      copy(url).then(function () {
        flash(copyBtn, 'Copied');
      }, function () {
        flash(copyBtn, 'Press Ctrl+C');
        window.prompt('Copy this link:', url);
      });
    });
  }

  var mastoBtn = row.querySelector('[data-share="mastodon"]');
  if (mastoBtn) {
    mastoBtn.addEventListener('click', function () {
      var saved = '';
      try { saved = window.localStorage.getItem('mastodon-instance') || ''; } catch (e) {}

      var host = window.prompt(
        'Your Mastodon instance (e.g. mastodon.social):', saved
      );
      if (!host) return;

      host = host.trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
      if (!host) return;

      try { window.localStorage.setItem('mastodon-instance', host); } catch (e) {}

      var target = 'https://' + host + '/share?text=' +
        encodeURIComponent(title + ' ' + url);
      window.open(target, '_blank', 'noopener,noreferrer');
    });
  }

  function copy(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    // Older browsers, and any non-secure context, where the async API is absent.
    return new Promise(function (resolve, reject) {
      var el = document.createElement('textarea');
      el.value = text;
      el.setAttribute('readonly', '');
      el.style.position = 'fixed';
      el.style.opacity = '0';
      document.body.appendChild(el);
      el.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      document.body.removeChild(el);
      ok ? resolve() : reject(new Error('copy failed'));
    });
  }

  function flash(btn, message) {
    var previous = btn.getAttribute('title');
    btn.classList.add('is-copied');
    btn.setAttribute('title', message);
    window.setTimeout(function () {
      btn.classList.remove('is-copied');
      btn.setAttribute('title', previous);
    }, 1600);
  }
})();
