(() => {
  if (window.lucide) window.lucide.createIcons();

  const menuButton = document.querySelector(".menu-toggle");
  const menu = document.querySelector(".main-nav");
  const mobile = window.matchMedia("(max-width: 900px)");
  function closeMenu(returnFocus = false) {
    menuButton.setAttribute("aria-expanded", "false");
    menuButton.setAttribute("aria-label", "Open navigation");
    menu.hidden = mobile.matches;
    if (returnFocus) menuButton.focus();
  }
  function syncMenu() {
    menuButton.hidden = !mobile.matches;
    closeMenu();
  }
  menuButton.addEventListener("click", () => {
    const open = menuButton.getAttribute("aria-expanded") !== "true";
    menuButton.setAttribute("aria-expanded", String(open));
    menuButton.setAttribute(
      "aria-label",
      open ? "Close navigation" : "Open navigation",
    );
    menu.hidden = !open;
  });
  menu.addEventListener("click", (event) => {
    if (event.target.closest("a") && mobile.matches) closeMenu();
  });
  document.addEventListener("keydown", (event) => {
    if (
      event.key === "Escape" &&
      menuButton.getAttribute("aria-expanded") === "true"
    )
      closeMenu(true);
  });
  document.addEventListener("click", (event) => {
    if (mobile.matches && !event.target.closest(".masthead")) closeMenu();
  });
  mobile.addEventListener("change", syncMenu);
  syncMenu();

  const sections = [...document.querySelectorAll("main > section[id]")];
  const navLinks = [...menu.querySelectorAll("a")];
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          navLinks.forEach((link) => {
            if (link.hash === `#${entry.target.id}`)
              link.setAttribute("aria-current", "location");
            else link.removeAttribute("aria-current");
          });
        }
      },
      { rootMargin: "-15% 0px -55% 0px" },
    );
    sections.forEach((section) => observer.observe(section));
  }

  const dialog = document.querySelector(".photo-dialog");
  const dialogImage = dialog.querySelector("img");
  const caption = dialog.querySelector("figcaption");
  let photoOpener;
  document.querySelectorAll("[data-photo]").forEach((button) => {
    button.title = button.getAttribute("aria-label");
    button.addEventListener("click", () => {
      photoOpener = button;
      dialogImage.src = button.dataset.photo;
      dialogImage.alt = button.dataset.alt || button.querySelector("img").alt;
      caption.textContent = button.dataset.caption;
      dialog.showModal();
      document.body.classList.add("photo-open");
    });
  });
  dialog
    .querySelector(".dialog-close")
    .addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (event) => {
    const bounds = dialog.getBoundingClientRect();
    if (
      event.target === dialog &&
      (event.clientX < bounds.left ||
        event.clientX > bounds.right ||
        event.clientY < bounds.top ||
        event.clientY > bounds.bottom)
    )
      dialog.close();
  });
  dialog.addEventListener("close", () => {
    document.body.classList.remove("photo-open");
    photoOpener?.focus({ preventScroll: true });
  });
})();
