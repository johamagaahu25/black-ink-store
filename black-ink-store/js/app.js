
const historialPedidos = {
  clave: "blackInkPedidos",
  pedidos: [],

  cargar() {
    try {
      const datosGuardados = localStorage.getItem(this.clave);
      const pedidosGuardados = JSON.parse(datosGuardados || "[]");

      this.pedidos = Array.isArray(pedidosGuardados)
        ? pedidosGuardados.filter((pedido) =>
            pedido &&
            typeof pedido.numero === "string" &&
            Array.isArray(pedido.productos)
          )
        : [];
    } catch {
      this.pedidos = [];
    }

    this.renderizar();
  },

  guardar() {
    localStorage.setItem(this.clave, JSON.stringify(this.pedidos));
  },

  agregar(pedido) {
    this.pedidos.unshift(pedido);
    this.guardar();
    this.renderizar();
  },

  borrar() {
    this.pedidos = [];
    this.guardar();
    this.renderizar();
  },

  renderizar() {
    const contenedor = document.querySelector("#historial-pedidos");

    if (this.pedidos.length === 0) {
      contenedor.innerHTML = `
        <p class="mensaje-vacio">
          Todavía no tenés pedidos confirmados.
        </p>
      `;
      return;
    }

    contenedor.innerHTML = this.pedidos.map((pedido) => {
      const { numero, fecha, nombre, entrega, total, productos } = pedido;

      const productosHTML = productos.map((producto) => `
        <p>
          ${producto.nombre} × ${producto.cantidad} —
          ${catalogoProductos.formatearPrecio(producto.subtotal)}
        </p>
      `).join("");

      return `
        <article class="tarjeta-pedido">
          <h3>Pedido ${numero}</h3>
          <p>Fecha: ${fecha}</p>
          <p>Cliente: ${nombre}</p>
          <p>Entrega: ${entrega}</p>
          ${productosHTML}
          <p><strong>Total: ${catalogoProductos.formatearPrecio(total)}</strong></p>
          <span class="estado-pedido">Pedido confirmado</span>
        </article>
      `;
    }).join("");
  }
};

const interfazTienda = {
  iniciar() {
    this.configurarEventos();
    this.inicializar();
  },

  async inicializar() {
    try {
      await catalogoProductos.cargar();
      carritoCompras.cargar();
      historialPedidos.cargar();
    } catch {
      carritoCompras.cargar();
      historialPedidos.cargar();

      Swal.fire({
        icon: "error",
        title: "No se pudo cargar la tienda",
        text: "Verificá que estés usando Live Server y que exista data/productos.json."
      });
    }
  },

  configurarEventos() {
    const buscador = document.querySelector("#buscador");
    const filtro = document.querySelector("#filtro-categoria");
    const catalogo = document.querySelector("#catalogo-productos");
    const carrito = document.querySelector("#contenido-carrito");
    const formulario = document.querySelector("#formulario-pedido");

    buscador.addEventListener("input", () => {
      catalogoProductos.filtrar(buscador.value, filtro.value);
    });

    filtro.addEventListener("change", () => {
      catalogoProductos.filtrar(buscador.value, filtro.value);
    });

    catalogo.addEventListener("click", async (evento) => {
      const boton = evento.target.closest(".boton-agregar");

      if (!boton) {
        return;
      }

      const resultado = carritoCompras.agregar(boton.dataset.id);

      if (resultado.ok) {
        await Swal.fire({
          icon: "success",
          title: "¡Agregado!",
          text: resultado.mensaje,
          timer: 1200,
          showConfirmButton: false
        });
      } else {
        await Swal.fire({
          icon: "warning",
          title: "No se pudo agregar",
          text: resultado.mensaje
        });
      }
    });

    carrito.addEventListener("click", async (evento) => {
      const boton = evento.target.closest("[data-accion]");

      if (!boton) {
        return;
      }

      const { accion, id } = boton.dataset;

      if (accion === "aumentar") {
        const resultado = carritoCompras.cambiarCantidad(id, 1);

        if (resultado?.ok === false) {
          await Swal.fire({
            icon: "warning",
            title: "Stock limitado",
            text: resultado.mensaje
          });
        }
      }

      if (accion === "disminuir") {
        carritoCompras.cambiarCantidad(id, -1);
      }

      if (accion === "eliminar") {
        const confirmacion = await Swal.fire({
          icon: "question",
          title: "¿Eliminar producto?",
          text: "Se quitará este artículo del carrito.",
          showCancelButton: true,
          confirmButtonText: "Sí, eliminar",
          cancelButtonText: "Cancelar",
          confirmButtonColor: "#171717"
        });

        if (confirmacion.isConfirmed) {
          carritoCompras.eliminar(id);
        }
      }
    });

    document.querySelector("#vaciar-carrito").addEventListener("click", async () => {
      if (carritoCompras.items.length === 0) {
        await Swal.fire({
          icon: "info",
          title: "El carrito ya está vacío",
          text: "Agregá algún producto para comenzar tu compra."
        });
        return;
      }

      const confirmacion = await Swal.fire({
        icon: "warning",
        title: "¿Vaciar el carrito?",
        text: "Se eliminarán todos los productos seleccionados.",
        showCancelButton: true,
        confirmButtonText: "Vaciar carrito",
        cancelButtonText: "Cancelar",
        confirmButtonColor: "#a12a2a"
      });

      if (confirmacion.isConfirmed) {
        carritoCompras.vaciar();
        await Swal.fire({
          icon: "success",
          title: "Carrito vacío",
          timer: 1200,
          showConfirmButton: false
        });
      }
    });

    formulario.addEventListener("submit", (evento) => {
      evento.preventDefault();
      this.confirmarPedido(formulario);
    });

    document.querySelector("#borrar-historial").addEventListener("click", async () => {
      if (historialPedidos.pedidos.length === 0) {
        await Swal.fire({
          icon: "info",
          title: "No hay pedidos para borrar"
        });
        return;
      }

      const confirmacion = await Swal.fire({
        icon: "warning",
        title: "¿Borrar el historial?",
        text: "Esta acción eliminará los pedidos guardados en este navegador.",
        showCancelButton: true,
        confirmButtonText: "Borrar historial",
        cancelButtonText: "Cancelar",
        confirmButtonColor: "#a12a2a"
      });

      if (confirmacion.isConfirmed) {
        try {
          historialPedidos.borrar();

          await Swal.fire({
            icon: "success",
            title: "Historial borrado"
          });
        } catch {
          await Swal.fire({
            icon: "error",
            title: "No se pudo borrar",
            text: "Revisá el almacenamiento del navegador."
          });
        }
      }
    });
  },

  async confirmarPedido(formulario) {
    if (!formulario.reportValidity()) {
      return;
    }

    if (carritoCompras.items.length === 0) {
      await Swal.fire({
        icon: "warning",
        title: "Carrito vacío",
        text: "Agregá productos antes de confirmar tu pedido."
      });
      return;
    }

    const datosFormulario = new FormData(formulario);
    const nombre = String(datosFormulario.get("nombre") || "").trim();
    const email = String(datosFormulario.get("email") || "").trim();
    const entrega = String(datosFormulario.get("entrega") || "");
    const productos = carritoCompras.obtenerDetalle();
    const total = carritoCompras.calcularTotal();

    if (!nombre || !email || productos.length === 0 || total <= 0) {
      await Swal.fire({
        icon: "warning",
        title: "Revisá los datos",
        text: "Completá tus datos y verificá el contenido del carrito."
      });
      return;
    }

    const confirmacion = await Swal.fire({
      icon: "question",
      title: "Confirmar tu pedido",
      html: `
        <p>Cliente: ${this.escaparHTML(nombre)}</p>
        <p>Productos: ${productos.length} tipo(s)</p>
        <p><strong>Total: ${catalogoProductos.formatearPrecio(total)}</strong></p>
        <p>Entrega: ${this.escaparHTML(entrega)}</p>
      `,
      showCancelButton: true,
      confirmButtonText: "Confirmar pedido",
      cancelButtonText: "Seguir comprando",
      confirmButtonColor: "#171717"
    });

    if (!confirmacion.isConfirmed) {
      return;
    }

    const botonConfirmar = formulario.querySelector(".boton-confirmar");
    botonConfirmar.disabled = true;

    try {
      const numeroPedido = `BI-${Date.now()}`;

      const pedido = {
        numero: numeroPedido,
        fecha: new Date().toLocaleString("es-AR"),
        nombre,
        email,
        entrega,
        productos,
        total
      };

      historialPedidos.agregar(pedido);
      carritoCompras.vaciar();
      formulario.reset();

      await Swal.fire({
        icon: "success",
        title: "¡Pedido confirmado!",
        text: `Tu número de pedido es ${numeroPedido}. Esta es una simulación y no se realizó ningún pago.`,
        confirmButtonText: "Aceptar",
        confirmButtonColor: "#171717"
      });

      document.querySelector("#pedidos").scrollIntoView({
        behavior: "smooth"
      });
    } catch {
      await Swal.fire({
        icon: "error",
        title: "No se pudo guardar el pedido",
        text: "Puede que el almacenamiento del navegador no esté disponible."
      });
    } finally {
      botonConfirmar.disabled = carritoCompras.items.length === 0;
    }
  },

  escaparHTML(texto) {
    return String(texto).replace(/[&<>"']/g, (caracter) => {
      const entidades = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      };

      return entidades[caracter];
    });
  }
};

document.addEventListener("DOMContentLoaded", () => {
  interfazTienda.iniciar();
});
