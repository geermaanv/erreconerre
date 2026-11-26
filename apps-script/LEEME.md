# Mails desde tu Gmail con Google Apps Script

Qué hace: cuando alguien deja su email en la landing, el script lo guarda en una hoja de Google y le manda desde tu Gmail un mail corto con los pasos y los enlaces a la guía del sitio. La guía no se copia acá: el mail solo la enlaza.

## Armarlo (unos 10 minutos)

1. En Google Drive creá una hoja de cálculo nueva. Nombre sugerido: "Me salió la R · contactos".
2. En la hoja: **Extensiones → Apps Script**. Borrá lo que haya y pegá el contenido de `Code.gs`.
3. Guardá. En el selector de funciones elegí `probar` y tocá **Ejecutar**. Google te pide permisos (Gmail y hojas): aceptalos. Como el script es tuyo y no está verificado, aparece un aviso: *Configuración avanzada → Ir a (nombre del proyecto)*. Te tiene que llegar un mail de prueba.
4. **Implementar → Nueva implementación → Aplicación web.**
   - Ejecutar como: **yo**.
   - Quién tiene acceso: **cualquier persona**.
5. Copiá la URL que termina en `/exec`. Esa URL no es secreta (va en la página), pero tampoco la publiques de más.
6. Pasale esa URL a Claude para ponerla en `MAIL_ENDPOINT` de `site/index.html`.

## Cosas que conviene saber

- **Los mails salen de tu Gmail personal** y llevan tu dirección como remitente y para responder.
- **Un solo mail por dirección**, y un tope de 80 por día. Si se pasa, el contacto se guarda igual y la hoja marca "no (tope diario)".
- **Cada vez que cambies el script** hay que hacer *Implementar → Administrar implementaciones → editar → Nueva versión*. Si no, sigue corriendo la versión anterior.
- **Para borrar a alguien:** borrá la fila de la hoja.
- Si el mail cae en spam al principio, es esperable con un remitente nuevo. Probá con tu otra cuenta antes de publicar.
