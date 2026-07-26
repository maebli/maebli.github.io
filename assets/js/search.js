// Client-side search over posts + the 100 Rust Challenge archive.
// The index (search.json) is fetched lazily on the first keystroke, so the
// page stays cheap for readers who never search.
(function () {
  'use strict';

  var input = document.getElementById('search-input');
  var results = document.getElementById('search-results');
  var status = document.getElementById('search-status');
  if (!input || !results) return;

  var indexUrl = input.getAttribute('data-index') || '/search.json';
  var docs = null;
  var loading = false;
  var pending = null;
  var timer = null;

  input.disabled = false;
  input.addEventListener('input', function () {
    window.clearTimeout(timer);
    timer = window.setTimeout(run, 120);
  });

  function run() {
    var query = input.value.trim();
    if (!query) {
      render([], '');
      say('');
      return;
    }
    if (docs) {
      search(query);
    } else {
      pending = query;
      load();
    }
  }

  function load() {
    if (loading) return;
    loading = true;
    say('Loading index…');

    fetch(indexUrl)
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (data) {
        docs = data;
        loading = false;
        if (pending !== null) {
          var q = pending;
          pending = null;
          search(q);
        }
      })
      .catch(function () {
        loading = false;
        say('Search is unavailable right now.');
      });
  }

  function search(query) {
    var terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    var hits = [];

    for (var i = 0; i < docs.length; i++) {
      var doc = docs[i];
      var title = (doc.t || '').toLowerCase();
      var body = (doc.b || '').toLowerCase();
      var cats = (doc.c || '').toLowerCase();
      var score = 0;
      var matchedAll = true;

      for (var j = 0; j < terms.length; j++) {
        var term = terms[j];
        var inTitle = title.indexOf(term) !== -1;
        var inBody = body.indexOf(term) !== -1;
        var inCats = cats.indexOf(term) !== -1;

        if (!inTitle && !inBody && !inCats) { matchedAll = false; break; }

        if (inTitle) score += 10;
        if (inCats) score += 2;
        if (inBody) score += 1;
      }

      if (!matchedAll) continue;

      // Whole-phrase title match ranks above scattered term matches.
      if (terms.length > 1 && title.indexOf(query.toLowerCase()) !== -1) score += 10;

      hits.push({ doc: doc, score: score });
    }

    hits.sort(function (a, b) {
      if (b.score !== a.score) return b.score - a.score;
      return (b.doc.d || '').localeCompare(a.doc.d || '');
    });

    render(hits, terms[0]);
    say(hits.length === 0
      ? 'No matches for “' + query + '”.'
      : hits.length + (hits.length === 1 ? ' match' : ' matches'));
  }

  function render(hits, term) {
    results.innerHTML = '';
    var limit = Math.min(hits.length, 40);

    for (var i = 0; i < limit; i++) {
      var doc = hits[i].doc;
      var li = document.createElement('li');

      var a = document.createElement('a');
      a.href = doc.u;
      a.textContent = doc.t;
      li.appendChild(a);

      var meta = document.createElement('p');
      meta.className = 'search-snippet';
      meta.innerHTML = escapeHtml(doc.d) + ' — ' + snippet(doc.b || '', term);
      li.appendChild(meta);

      results.appendChild(li);
    }

    if (hits.length > limit) {
      var more = document.createElement('li');
      more.className = 'search-snippet';
      more.textContent = '…and ' + (hits.length - limit) + ' more. Try a narrower query.';
      results.appendChild(more);
    }
  }

  function snippet(body, term) {
    if (!term) return escapeHtml(body.slice(0, 140)) + '…';
    var at = body.toLowerCase().indexOf(term);
    if (at === -1) return escapeHtml(body.slice(0, 140)) + '…';

    var start = Math.max(0, at - 60);
    var end = Math.min(body.length, at + term.length + 90);
    var text = body.slice(start, end);

    var localAt = at - start;
    return (start > 0 ? '…' : '') +
      escapeHtml(text.slice(0, localAt)) +
      '<mark>' + escapeHtml(text.slice(localAt, localAt + term.length)) + '</mark>' +
      escapeHtml(text.slice(localAt + term.length)) +
      (end < body.length ? '…' : '');
  }

  function say(message) {
    if (status) status.textContent = message;
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
})();
