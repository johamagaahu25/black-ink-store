
const carritoCompras = {
  clave: "blackInkCarrito",
  items: [],

  cargar() {
    try {
      const datosGuardados = localStorage.getItem(this.clave);
      const itemsGuardados = JSON.parse(datosGuardados || "[]");

      this.items = Array.isArray(itemsGuardados)
        ? itemsGuardados.filter((item) =>
            Number.isInteger(item.id) &&
            Number.isInteger(item.cantidad) &&
            item.cantidad > 0 &&
            catalogoProductos.obtenerPorId(item.id)
          ).map(({ id, cantidad }) => ({ id, cantidad }))
        : [];
    } catch {
      this.items = [];
    }

    this.sincronizar();
  },

  guardar() {
    localStorage.setItem(this.clave, JSON.stringify(this.items));
  },

  agregar(id) {
    const producto = catalogoProductos.obtenerPorId(id);

    if (!producto) {
      return { ok: false, mensaje: "El producto no existe." };
    }

    const itemExistente = this.items.find((item) => item.id === producto.id);
    const cantidadActual = itemExistente?.cantidad || 0;

    if (cantidadActual >= producto.stock) {
      return {
        ok: false,
        mensaje: "No hay más unidades disponibles de este producto."
      };
    }

    if (itemExistente) {
      itemExistente.cantidad += 1;
    } else {
      this.items.push({ id: producto.id, cantidad: 1 });
    }

    this.sincronizar();

    return { ok: true, mensaje: "Producto agregado al carrito." };
  },

  cambiarCantidad(id, cambio) {
    const item = this.items.find((producto) => producto.id === Number(id));
    const producto = catalogoProductos.obtenerPorId(id);

    if (!item || !producto) {
      return;
    }

    const nuevaCantidad = item.cantidad + cambio;

    if (nuevaCantidad <= 0) {
      this.eliminar(id);
      return;
    }

    if (nuevaCantidad > producto.stock) {
      return {
        ok: false,
        mensaje: "Alcanzaste el stock máximo disponible."
      };
    }

    item.cantidad = nuevaCantidad;
    this.sincronizar();

    return { ok: true, mensaje: "Cantidad actualizada." };
  },

  eliminar(id) {
    this.items = this.items.filter((item) => item.id !== Number(id));
    this.sincronizar();
  },

  vaciar() {
    this.items = [];
    this.sincronizar();
  },

  obtenerDetalle() {
    return this.items.map(({ id, cantidad }) => {
      const producto = catalogoProductos.obtenerPorId(id);

      return {
        id,
        nombre: producto.nombre,
        precio: producto.precio,
        cantidad,
        subtotal: producto.precio * cantidad
      };
    });
  },

  calcularTotal() {
    return this.obtenerDetalle().reduce(
      (total, item) => total + item.subtotal,
      0
    );
  },

  sincronizar() {
    this.guardar();
    this.renderizar();
    this.actualizarContador();
  },

  actualizarContador() {
    const cantidadTotal = this.items.reduce(
      (total, item) => total + item.cantidad,
      0
    );

    document.querySelector("#contador-carrito").textContent = cantidadTotal;
  },

  renderizar() {
    const contenedor = document.querySelector("#contenido-carrito");
    const total = document.querySelector("#total-carrito");
    const botonConfirmar = document.querySelector(".boton-confirmar");
    const detalle = this.obtenerDetalle();

    if (detalle.length === 0) {
      contenedor.innerHTML = `
        <p class="mensaje-vacio">Tu carrito está vacío.</p>
      `;
    } else {
      contenedor.innerHTML = detalle.map((item) => `
        <article class="fila-carrito">
          <div>
            <h3>${item.nombre}</h3>
            <p>${catalogoProductos.formatearPrecio(item.precio)} por unidad</p>
          </div>

          <div class="cantidad-controles">
            <button
              class="boton-cantidad"
              type="button"
              data-accion="disminuir"
              data-id="${item.id}"
              aria-label="Disminuir cantidad de ${item.nombre}"
            >−</button>

            <span>${item.cantidad}</span>

            <button
              class="boton-cantidad"
              type="button"
              data-accion="aumentar"
              data-id="${item.id}"
              aria-label="Aumentar cantidad de ${item.nombre}"
            >+</button>
          </div>

          <strong>${catalogoProductos.formatearPrecio(item.subtotal)}</strong>

          <button
            class="boton-eliminar"
            type="button"
            data-accion="eliminar"
            data-id="${item.id}"
          >Eliminar</button>
        </article>
      `).join("");
    }

    total.textContent = catalogoProductos.formatearPrecio(this.calcularTotal());
    botonConfirmar.disabled = detalle.length === 0;
  }
};

