// main.js
document.addEventListener("DOMContentLoaded", () => {
  // ────────────────
  // 1) Mobile menu toggle
  // ────────────────
  const mobileMenuBtn = document.getElementById("mobileMenuBtn");
  const mobileNav = document.getElementById("mobileNav");

  if (mobileMenuBtn && mobileNav) {
    mobileMenuBtn.addEventListener("click", () => {
      mobileNav.classList.toggle("hidden");
    });
  } // ← Aquí cerramos el if de mobile menu

  // ────────────────
  // NEW: Single‐email logic
  // ────────────────
  const STORAGE_KEY = "ydUserEmail";                 // ← ADDED
  const savedEmail = localStorage.getItem(STORAGE_KEY); // ← ADDED
  if (savedEmail) {                                   // ← ADDED
    // Prefill download modal
    const visitorEmail = document.getElementById("visitorEmail");
    if (visitorEmail) visitorEmail.value = savedEmail;

    // Hide footer newsletter form
    const newsForm = document.getElementById("newsletterForm");
    const newsMsg  = document.getElementById("newsletterMessage");
    if (newsForm && newsMsg) {
      newsForm.style.display      = "none";
      newsMsg.textContent         = "¡Gracias por suscribirte!";
      newsMsg.classList.remove("text-red-400");
      newsMsg.classList.add("text-green-400");
    }
  }                                                    // ← ADDED

  // ────────────────
  // 2) Modal logic
  // ────────────────
  let pendingAction = "download";     // "download" o "learn" o "share"
  let pendingValue = "Finanzas.pdf";  // nombreDeArchivo.pdf o URL o "share"

  // Obtener referencias al modal, formulario y botón cancelar
  const modalBackdrop = document.getElementById("modalBackdrop");
  const downloadForm   = document.getElementById("downloadForm");
  const cancelBtn      = document.getElementById("cancelBtn");

  // 2.1) Detectar clic en botones con data-filename o data-learn
  document.querySelectorAll("[data-filename], [data-learn]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();

      // Determinar acción y valor
      if (btn.hasAttribute("data-filename")) {
        pendingAction = "download";
        pendingValue  = btn.getAttribute("data-filename");
      } else {
        const val = btn.getAttribute("data-learn");
        if (val === "share") {
          pendingAction = "share";
          pendingValue  = `${window.location.origin}/index2.html`;
        } else {
          pendingAction = "learn";
          pendingValue  = val;
        }
      }

      // Guardar en inputs ocultos
      document.getElementById("actionType").value  = pendingAction;
      document.getElementById("actionValue").value = pendingValue;

      // ← NUEVO: si ya guardaste un email, ejecutar acción directo y NO mostrar modal
      if (localStorage.getItem("ydUserEmail")) {
        if (pendingAction === "download") {
          const link = document.createElement("a");
          link.href     = `files/${pendingValue}`;
          link.download = pendingValue;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
        else if (pendingAction === "learn") {
          window.location.href = pendingValue;
        }
        else if (pendingAction === "share") {
          navigator.clipboard.writeText(pendingValue).then(() => {
            alert("Enlace copiado al portapapeles:\n" + pendingValue);
          });
        }
        return; // saltamos modal completamente
      }

      // Mostrar modal si no hay email guardado
      modalBackdrop.classList.remove("hidden");
    });
  });



  // 2.2) Botón “Cancelar” del modal
  if (cancelBtn) {
    cancelBtn.addEventListener("click", () => {
      pendingAction = "";
      pendingValue  = "";
      downloadForm.reset();
      modalBackdrop.classList.add("hidden");
    });
  }

  // 2.3) Al enviar el formulario (nombre + email) → enviar a Web3Forms
  if (downloadForm) {
    downloadForm.addEventListener("submit", (e) => {
      e.preventDefault();

      // Tomamos valores de los campos
      const nameInput        = document.getElementById("visitorName");
      const emailInput       = document.getElementById("visitorEmail");
      const actionTypeInput  = document.getElementById("actionType");
      const actionValueInput = document.getElementById("actionValue");

      const name       = nameInput.value.trim();
      const email      = emailInput.value.trim();
      const actionType = actionTypeInput.value;
      const actionValue= actionValueInput.value;

      if (!name || !email) {
        alert("Por favor ingresa tu nombre y correo electrónico.");
        return;
      }

      // ← ADDED: store the email so we only ever ask once
      localStorage.setItem(STORAGE_KEY, email);

      // ---------- Enviar datos a Web3Forms vía fetch ----------
      const payload = {
        access_key: downloadForm.querySelector('[name="access_key"]').value,
        name,
        email,
        actionType,
        actionValue
      };

      fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
        .then((response) => response.json())
        .then((json) => {
          if (json.success) {
            console.log("¡Datos enviados a Web3Forms correctamente!");

            if (actionType === "download") {
              const link = document.createElement("a");
              link.href     = `files/${actionValue}`;
              link.download = actionValue;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            } else if (actionType === "learn") {
              window.location.href = actionValue;
            } else if (actionType === "share") {
              navigator.clipboard.writeText(actionValue).then(() => {
                alert("Enlace copiado al portapapeles:\n" + actionValue);
              });
            }

            pendingAction = "";
            pendingValue  = "";
            downloadForm.reset();
            modalBackdrop.classList.add("hidden");
          } else {
            alert("Algo salió mal al enviar tus datos. Vuelve a intentarlo.");
            console.error("Web3Forms error:", json);
          }
        })
        .catch((err) => {
          alert("No se pudo conectar con Web3Forms. Revisa tu conexión e inténtalo de nuevo.");
          console.error("Fetch a Web3Forms falló:", err);
        });
    });
  }

  // ────────────────
  // 3) Stripe Checkout para la nueva tarjeta
  // ────────────────
  const stripe = Stripe("pk_live_51Qm0kgAYknGrVrww7HfXEc5qu1g6uq0mgV2zS7vcYON4N3klEgFtGIUhptvGdvTKHD9ibjXxbbTKzPqUvsSZ52xm00h31mpB9k");
  const stripeBtn = document.getElementById("stripeCheckoutBtn");

  if (stripeBtn) {
    stripeBtn.addEventListener("click", () => {
      fetch("/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId: "price_XXXXXXXXXXXX" })
      })
        .then((res) => res.json())
        .then((session) => {
          if (session.error) {
            console.error("Error creando sesión:", session.error);
            alert("No se pudo iniciar el pago. Intenta de nuevo.");
          } else {
            return stripe.redirectToCheckout({ sessionId: session.sessionId });
          }
        })
        .then((result) => {
          if (result && result.error) {
            console.error(result.error.message);
          }
        })
        .catch((err) => {
          console.error("Fetch a /create-checkout-session falló:", err);
          alert("Error al comunicarse con el servidor de pagos.");
        });
    });
  }

  const toggleBtn = document.getElementById("toggleBtn");
  const extraText = document.getElementById("extraText");

  toggleBtn.addEventListener("click", () => {
    extraText.classList.toggle("hidden");
    toggleBtn.textContent = extraText.classList.contains("hidden") ? "Read more" : "Read less";
  });
}); // ← Fin de DOMContentLoaded
