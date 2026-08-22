(function() {
  try {
    const getVal = function(k, d) {
      const v = localStorage.getItem(k);
      if (v === null) return d;
      try { return JSON.parse(v); } catch(e) { return v; }
    };
    const t = getVal("elec_theme_mode", "dark");
    document.documentElement.setAttribute("data-theme", t);
  } catch(e) {}
})();

