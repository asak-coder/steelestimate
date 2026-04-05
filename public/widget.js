(function () {
  'use strict';

  var script = document.currentScript || (function () {
    var scripts = document.getElementsByTagName('script');
    return scripts[scripts.length - 1];
  })();

  var config = {
    apiBaseUrl: script && script.getAttribute('data-api-base-url') || '',
    currency: script && script.getAttribute('data-currency') || 'USD',
    title: script && script.getAttribute('data-title') || 'Quick Estimate',
    buttonText: script && script.getAttribute('data-button-text') || 'Calculate',
    primaryColor: script && script.getAttribute('data-primary-color') || '#0f62fe'
  };

  var state = {
    open: false,
    loading: false,
    result: null,
    error: null
  };

  var rootId = 'tw-widget-root';
  var styleId = 'tw-widget-style';

  function qs(sel, el) {
    return (el || document).querySelector(sel);
  }

  function ce(tag, attrs, children) {
    var el = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (key) {
        if (key === 'className') el.className = attrs[key];
        else if (key === 'textContent') el.textContent = attrs[key];
        else if (key.indexOf('on') === 0 && typeof attrs[key] === 'function') el[key.toLowerCase()] = attrs[key];
        else el.setAttribute(key, attrs[key]);
      });
    }
    (children || []).forEach(function (child) {
      el.appendChild(child);
    });
    return el;
  }

  function money(value) {
    var num = Number(value) || 0;
    try {
      return new Intl.NumberFormat(undefined, { style: 'currency', currency: config.currency }).format(num);
    } catch (e) {
      return config.currency + ' ' + num.toFixed(2);
    }
  }

  function injectStyles() {
    if (document.getElementById(styleId)) return;
    var css = [
      '#' + rootId + ' { all: initial; }',
      '#' + rootId + ' * { box-sizing: border-box; font-family: Arial, sans-serif; }',
      '.tw-widget-launcher{position:fixed;right:20px;bottom:20px;z-index:2147483647;background:' + config.primaryColor + ';color:#fff;border:0;border-radius:999px;padding:14px 18px;font-size:14px;line-height:1;cursor:pointer;box-shadow:0 10px 24px rgba(0,0,0,.18)}',
      '.tw-widget-launcher:hover{filter:brightness(1.05)}',
      '.tw-widget-overlay{position:fixed;inset:0;z-index:2147483646;background:rgba(0,0,0,.45);display:flex;align-items:flex-end;justify-content:flex-end;padding:20px}',
      '.tw-widget-panel{width:100%;max-width:360px;background:#fff;border-radius:18px;box-shadow:0 18px 50px rgba(0,0,0,.22);overflow:hidden}',
      '.tw-widget-header{display:flex;justify-content:space-between;align-items:center;padding:16px 18px;background:' + config.primaryColor + ';color:#fff}',
      '.tw-widget-title{font-size:16px;font-weight:700;margin:0}',
      '.tw-widget-close{background:transparent;border:0;color:#fff;font-size:24px;line-height:1;cursor:pointer}',
      '.tw-widget-body{padding:18px}',
      '.tw-widget-field{margin-bottom:12px}',
      '.tw-widget-label{display:block;font-size:12px;font-weight:700;margin:0 0 6px;color:#334155}',
      '.tw-widget-input{width:100%;padding:12px 14px;border:1px solid #d1d5db;border-radius:10px;font-size:14px;outline:none}',
      '.tw-widget-input:focus{border-color:' + config.primaryColor + ';box-shadow:0 0 0 3px rgba(15,98,254,.12)}',
      '.tw-widget-actions{display:flex;gap:10px;margin-top:14px}',
      '.tw-widget-button{flex:1;border:0;border-radius:10px;padding:12px 14px;font-size:14px;font-weight:700;cursor:pointer;background:' + config.primaryColor + ';color:#fff}',
      '.tw-widget-button[disabled]{opacity:.65;cursor:not-allowed}',
      '.tw-widget-secondary{background:#e2e8f0;color:#0f172a}',
      '.tw-widget-result,.tw-widget-error{margin-top:14px;padding:12px 14px;border-radius:10px;font-size:14px}',
      '.tw-widget-result{background:#ecfdf5;color:#065f46}',
      '.tw-widget-error{background:#fef2f2;color:#991b1b}',
      '.tw-widget-hint{font-size:12px;color:#64748b;margin-top:10px;line-height:1.4}'
    ].join('');
    var style = ce('style', { id: styleId, textContent: css });
    document.head.appendChild(style);
  }

  function build() {
    var root = document.getElementById(rootId);
    if (root) root.remove();
    root = ce('div', { id: rootId });

    var launcher = ce('button', {
      className: 'tw-widget-launcher',
      type: 'button',
      textContent: config.buttonText,
      onclick: function () { state.open = true; render(root); }
    });

    root.appendChild(launcher);

    if (state.open) {
      var overlay = ce('div', {
        className: 'tw-widget-overlay',
        onclick: function (e) { if (e.target === overlay) closeWidget(); }
      });

      var panel = ce('div', { className: 'tw-widget-panel' });
      var header = ce('div', { className: 'tw-widget-header' });
      header.appendChild(ce('h3', { className: 'tw-widget-title', textContent: config.title }));
      header.appendChild(ce('button', {
        className: 'tw-widget-close',
        type: 'button',
        textContent: '×',
        onclick: closeWidget
      }));

      var body = ce('div', { className: 'tw-widget-body' });

      body.appendChild(field('Project length', 'length', '100'));
      body.appendChild(field('Project width', 'width', '50'));
      body.appendChild(field('Height', 'height', '20'));

      var actions = ce('div', { className: 'tw-widget-actions' });
      var calcBtn = ce('button', {
        className: 'tw-widget-button',
        type: 'button',
        textContent: state.loading ? 'Calculating...' : config.buttonText,
        disabled: state.loading,
        onclick: submit
      });
      var resetBtn = ce('button', {
        className: 'tw-widget-button tw-widget-secondary',
        type: 'button',
        textContent: 'Reset',
        onclick: function () {
          ['length', 'width', 'height'].forEach(function (name) {
            var input = qs('input[name="' + name + '"]', root);
            if (input) input.value = '';
          });
          state.result = null;
          state.error = null;
          render(root);
        }
      });

      actions.appendChild(calcBtn);
      actions.appendChild(resetBtn);
      body.appendChild(actions);

      if (state.loading) body.appendChild(ce('div', { className: 'tw-widget-hint', textContent: 'Processing request...' }));
      if (state.error) body.appendChild(ce('div', { className: 'tw-widget-error', textContent: state.error }));
      if (state.result) body.appendChild(ce('div', { className: 'tw-widget-result', textContent: state.result }));

      body.appendChild(ce('div', {
        className: 'tw-widget-hint',
        textContent: 'This widget sends the inputs to your API endpoint and shows the returned estimate.'
      }));

      panel.appendChild(header);
      panel.appendChild(body);
      overlay.appendChild(panel);
      root.appendChild(overlay);
    }

    document.body.appendChild(root);
  }

  function field(label, name, placeholder) {
    var wrap = ce('div', { className: 'tw-widget-field' });
    wrap.appendChild(ce('label', { className: 'tw-widget-label', textContent: label }));
    wrap.appendChild(ce('input', {
      className: 'tw-widget-input',
      name: name,
      type: 'number',
      min: '0',
      step: 'any',
      placeholder: placeholder
    }));
    return wrap;
  }

  function closeWidget() {
    state.open = false;
    render(document.getElementById(rootId));
  }

  function getPayload(root) {
    var length = parseFloat(qs('input[name="length"]', root).value) || 0;
    var width = parseFloat(qs('input[name="width"]', root).value) || 0;
    var height = parseFloat(qs('input[name="height"]', root).value) || 0;
    return { length: length, width: width, height: height };
  }

  function fallbackEstimate(payload) {
    return (payload.length * payload.width * payload.height) / 1000;
  }

  function normalizeResponse(data, payload) {
    if (!data) return fallbackEstimate(payload);
    if (typeof data.estimate === 'number') return data.estimate;
    if (typeof data.total === 'number') return data.total;
    if (typeof data.amount === 'number') return data.amount;
    if (typeof data.price === 'number') return data.price;
    return fallbackEstimate(payload);
  }

  function submit() {
    var root = document.getElementById(rootId);
    if (!root) return;
    var payload = getPayload(root);
    state.loading = true;
    state.error = null;
    state.result = null;
    render(root);

    var url = config.apiBaseUrl ? config.apiBaseUrl.replace(/\/$/, '') + '/api/widget/estimate' : '/api/widget/estimate';
    var request = window.fetch ? fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }) : Promise.reject(new Error('Fetch is not supported'));

    request.then(function (res) {
      if (!res.ok) throw new Error('Request failed');
      return res.json();
    }).then(function (data) {
      var estimate = normalizeResponse(data, payload);
      state.result = 'Estimated cost: ' + money(estimate);
      state.loading = false;
      render(root);
    }).catch(function () {
      var estimate = fallbackEstimate(payload);
      state.result = 'Estimated cost: ' + money(estimate);
      state.error = 'API unavailable, using local fallback.';
      state.loading = false;
      render(root);
    });
  }

  function render(root) {
    if (!root) return;
    injectStyles();
    build();
  }

  function init() {
    injectStyles();
    build();
  }

  window.TeklaWidget = {
    open: function () { state.open = true; render(document.getElementById(rootId)); },
    close: function () { closeWidget(); },
    config: config
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
