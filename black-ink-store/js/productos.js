
const catalogoProductos = {
  productos: [],

  async cargar() {
    const estadoCarga = document.querySelector("#estado-carga");
    const contenedor = document.querySelector("#catalogo-productos");

    estadoCarga.textContent = "Cargando productos...";

    try {
      const respuesta = await fetch("./data/productos.json");

      if (!respuesta.ok) {
        throw new Error("No se pudo acceder al catálogo.");
      }

      const productos = await respuesta.json();

      if (!Array.isArray(productos)) {
        throw new Error("El formato del catálogo no es válido.");
      }

      this.productos = productos;
      this.renderizar(productos);
      estadoCarga.textContent = `${productos.length} productos disponibles`;
    } catch (error) {
      estadoCarga.textContent = "No se pudo cargar el catálogo.";
      contenedor.innerHTML = `
        <p class="mensaje-vacio">
          Ocurrió un error al cargar los productos.
          Revisá el servidor local y el archivo JSON.
        </p>
      `;
      throw error;
    } finally {
      document.body.dataset.catalogoProcesado = "true";
    }
  },

  renderizar(productos) {
    const contenedor = document.querySelector("#catalogo-productos");

    if (productos.length === 0) {
      contenedor.innerHTML = `
        <p class="mensaje-vacio">
          No encontramos productos con esos criterios.
        </p>
      `;
      return;
    }

    contenedor.innerHTML = productos.map((producto) => {
      const { id, nombre, categoria, descripcion, precio, imagen, stock } = producto;

      return `
        <article class="tarjeta-producto">
          <img
            class="imagen-producto"
            src="${imagen}"
            alt="${nombre}"
            loading="lazy"
          >

          <div class="producto-info">
            <span class="categoria-producto">${categoria}</span>
            <h3>${nombre}</h3>
            <p class="descripcion-producto">${descripcion}</p>
            <p class="descripcion-producto">Stock disponible: ${stock}</p>
            <p class="precio-producto">${this.formatearPrecio(precio)}</p>

            <button
              class="boton boton-principal boton-agregar"
              type="button"
              data-id="${id}"
              ${stock <= 0 ? "disabled" : ""}
            >
              ${stock <= 0 ? "Sin stock" : "Agregar al carrito"}
            </button>
          </div>
        </article>
      `;
    }).join("");
  },

  filtrar(busqueda, categoria) {
    const textoBusqueda = busqueda.trim().toLowerCase();

    const productosFiltrados = this.productos.filter((producto) => {
      const coincideNombre = producto.nombre.toLowerCase().includes(textoBusqueda);
      const coincideCategoria = categoria === "todos" ||
        producto.categoria === categoria;

      return coincideNombre && coincideCategoria;
    });

    this.renderizar(productosFiltrados);
  },

  obtenerPorId(id) {
    return this.productos.find((producto) => producto.id === Number(id));
  },

  formatearPrecio(precio) {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 0
    }).format(precio);
  }
};
