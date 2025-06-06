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
  // 2) Modal logic
  // ────────────────
  let pendingAction = "download";     // "download" o "learn" o "share"
  let pendingValue = "Finanzas.pdf";      // nombreDeArchivo.pdf o URL o "share"

  // Obtener referencias al modal, formulario y botón cancelar
  const modalBackdrop = document.getElementById("modalBackdrop");
  const downloadForm = document.getElementById("downloadForm");
  const cancelBtn = document.getElementById("cancelBtn");

  // 2.1) Detectar clic en botones con data-filename o data-learn
  document.querySelectorAll("[data-filename], [data-learn]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();

      // Si tiene data-filename => es descarga
      if (btn.hasAttribute("data-filename")) {
        pendingAction = "download";
        pendingValue = btn.getAttribute("data-filename");
      }
      // Si tiene data-learn => puede ser "learn" o "share"
      else if (btn.hasAttribute("data-learn")) {
        const val = btn.getAttribute("data-learn");
        // Si el valor es exactamente "share", lo tratamos como acción de compartir
        if (val === "share") {
          pendingAction = "share";
          // En este ejemplo fijo, compartimos index2.html en la raíz del sitio
          pendingValue = `${window.location.origin}/index2.html`;
        } 
        // Sino, es “learn” normal (redirección)
        else {
          pendingAction = "learn";
          pendingValue = val; // p. ej. "index2.html"
        }
      }

      // Guardamos estos valores en inputs ocultos
      document.getElementById("actionType").value = pendingAction;
      document.getElementById("actionValue").value = pendingValue;

      // Mostramos el modal
      modalBackdrop.classList.remove("hidden");
    });
  });

  // 2.2) Botón “Cancelar” del modal
  if (cancelBtn) {
    cancelBtn.addEventListener("click", () => {
      pendingAction = "";
      pendingValue = "";
      downloadForm.reset();
      modalBackdrop.classList.add("hidden");
    });
  }

  // 2.3) Al enviar el formulario (nombre + email) → enviar a Web3Forms
  if (downloadForm) {
    downloadForm.addEventListener("submit", (e) => {
      e.preventDefault();

      // Tomamos valores de los campos
      const nameInput = document.getElementById("visitorName");
      const emailInput = document.getElementById("visitorEmail");
      const actionTypeInput = document.getElementById("actionType");
      const actionValueInput = document.getElementById("actionValue");

      const name = nameInput.value.trim();
      const email = emailInput.value.trim();
      const actionType = actionTypeInput.value;
      const actionValue = actionValueInput.value;

      // Validación mínima
      if (!name || !email) {
        alert("Por favor ingresa tu nombre y correo electrónico.");
        return;
      }

      // ---------- Enviar datos a Web3Forms vía fetch ----------
      // Construimos el JSON según Web3Forms API:
      const payload = {
        access_key: downloadForm.querySelector('[name="access_key"]').value,
        name: name,
        email: email,
        // Puedes añadir asunto u otros campos necesarios:
        // subject: "Nuevo envío desde mi sitio",
        actionType: actionType,
        actionValue: actionValue
      };

      fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      })
        .then((response) => response.json())
        .then((json) => {
          if (json.success) {
            // ---------- ÉXITO en Web3Forms ----------
            console.log("¡Datos enviados a Web3Forms correctamente!");

            // ---------- Ahora ejecutamos la acción pendiente ----------
            if (actionType === "download") {
              const link = document.createElement("a");
              link.href = `files/${actionValue}`; // Ajusta ruta real
              link.download = actionValue;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            } 
            else if (actionType === "learn") {
              window.location.href = actionValue; // Ej: "index2.html"
            } 
            else if (actionType === "share") {
              navigator.clipboard.writeText(actionValue).then(() => {
                alert("Enlace copiado al portapapeles:\n" + actionValue);
              });
            }

            // Limpiar y ocultar modal
            pendingAction = "";
            pendingValue = "";
            downloadForm.reset();
            modalBackdrop.classList.add("hidden");
          } else {
            // ---------- ERROR desde Web3Forms ----------
            alert(
              "Algo salió mal al enviar tus datos. Vuelve a intentarlo."
            );
            console.error("Web3Forms error:", json);
          }
        })
        .catch((err) => {
          alert(
            "No se pudo conectar con Web3Forms. Revisa tu conexión e inténtalo de nuevo."
          );
          console.error("Fetch a Web3Forms falló:", err);
        });
    });
  }

        // 3) Stripe Checkout para la nueva tarjeta
      // ────────────────
      // Reemplaza 'pk_test_XXXXXXXXXXXXXXXXXXXXXXXX' con tu Publishable Key real
      const stripe = Stripe("pk_live_51Qm0kgAYknGrVrww7HfXEc5qu1g6uq0mgV2zS7vcYON4N3klEgFtGIUhptvGdvTKHD9ibjXxbbTKzPqUvsSZ52xm00h31mpB9k");
      const stripeBtn = document.getElementById("stripeCheckoutBtn");

      if (stripeBtn) {
        stripeBtn.addEventListener("click", () => {
          // Llamamos a nuestro backend para crear un Checkout Session
          fetch("/create-checkout-session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              // Puedes enviar aquí información adicional, como el ID del producto, cantidad, etc.
              priceId: "price_XXXXXXXXXXXX" // Reemplaza con tu Price ID (en Test Mode)
            })
          })
            .then((res) => res.json())
            .then((session) => {
              if (session.error) {
                console.error("Error creando sesión:", session.error);
                alert("No se pudo iniciar el pago. Intenta de nuevo.");
              } else {
                // Redirige a Stripe Checkout con la sessionId devuelta
                return stripe.redirectToCheckout({ sessionId: session.sessionId });
              }
            })
            .then((result) => {
              if (result && result.error) {
                // Si algo falla en la redirección, lo mostramos en consola
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
      // Alternar la visibilidad del texto extra
      extraText.classList.toggle("hidden");

      // Cambiar el texto del botón según el estado
      if (extraText.classList.contains("hidden")) {
        toggleBtn.textContent = "Read more";
      } else {
        toggleBtn.textContent = "Read less";
      }
    });
    }); // ← Fin de DOMContentLoaded