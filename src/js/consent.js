    // --- Consentimento de cookies (LGPD) ---------------------------------------------------
    // Fonte única: src/js/consent.js. O build injeta este trecho no <head> de todas as páginas.
    // As etiquetas do Google (Analytics e Ads) só carregam depois que a pessoa clica em "Aceitar"
    // no aviso. Antes disso gtag() não faz nada: nenhum cookie é gravado e nada vai ao Google.
    // A escolha fica no navegador (localStorage, chave "uno_cookie_consent") por 180 dias.
    // O link "Cookies" do rodapé reabre o aviso (unoConsent.ask()).
    window.dataLayer = window.dataLayer || [];
    var unoConsent = (function () {
      var KEY = 'uno_cookie_consent';
      var MAX_AGE = 180 * 24 * 60 * 60 * 1000;
      var root = document.documentElement;
      var loaded = false;

      function read() {
        try {
          var saved = JSON.parse(localStorage.getItem(KEY) || 'null');
          if (saved && (saved.v === 'granted' || saved.v === 'denied') && Date.now() - saved.t < MAX_AGE) return saved.v;
        } catch (e) {}
        return null;
      }
      function write(value) {
        try { localStorage.setItem(KEY, JSON.stringify({ v: value, t: Date.now() })); } catch (e) {}
      }
      function show() { root.classList.add('cc-ask'); }
      function hide() { root.classList.remove('cc-ask'); }

      // Carrega gtag.js uma única vez, já com o consentimento registrado.
      // ad_personalization fica sempre negado: o site não alimenta remarketing.
      function loadTags() {
        if (loaded) return;
        loaded = true;
        gtag('consent', 'default', {
          'ad_storage': 'granted',
          'ad_user_data': 'granted',
          'ad_personalization': 'denied',
          'analytics_storage': 'granted'
        });
        gtag('js', new Date());
        gtag('config', '{{ADS_TAG_ID}}');
        gtag('config', '{{GA4_ID}}');
        var s = document.createElement('script');
        s.async = true;
        s.src = 'https://www.googletagmanager.com/gtag/js?id={{ADS_TAG_ID}}';
        document.head.appendChild(s);
      }

      // Apaga os cookies do Google gravados neste site (_ga, _ga_<ID>, _gcl_au...).
      function clearCookies() {
        try {
          var parts = location.hostname.split('.');
          var domains = [''];
          while (parts.length > 1) { domains.push(parts.join('.')); domains.push('.' + parts.join('.')); parts.shift(); }
          document.cookie.split(';').forEach(function (pair) {
            var name = pair.split('=')[0].trim();
            if (!/^_(ga|gcl|gid|gat|gac)/.test(name)) return;
            domains.forEach(function (d) {
              document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/' + (d ? '; domain=' + d : '');
            });
          });
        } catch (e) {}
      }

      var choice = read();
      if (choice === null) show();

      return {
        granted: function () { return choice === 'granted'; },
        accept: function () {
          choice = 'granted';
          write(choice);
          hide();
          loadTags();
        },
        // Recusar apaga os cookies do Google que já existirem (inclusive os de antes do aviso).
        // Se as etiquetas já estavam carregadas, recarrega a página sem elas.
        refuse: function () {
          var hadTags = loaded;
          choice = 'denied';
          write(choice);
          hide();
          clearCookies();
          if (hadTags) location.reload();
        },
        ask: function () {
          show();
          var banner = document.getElementById('cc-banner');
          if (banner) banner.focus();
          return false;
        },
        start: function () { if (choice === 'granted') loadTags(); }
      };
    })();
    function gtag(){ if (unoConsent.granted()) dataLayer.push(arguments); }
    unoConsent.start();
