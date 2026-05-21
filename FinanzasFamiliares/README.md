# FinanzasHogar — Manual de Usuario

Sistema hogareño para gestionar gastos familiares y compras del supermercado.
Funciona 100% en el navegador, sin servidor ni internet — los datos se guardan en el dispositivo.

---

## Tabla de contenidos

1. [Cómo iniciar](#cómo-iniciar)
2. [Dashboard](#dashboard)
3. [Gastos — ABM](#gastos--abm)
4. [Comprobantes de pago](#comprobantes-de-pago)
5. [Compras Súper](#compras-súper)
6. [Catálogo de productos](#catálogo-de-productos)
7. [Uso desde el celular](#uso-desde-el-celular)
8. [Preguntas frecuentes](#preguntas-frecuentes)

---

## Cómo iniciar

### Requisitos
- Node.js 18 o superior
- npm

### Primera vez
```bash
npm install
npm run dev
```

Abrí el navegador en **http://localhost:5173**

### Siguiente vez
```bash
npm run dev
```

---

## Dashboard

La pantalla principal muestra un resumen completo de tus finanzas.

### Tarjetas de resumen

| Tarjeta | Qué muestra |
|---|---|
| **Total mes actual** | Suma de gastos del mes en curso. Incluye variación % respecto al mes anterior. |
| **Total acumulado** | Suma de todos los gastos registrados en todos los períodos. |
| **Categorías activas** | Cuántas de las 7 categorías tienen al menos un gasto registrado. |

### Desglose por categoría

Muestra cada categoría con:
- Total gastado en el período completo
- Barra de proporción respecto al total general
- Porcentaje del total

Hacé clic en cualquier categoría para ir a la lista de gastos.

### Últimos gastos

Los 5 gastos más recientes. Hacé clic en **"Ver todos →"** para ir a la lista completa.

---

## Gastos — ABM

### Agregar un gasto

1. Hacé clic en **"+ Nuevo gasto"** (arriba a la derecha, disponible desde cualquier vista excepto Súper)
2. Completá el formulario:
   - **Descripción** — nombre del gasto (requerido)
   - **Monto ($)** — importe en pesos (requerido)
   - **Categoría** — elegí una de las 7 disponibles tocando el botón
   - **Fecha** — por defecto es hoy, podés cambiarla
   - **Comprobante** — adjuntá imagen o PDF del ticket (opcional, ver sección siguiente)
   - **Notas** — información extra (opcional)
3. Hacé clic en **"Agregar gasto"**

### Categorías disponibles

| Ícono | Categoría | Ejemplos |
|---|---|---|
| 🏛️ | **Impuestos** | ABL, ARBA, patente, sellos |
| ⚽ | **Club** | Cuota mensual, actividades |
| 📚 | **Escuela** | Cuota, útiles, eventos escolares |
| 🛒 | **Compras** | Supermercado, almacén |
| 💡 | **Servicios** | Luz, gas, internet, teléfono |
| 🏥 | **Salud** | Obra social, médico, farmacia |
| 📦 | **Otros** | Todo lo que no encaje en las anteriores |

### Editar un gasto

1. Andá a la pestaña **"Gastos"**
2. En desktop: pasá el mouse por encima del gasto para que aparezcan los botones
3. Hacé clic en el ícono del **lápiz ✏️**
4. Modificá los campos que necesites
5. Hacé clic en **"Guardar cambios"**

### Eliminar un gasto

El borrado requiere **doble confirmación** para evitar accidentes:

1. Hacé clic en el ícono del **tacho 🗑️**
2. El botón se pone **rojo** — hacé clic **una segunda vez** para confirmar la eliminación
3. Si no confirmás en 3 segundos, se cancela solo

### Buscar y filtrar gastos

En la vista **"Gastos"** tenés cuatro controles:

| Control | Función |
|---|---|
| **Buscador** | Filtra por texto en descripción y notas |
| **Categoría** | Muestra solo los gastos de esa categoría |
| **Mes** | Filtra por mes y año |
| **Orden** | Más recientes / más antiguos / mayor monto / menor monto |

El total y la cantidad de gastos filtrados se actualizan en tiempo real arriba de la lista.

---

## Comprobantes de pago

Podés adjuntar el ticket, factura o recibo a cualquier gasto.

### Adjuntar un comprobante

Al crear o editar un gasto, en el campo **"Comprobante de pago (opcional)"**:

1. Hacé clic en la zona punteada **"Adjuntar comprobante"**
2. Elegí el archivo desde tu dispositivo o cámara
3. **Formatos admitidos:** JPG, PNG, WEBP, GIF, PDF
4. **Tamaño máximo:** 2 MB

Si adjuntás una imagen, se muestra una **vista previa** dentro del formulario.
Si adjuntás un PDF, muestra el ícono con el nombre y tamaño del archivo.

Para **quitar** el comprobante antes de guardar, hacé clic en la **X** que aparece en la esquina de la preview.

### Ver un comprobante guardado

En la lista de gastos, los que tienen comprobante muestran un chip **"Imagen"** o **"PDF"** en azul junto a la categoría.

- En desktop aparece también una **miniatura** de la imagen a la izquierda del gasto
- Hacé clic en el chip o la miniatura para abrir el visor en pantalla completa

### Visor de comprobante

- Las imágenes se muestran centradas
- Los PDF se muestran en un visor integrado en la pantalla
- Botón **"Descargar"** para guardar el archivo en el dispositivo
- Cerrás con la **X** o presionando **Escape**

> **Importante:** los comprobantes se almacenan en el navegador. Si limpiás los datos del navegador o usás otro dispositivo, los comprobantes no estarán disponibles.

---

## Compras Súper

Módulo para planificar y registrar cada visita al supermercado. Cada compra tiene su propia lista — no siempre comprás lo mismo.

### Crear una nueva compra

1. Hacé clic en la pestaña **"🛒 Súper"**
2. Hacé clic en **"Nueva compra"**
3. Completá:
   - **Descripción** — opcional (por defecto usa la fecha, ej: "Super 20/05")
   - **Fecha** — el día que vas al super
4. Hacé clic en **"Crear y abrir lista"** — se abre la lista vacía directamente

### Agregar productos a la lista

Dentro de una compra abierta, hacé clic en **"+ Agregar"** (arriba a la derecha):

Se abre el **Catálogo** con los 158 productos pre-cargados. Desde ahí:

- **Buscá** escribiendo parte del nombre del producto
- **Seleccioná** los que vas a llevar ese día (tildá el checkbox de cada uno)
- El **precio de referencia** de compras anteriores aparece en gris a la derecha
- Para agregar un **producto que no está en la lista**, escribí el nombre en el campo de arriba y presioná Enter o el botón **+** — queda disponible para todas las compras futuras

Una vez elegidos todos, hacé clic en **"Agregar (N)"** — donde N es la cantidad seleccionada.

> Cada compra es independiente: seleccionás solo lo que necesitás ese día.

### Usar la lista en el super

La lista tiene dos secciones:

**Por comprar** — items pendientes (fondo blanco)
**En el carrito** — items ya agarrados (fondo verde, nombre tachado)

Para cada producto:

| Qué hacer | Cómo |
|---|---|
| **Marcar como tomado** | Tocá el círculo ○ a la izquierda del nombre → se pone verde ✓ |
| **Desmarcar** | Tocá el círculo verde ✓ para devolverlo a "por comprar" |
| **Cambiar cantidad** | Tocá el número de cantidad (botón gris) → escribí el nuevo valor → Enter o toque fuera |
| **Ingresar precio real** | Tocá **"Precio?"** (naranja) o el precio actual → escribí el valor → Enter |
| **Quitar de la lista** | Tocá el 🗑️ → confirmá con un segundo toque |

Los precios que ingresás **actualizan automáticamente** el precio de referencia en el catálogo para la próxima compra.

### Totales en tiempo real

En la parte inferior de la pantalla (siempre visible):

| | Qué es |
|---|---|
| **En carrito** | Suma de solo los productos ya tildados |
| **Total estimado** | Suma de todos los productos de la lista |

### Tarjetas resumen en la lista de compras

Cada compra muestra:
- Fecha y descripción
- Total estimado y total en carrito
- Barra de progreso: cuántos productos ya tomaste del total
- Cuando llegás al 100% aparece **"✓ Completada"** en verde

### Eliminar una compra

En la tarjeta de la compra, hacé clic en **"Eliminar"**:
1. El botón se pone rojo
2. Confirmá haciendo clic una segunda vez

---

## Catálogo de productos

El catálogo contiene **158 productos habituales** pre-cargados con precios de referencia:

Aceite girasol · Aceite oliva · Agua micelar · Algodón · Arroz blanco · Atún · Avena · Azúcar · Bicarbonato · Brownies · Café tostado · Campari · Cepillo barrer · Champú · Chimichurri · Cif baño · Coco rayado · Detergente · Dulce de durazno · Dulce de leche · Dulce de membrillo · Esponja · Fideos · Galletas (Firmus, Macucas, Opera, Oreos, Polvoritas, Rumbas, Sonrisas, Desfiles) · Garbanzos · Guantes · Harina · Jabón líquido · Jabón tocador · Ketchup · Lavandina · Leche · Lentejas · Maíz · Maní · Manteca · Mayonesa · Mostaza · Ñoquis · Pan (hamburguesas, pancho, rallado) · Papel higiénico · Pasta de maní · Pastilla mosquitos · Polenta · Queso (port salud, barra, rayado) · Ravioles · Rollo cocina · Sal · Salchichas · Salsa tomate · Terma · Toallas femeninas · Vinagre · Vino · Yerba · Yogurt · y más.

### Agregar un producto nuevo al catálogo

Desde el picker de productos (al agregar items a una compra), escribí el nombre en el campo **"Agregar producto que no está en la lista..."** y presioná **Enter** o el botón **+**. Queda guardado para todas las compras futuras.

---

## Uso desde el celular

### Acceder desde el celular (misma red WiFi)

Por defecto la app solo es accesible desde la PC donde está corriendo. Para abrirla desde el celular:

1. En la PC, ejecutá:
   ```bash
   npm run dev -- --host
   ```
2. Aparece una dirección como `http://192.168.x.x:5173`
3. Abrí esa URL desde el navegador del celular (misma red WiFi)

### Instalar como app en el celular

**Android (Chrome):**
1. Abrí la URL desde Chrome
2. Menú ⋮ → **"Agregar a pantalla de inicio"**

**iPhone (Safari):**
1. Abrí la URL desde Safari
2. Botón compartir → **"Agregar a pantalla de inicio"**

Queda con ícono propio igual que cualquier app.

### Diseño mobile

- El modal de nuevo gasto se desliza **desde abajo** en pantallas chicas
- Los botones del super tienen **zonas de toque amplias** para no equivocarse
- Cantidad y precio son fáciles de editar con el teclado numérico
- La barra de totales es **fija en el pie** para verla siempre mientras avanzás por la góndola

---

## Preguntas frecuentes

**¿Los datos se pierden si cierro el navegador?**
No. Todo se guarda automáticamente en `localStorage` del navegador.

**¿Puedo usar la app en varios dispositivos?**
Los datos están guardados por separado en cada dispositivo. No se sincronizan entre ellos.

**¿Qué pasa si el navegador borra los datos?**
Se pierden. No uses el modo incógnito y no borres los datos del sitio.

**¿Cuánto puedo guardar?**
El `localStorage` tiene un límite de ~5 MB. Con muchos comprobantes adjuntos (imágenes/PDF) ese límite se alcanza antes. Para uso normal sin muchos comprobantes no hay inconveniente.

**¿Puedo agregar más categorías?**
Las 7 categorías están fijas actualmente. Se puede ampliar en futuras versiones editando `src/utils/categories.js`.

**¿Puedo cambiar la moneda a dólares?**
Sí, editando la función `formatCurrency` en `src/utils/formatters.js` — cambiá `'ARS'` por `'USD'` y ajustá el locale.

---

*FinanzasHogar — uso personal y familiar*
