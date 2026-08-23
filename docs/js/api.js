// ============================================
// API SHIM (v3.0) — Kalis-cookie, sedar-sesi
// Menggantikan transport google.script.run dengan
// fetch POST ke /exec (doPost).
//
// Baharu dalam v3: token dihantar dalam SAMPUL setiap
// permintaan, bukan hanya sebagai hujah. Pelayan perlukan
// token itu untuk memutuskan sama ada pemanggil boleh
// menulis — dan keputusan itu mesti dibuat SEBELUM fungsi
// sebenar dijalankan, jadi ia tidak boleh bergantung pada
// hujah yang setiap fungsi susun berbeza-beza.
//
// Memerlukan window.URL_EXEC diset oleh halaman.
// ============================================
(function() {
  if (!window.URL_EXEC) return;
  if (typeof Proxy === 'undefined') return; // fallback

  function tokenSemasa() {
    try {
      return sessionStorage.getItem('token') || 'TETAMU';
    } catch (e) {
      return 'TETAMU';
    }
  }

  function bina(h) {
    return new Proxy({}, {
      get: function(sasar, nama) {
        if (nama === 'withSuccessHandler') {
          return function(f) {
            return bina({ ok: f, err: h.err });
          };
        }
        if (nama === 'withFailureHandler') {
          return function(f) {
            return bina({ ok: h.ok, err: f });
          };
        }
        if (typeof nama !== 'string') return undefined;
        return function() {
          var args = Array.prototype.slice
            .call(arguments);
          /* Had masa. Tanpa ini, permintaan yang tidak pernah
             dijawab menggantung antara muka selama-lamanya —
             tiada ralat, tiada mesej, hanya tirai memuat. */
          var pemutus = (typeof AbortController !== 'undefined')
            ? new AbortController() : null;
          var jam = setTimeout(function() {
            if (pemutus) pemutus.abort();
          }, 25000);

          fetch(window.URL_EXEC, {
            method: 'POST',
            redirect: 'follow',
            signal: pemutus ? pemutus.signal : undefined,
            headers: {
              'Content-Type': 'text/plain;charset=utf-8'
            },
            body: JSON.stringify({
              fn: nama,
              args: args,
              token: tokenSemasa()
            })
          })
          .then(function(r) {
            clearTimeout(jam);
            return r.text().then(function(teks) {
              try {
                return JSON.parse(teks);
              } catch (e) {
                /* Apps Script memulangkan HTML, bukan JSON. Hampir selalu
                   bermakna doPost tiada dalam projek, atau deployment
                   perlu dibuat semula. */
                var x = new Error('Pelayan memulangkan halaman, bukan data. ' +
                  'Semak: doPost ada dalam projek? Deployment sudah ' +
                  'dibuat semula (New version)?');
                x.kod = 'BUKAN_JSON';
                throw x;
              }
            });
          })
          .then(function(j) {
            if (j && j.ok) {
              if (h.ok) h.ok(j.hasil);
            } else {
              var ralat = new Error(
                (j && j.ralat) || 'Ralat pelayan');
              // Kod membezakan "sesi tamat" daripada "tiada
              // kebenaran". Dua keadaan itu memerlukan dua
              // mesej yang berbeza kepada guru.
              ralat.kod = (j && j.kod) || '';
              if (h.err) h.err(ralat);
              else console.error(ralat);
            }
          })
          .catch(function(e) {
            clearTimeout(jam);
            if (e && e.name === 'AbortError') {
              e = new Error('Pelayan tidak menjawab dalam 25 saat.');
              e.kod = 'TAMAT_MASA';
            }
            if (h.err) h.err(e);
            else console.error(e);
          });
        };
      }
    });
  }

  try {
    if (!window.google) window.google = {};
    if (!window.google.script) window.google.script = {};
    window.google.script.run = bina({});
  } catch (e) {
    // Kekal guna transport asal jika gagal
  }
})();
