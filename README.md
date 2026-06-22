# Soporte360

Fork de [RustDesk](https://github.com/rustdesk/rustdesk) (AGPL-3.0) adaptado para soporte remoto interno.

## Modificaciones respecto al upstream

### Comportamiento de ventana
- **Cierre al systray**: al cerrar la ventana principal, la aplicación se oculta al systray en lugar de cerrarse. Doble clic en el ícono la restaura.  
  Cambio en `src/ui/index.tis`: `self.closing()` establece `view.windowState = View.WINDOW_HIDDEN` en lugar de retornar `true`.

### Identidad visual
- **Nombre**: renombrado de "RustDesk" a "Soporte360" en `Cargo.toml` (`name`, `authors`, `description`).
- **Ícono**: reemplazado en `res/icon.ico`.
- **Colores**: paleta ajustada en `src/ui/common.css` (azul corporativo `#185FA5` en lugar del azul original `#0071ff`).
- **Textos en español**: cadenas de `src/lang/es.rs` actualizadas para referenciar "Soporte360" en lugar de "RustDesk".

## Componentes del sistema

| Componente | Ubicación |
|---|---|
| Cliente de escritorio (este repo) | `github.com/rcabezas78/Soporte360` — público, AGPL |
| Servidor HTTP, agente, instaladores | `github.com/rcabezas78/Soporte360-Privado` — privado |

El servidor es compatible con cualquier cliente RustDesk estándar apuntando al mismo servidor de relay.

## Compilar

Requiere el entorno de build de RustDesk (Rust + MSVC + vcpkg). Ver `Herramientas/setup_build_env.ps1` en el repo privado.

```sh
cargo build --release
```

El binario resultante es `target/release/soporte360.exe`.

## Licencia

AGPL-3.0 — ver [LICENCE](LICENCE).  
Las modificaciones al código de RustDesk se distribuyen bajo la misma licencia que el upstream.

## Upstream

Basado en [RustDesk](https://github.com/rustdesk/rustdesk) — remote desktop solution written in Rust.
