// /assets/theme.js
(function () {
    // авто-кнопка, если её нет
    function ensureToggleButton() {
      var btn = document.getElementById("themeToggle");
      if (btn) return btn;
      var nav = document.querySelector('nav[aria-label="Primary"]');
      if (!nav) return null;
      var sep = document.createElement("span");
      sep.className = "sep";
      sep.textContent = "·";
      btn = document.createElement("button");
      btn.id = "themeToggle";
      btn.className = "theme-btn";
      btn.type = "button";
      btn.title = "Toggle theme";
      btn.setAttribute("aria-label", "Toggle theme");
      nav.appendChild(sep);
      nav.appendChild(btn);
      return btn;
    }
  
    function isIOS() {
      return /iPad|iPhone|iPod/.test(navigator.userAgent)
        || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    }
  
    function setIcon(btn) {
      var isDark = document.documentElement.dataset.theme !== "light";
      btn.textContent = isDark ? "☾" : "☀";
    }
  
    // обычное переключение темы
    function applyTheme(next) {
      var root = document.documentElement;
      root.dataset.theme = next;
      root.style.colorScheme = next;
      try { localStorage.setItem("theme", next); } catch (e) {}
    }
  
    // ---------- iOS fallback: overlay + clip-path (pop -> hold -> expand) ----------
    function switchThemeWithOverlay() {
      var root = document.documentElement;
      var next = root.dataset.theme === "light" ? "dark" : "light";
  
      // читаем токены из CSS
      var cs = getComputedStyle(root);
      var pos = cs.getPropertyValue("--reveal-pos").trim() || "50% 50%";
      var startSize = cs.getPropertyValue("--start-size").trim() || "8vmax";
      var popSize   = cs.getPropertyValue("--pop-size").trim()   || "28vmax";
      var finalSize = cs.getPropertyValue("--final-size").trim() || "150vmax";
      var popDur    = cs.getPropertyValue("--pop-dur").trim()    || "160ms";
      var holdDur   = cs.getPropertyValue("--hold-dur").trim()   || "3000ms";
      var expandDur = cs.getPropertyValue("--expand-dur").trim() || "240ms";
      var ease      = cs.getPropertyValue("--reveal-ease").trim()|| "cubic-bezier(.2,.7,0,1)";
  
      // текущий фон (старой темы)
      var oldBg = cs.getPropertyValue("--bg").trim() || "#000";
  
      // Overlay: закрывает экран старым фоном, с дыркой-окном по clip-path
      var overlay = document.createElement("div");
      overlay.style.position = "fixed";
      overlay.style.inset = "0";
      overlay.style.zIndex = "2147483646"; // поверх всего
      overlay.style.pointerEvents = "none";
      overlay.style.background = oldBg;
      overlay.style.clipPath = `circle(${startSize} at ${pos})`;
      overlay.style.webkitClipPath = overlay.style.clipPath;
      document.body.appendChild(overlay);
  
      // Гифка поверх оверлея
      var img = document.createElement("img");
      img.src = "/images/waifu-dance.gif";
      img.alt = "";
      img.decoding = "async";
      img.style.position = "fixed";
      img.style.zIndex = "2147483647";
      img.style.pointerEvents = "none";
      img.style.left = "50%";
      img.style.top = "50%";
      img.style.transform = "translate(-50%, -50%)";
      // хочешь — зафиксируй размер (например, 220px):
      // img.style.width = "220px";
      document.body.appendChild(img);
  
      // включаем класс для плавных локальных перекрасок таблиц и т.п.
      root.classList.add("theme-animating");
  
      // 1) быстрый POP до среднего окна
      overlay.style.transition = `clip-path ${popDur} ${ease}`;
      overlay.style.webkitTransition = overlay.style.transition;
      requestAnimationFrame(function(){
        overlay.style.clipPath = `circle(${popSize} at ${pos})`;
        overlay.style.webkitClipPath = overlay.style.clipPath;
      });
  
      // 2) на старте HOLD включаем НОВУЮ тему под оверлеем
      // (пользователь ещё видит старую, кроме «окна» с гифкой)
      setTimeout(function(){
        applyTheme(next);
      }, parseTime(popDur));
  
      // 3) EXPAND — быстро раскрываем окно на весь экран, затем убираем оверлей и гифку
      setTimeout(function(){
        overlay.style.transition = `clip-path ${expandDur} ${ease}`;
        overlay.style.webkitTransition = overlay.style.transition;
        overlay.style.clipPath = `circle(${finalSize} at ${pos})`;
        overlay.style.webkitClipPath = overlay.style.clipPath;
  
        var cleanupDelay = Math.max(parseTime(expandDur), 260);
        setTimeout(function(){
          root.classList.remove("theme-animating");
          img.remove(); overlay.remove();
        }, cleanupDelay);
      }, parseTime(popDur) + parseTime(holdDur));
    }
  
    // утилита: "160ms" -> 160
    function parseTime(s){ return Number(String(s).replace(/[^0-9.]/g,"")) || 0; }
  
    function onReady() {
      var btn = ensureToggleButton();
      if (!btn) return;
      setIcon(btn);
  
      btn.addEventListener("click", function () {
        var next = document.documentElement.dataset.theme === "light" ? "dark" : "light";
  
        if (isIOS()) {
          // iOS fallback
          switchThemeWithOverlay();
          setIcon(btn);
          return;
        }
  
        // Нормальный путь с View Transitions
        if (!document.startViewTransition) {
          applyTheme(next);
          setIcon(btn);
          return;
        }
  
        document.startViewTransition(function () {
          applyTheme(next);
          setIcon(btn);
        });
      });
    }
  
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", onReady);
    } else {
      onReady();
    }
  })();
  