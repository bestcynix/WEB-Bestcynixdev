(() => {
  "use strict";

  document.querySelectorAll('a[href="login"], a[href="register"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      if (event.defaultPrevented || link.target === "_blank") return;
      event.preventDefault();
      document.body.classList.add("auth-leaving");
      window.setTimeout(() => { window.location.href = link.href; }, 180);
    });
  });
})();
