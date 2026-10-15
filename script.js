(function () {
  var $ = function (s, r) {
    return (r || document).querySelector(s);
  };
  var $$ = function (s, r) {
    return Array.prototype.slice.call((r || document).querySelectorAll(s));
  };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- theme ---------- */
  var root = document.documentElement;
  try {
    var saved = localStorage.getItem('ilamdar-theme');
    if (saved) {
      root.setAttribute('data-theme', saved);
    }
  }
  catch (e) {
  }
  $('#theme').addEventListener('click', function () {
    var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try {
      localStorage.setItem('ilamdar-theme', next);
    }
    catch (e) {
    }
    readColors();
  });

  /* ---------- background canvas ---------- */
  var cv = $('#bg');
  var cx = cv.getContext('2d');
  var W;
  var H;
  var DPR = Math.min(window.devicePixelRatio || 1, 2);
  var c1 = '43,108,255';
  var c2 = '40,225,255';
  function readColors() {
    var s = getComputedStyle(root);
    c1 = s.getPropertyValue('--rgb1').trim() || c1;
    c2 = s.getPropertyValue('--rgb2').trim() || c2;
  }
  function resize() {
    W = window.innerWidth;
    H = window.innerHeight;
    cv.width = W * DPR;
    cv.height = H * DPR;
    cx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  resize();
  readColors();
  window.addEventListener('resize', resize);
  var parts = [];
  for (var i = 0; i < 70; i++) {
    parts.push({ x: Math.random(), y: Math.random(), r: Math.random() * 2.2 + .6, s: Math.random() * .0004 + .00008, p: Math.random() * 6.28 });
  }
  var trail = [];
  function addTrail(x, y) {
    trail.push({ x: x, y: y, l: 1 });
    if (trail.length > 60) {
      trail.shift();
    }
  }
  window.addEventListener('pointermove', function (e) {
    addTrail(e.clientX, e.clientY);
  }, { passive: true });
  var t0 = 0;
  function frame(t) {
    cx.clearRect(0, 0, W, H);
    // flowing ink strokes
    for (var k = 0; k < 5; k++) {
      cx.beginPath();
      var amp = 40 + k * 18;
      var base = H * (.25 + k * .14);
      var ph = t * .00028 * (1 + k * .18) + k * 1.7;
      for (var x = 0; x <= W; x += 14) {
        var y = base + Math.sin(x * .0042 + ph) * amp + Math.sin(x * .011 - ph * 1.3) * amp * .35;
        if (x === 0) {
          cx.moveTo(x, y);
        }
        else {
          cx.lineTo(x, y);
        }
      }
      var g = cx.createLinearGradient(0, 0, W, 0);
      g.addColorStop(0, 'rgba(' + c1 + ',0)');
      g.addColorStop(.5, 'rgba(' + (k % 2 ? c2 : c1) + ',' + (.22 - k * .025) + ')');
      g.addColorStop(1, 'rgba(' + c2 + ',0)');
      cx.strokeStyle = g;
      cx.lineWidth = 1.2 + k * .5;
      cx.stroke();
    }
    // ink particles
    for (var j = 0; j < parts.length; j++) {
      var p = parts[j];
      p.y -= p.s * (reduce ? 0 : 16);
      if (p.y < -.02) {
        p.y = 1.02;
        p.x = Math.random();
      }
      var px = p.x * W + Math.sin(t * .0004 + p.p) * 18;
      var py = p.y * H;
      cx.beginPath();
      cx.arc(px, py, p.r, 0, 6.283);
      cx.fillStyle = 'rgba(' + c2 + ',' + (.18 + .25 * Math.abs(Math.sin(t * .001 + p.p))) + ')';
      cx.fill();
    }
    // cursor ink trail
    for (var n = 0; n < trail.length - 1; n++) {
      var a = trail[n];
      var b = trail[n + 1];
      a.l -= .018;
      if (a.l > 0) {
        cx.beginPath();
        cx.moveTo(a.x, a.y);
        cx.lineTo(b.x, b.y);
        cx.strokeStyle = 'rgba(' + c2 + ',' + (a.l * .55) + ')';
        cx.lineWidth = a.l * 3.2;
        cx.lineCap = 'round';
        cx.stroke();
      }
    }
    while (trail.length && trail[0].l <= 0) {
      trail.shift();
    }
    if (!reduce) {
      requestAnimationFrame(frame);
    }
  }
  requestAnimationFrame(frame);

  /* ---------- waveform bars ---------- */
  function buildBars(el, n) {
    el.innerHTML = '';
    for (var i = 0; i < n; i++) {
      var s = document.createElement('span');
      var env = Math.sin(i / n * Math.PI);
      s.style.setProperty('--h', (18 + env * 62 * (.5 + Math.random() * .5)) + '%');
      s.style.setProperty('--d', (-Math.random() * 1.3).toFixed(2) + 's');
      el.appendChild(s);
    }
  }
  $$('.bars[data-n]').forEach(function (b) {
    buildBars(b, +b.dataset.n);
  });
  buildBars($('#rBars'), 52);

  /* ---------- toast ---------- */
  var tt;
  function toast(m) {
    var t = $('#toast');
    t.textContent = m;
    t.classList.add('show');
    clearTimeout(tt);
    tt = setTimeout(function () {
      t.classList.remove('show');
    }, 3200);
  }

  /* ---------- placeholder typing ---------- */
  var field = $('#text');
  var lang = 'en';
  var phrases = { en: ['Type what your voice should say', 'Read my story aloud in my voice', 'Say good evening to everyone'], ur: ['لکھیے، آپ کی آواز بولے گی', 'یہ کہانی میری آواز میں سنائیں', 'سب کو شام بخیر کہیں'] };
  var pi = 0;
  var ci = 0;
  var del = false;
  var pt;
  function type() {
    if (document.activeElement === field || field.value) {
      pt = setTimeout(type, 900);
      return;
    }
    var list = phrases[lang];
    var txt = list[pi % list.length];
    ci += del ? -1 : 1;
    field.placeholder = txt.slice(0, ci) + (ci % 2 ? '|' : '');
    var d = del ? 24 : 62;
    if (!del && ci >= txt.length) {
      del = true;
      d = 1600;
      field.placeholder = txt;
    }
    else if (del && ci <= 0) {
      del = false;
      pi++;
      d = 350;
    }
    pt = setTimeout(type, reduce ? 4000 : d);
  }
  type();

  /* ---------- language toggle ---------- */
  $$('.lang button').forEach(function (b) {
    b.addEventListener('click', function () {
      setLang(b.dataset.l);
    });
  });
  function setLang(l) {
    lang = l;
    pi = 0;
    ci = 0;
    del = false;
    $$('.lang button').forEach(function (x) {
      var on = x.dataset.l === l;
      x.classList.toggle('on', on);
      x.setAttribute('aria-pressed', on);
    });
    field.dir = l === 'ur' ? 'rtl' : 'auto';
    field.style.fontFamily = l === 'ur' ? 'var(--urdu)' : '';
    field.lang = l;
  }

  /* ---------- plus menu ---------- */
  var plus = $('#plus');
  var menu = $('#menu');
  function openMenu(o) {
    menu.classList.toggle('open', o);
    plus.setAttribute('aria-expanded', o);
    if (o) {
      var f = $('button', menu);
      setTimeout(function () {
        f && f.focus();
      }, 60);
    }
  }
  plus.addEventListener('click', function (e) {
    e.stopPropagation();
    openMenu(!menu.classList.contains('open'));
  });
  document.addEventListener('click', function (e) {
    if (!menu.contains(e.target) && e.target !== plus) {
      openMenu(false);
    }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && menu.classList.contains('open')) {
      openMenu(false);
      plus.focus();
    }
  });
  menu.addEventListener('keydown', function (e) {
    var items = $$('button', menu);
    var i = items.indexOf(document.activeElement);
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      items[(i + 1) % items.length].focus();
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      items[(i - 1 + items.length) % items.length].focus();
    }
  });
  $$('[data-pick]', menu).forEach(function (b) {
    b.addEventListener('click', function () {
      var k = b.dataset.pick;
      if (k === 'record') {
        toggleRecord();
        return;
      }
      openMenu(false);
      $('#f-' + k).click();
    });
  });

  /* ---------- files and chips ---------- */
  var files = [];
  var chips = $('#chips');
  var icons = {
    audio: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 18V6l11-2v12"/><circle cx="6.500" cy="18" r="2.500"/></svg>',
    doc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/></svg>'
  };
  function size(b) {
    return b > 1048576 ? (b / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(b / 1024)) + ' KB';
  }
  function kind(f) {
    return f.type.indexOf('image') === 0 ? 'image' : (f.type.indexOf('audio') === 0 || /\.(mp3|wav|m4a|ogg|webm)$/i.test(f.name)) ? 'audio' : 'doc';
  }
  function addFile(f, label) {
    var k = kind(f);
    var id = Date.now() + Math.random();
    var el = document.createElement('div');
    el.className = 'chip';
    var thumb = k === 'image' ? '<img alt="" src="' + URL.createObjectURL(f) + '">' : icons[k];
    el.innerHTML = '<span class="t">' + thumb + '</span><span class="n"></span><em>' + size(f.size) + '</em><button aria-label="Remove file">&times;</button>';
    $('.n', el).textContent = label || f.name;
    $('button', el).addEventListener('click', function () {
      el.remove();
      files = files.filter(function (x) {
        return x.id !== id;
      });
    });
    chips.appendChild(el);
    files.push({ id: id, f: f, k: k });
  }
  ['audio', 'image', 'doc'].forEach(function (k) {
    $('#f-' + k).addEventListener('change', function (e) {
      Array.prototype.forEach.call(e.target.files, function (f) {
        addFile(f);
      });
      if (e.target.files.length) {
        toast(e.target.files.length + (e.target.files.length > 1 ? ' files' : ' file') + ' added');
      }
      e.target.value = '';
    });
  });
  var bar = $('#bar');
  ['dragenter', 'dragover'].forEach(function (ev) {
    bar.addEventListener(ev, function (e) {
      e.preventDefault();
      bar.classList.add('drag');
    });
  });
  ['dragleave', 'drop'].forEach(function (ev) {
    bar.addEventListener(ev, function (e) {
      e.preventDefault();
      bar.classList.remove('drag');
    });
  });
  bar.addEventListener('drop', function (e) {
    Array.prototype.forEach.call(e.dataTransfer.files, function (f) {
      addFile(f);
    });
  });

  /* ---------- recording ---------- */
  var rec = null;
  var chunks = [];
  var stream = null;
  var rt;
  var secs = 0;
  function toggleRecord() {
    if (rec && rec.state === 'recording') {
      rec.stop();
      return;
    }
    if (!navigator.mediaDevices || !window.MediaRecorder) {
      toast('Recording is not supported in this browser. Upload an audio file instead.');
      return;
    }
    navigator.mediaDevices.getUserMedia({ audio: true }).then(function (s) {
      stream = s;
      chunks = [];
      rec = new MediaRecorder(s);
      secs = 0;
      rec.ondataavailable = function (e) {
        if (e.data.size) {
          chunks.push(e.data);
        }
      };
      rec.onstop = function () {
        clearInterval(rt);
        stream.getTracks().forEach(function (t) {
          t.stop();
        });
        $('#recBtn').classList.remove('rec-on');
        $('#recLabel').textContent = 'Record your voice';
        $('#recSub').textContent = 'Use your microphone';
        var type = rec.mimeType || 'audio/webm';
        var blob = new Blob(chunks, { type: type });
        var f = new File([blob], 'Recording ' + fmt(secs) + '.' + (type.indexOf('mp4') > -1 ? 'm4a' : 'webm'), { type: type });
        addFile(f, f.name);
        toast('Recording saved to your request');
      };
      rec.start();
      $('#recBtn').classList.add('rec-on');
      $('#recLabel').textContent = 'Stop recording';
      $('#recSub').textContent = 'Recording 0:00';
      rt = setInterval(function () {
        secs++;
        $('#recSub').textContent = 'Recording ' + fmt(secs);
      }, 1000);
    }).catch(function () {
      toast('Microphone access was blocked. Allow it in your browser, or upload an audio file.');
    });
  }
  function fmt(s) {
    return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2);
  }

  /* ---------- try chips ---------- */
  $$('#try button').forEach(function (b) {
    b.addEventListener('click', function () {
      setLang(b.dataset.l);
      field.value = b.dataset.t;
      field.focus();
    });
  });

  /* ---------- generate (front-end simulation) ---------- */
  var res = $('#result');
  var prog = $('#prog');
  var stage = $('#stage');
  var busy = false;
  var stages = ['Listening to your sample', 'Learning pitch and pace', 'Matching Urdu and English sounds', 'Writing your speech'];
  function generate() {
    if (busy) {
      return;
    }
    var txt = field.value.trim();
    var hasAudio = files.some(function (x) {
      return x.k === 'audio';
    });
    if (!txt && !files.length) {
      toast('Type a line or add a voice sample first.');
      field.focus();
      return;
    }
    busy = true;
    res.className = 'result show';
    $('#rTitle').textContent = 'Writing your voice';
    $('#rSub').textContent = hasAudio ? 'Ilamdar is listening to your sample.' : 'No voice sample yet, so a placeholder voice is used in this preview.';
    $('#rBars').classList.remove('still');
    prog.style.width = '0';
    var q = $('#quote');
    q.textContent = txt || 'Your attached files are ready to be read aloud.';
    q.classList.toggle('ur', /[\u0600-\u06FF]/.test(txt));
    q.dir = 'auto';
    var p = 0;
    var si = 0;
    stage.textContent = stages[0];
    var iv = setInterval(function () {
      p += 2.5 + Math.random() * 3;
      prog.style.width = Math.min(p, 100) + '%';
      si = Math.min(stages.length - 1, Math.floor(p / 25));
      stage.textContent = stages[si];
      if (p >= 100) {
        clearInterval(iv);
        busy = false;
        res.classList.add('done');
        $('#rTitle').textContent = 'Preview ready';
        $('#rSub').textContent = 'Here is how your result will appear.';
        stage.textContent = '';
        $('#rBars').classList.add('still');
      }
    }, reduce ? 20 : 110);
    res.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
  }
  $('#go').addEventListener('click', generate);
  field.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      generate();
    }
  });
  $('#again').addEventListener('click', function () {
    document.getElementById('top').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
    setTimeout(function () {
      openMenu(true);
    }, reduce ? 0 : 650);
  });
})();
