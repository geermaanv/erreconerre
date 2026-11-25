// Me salió la R: recibe el email de la landing, lo guarda en la hoja y manda
// un mail corto desde tu Gmail. La guía completa NO está acá: vive en el sitio
// y el mail solo la enlaza. Para cambiarla, editás la página, no este script.

const SITE = 'https://geermaanv.github.io/porfinlar/';
const BOT = 'https://t.me/porfinlar_bot';
const NOMBRE = 'Germán · Me salió la R';
const MAX_POR_DIA = 80; // tope propio, por debajo del límite de Gmail

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const d = JSON.parse(e.postData.contents);
    if (d._gotcha) return salida(true); // trampa para bots
    const email = String(d.email || '').trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return salida(false);

    const hoja = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
    if (hoja.getLastRow() === 0) hoja.appendRow(['fecha', 'email', 'origen', 'mail enviado']);

    // Un solo mail por dirección: evita que usen tu Gmail para molestar a alguien.
    const emails = hoja.getRange(1, 2, hoja.getLastRow(), 1).getValues().flat();
    if (emails.indexOf(email) !== -1) return salida(true);

    const hoy = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
    const props = PropertiesService.getScriptProperties();
    const enviadosHoy = props.getProperty('dia') === hoy ? Number(props.getProperty('n') || 0) : 0;
    const puedeEnviar = enviadosHoy < MAX_POR_DIA;

    let enviado = 'no (tope diario)';
    if (puedeEnviar) {
      GmailApp.sendEmail(email, 'Cómo empezar con Me salió la R', cuerpo(), {
        name: NOMBRE,
        replyTo: Session.getEffectiveUser().getEmail(),
      });
      props.setProperties({ dia: hoy, n: String(enviadosHoy + 1) });
      enviado = 'sí';
    }
    hoja.appendRow([new Date(), seguro(email), seguro(String(d.origen || '').slice(0, 40)), enviado]);
    return salida(true);
  } catch (err) {
    return salida(false);
  } finally {
    lock.releaseLock();
  }
}

function cuerpo() {
  return [
    'Hola, soy Germán. Gracias por dejar tu email.',
    '',
    'Para empezar con Me salió la R necesitás Telegram, que es gratis:',
    '1. Instalalo desde la tienda de tu teléfono (App Store o Google Play).',
    '2. Creá tu cuenta con tu número. Te llega un código por SMS.',
    '3. Abrí el bot: ' + BOT,
    '4. Tocá Iniciar y respondé la primera pregunta.',
    '',
    'Antes de seguir, dos minutos para configurar tu privacidad en Telegram, así nadie desconocido puede escribirte:',
    SITE + 'guia/#privacidad',
    '',
    'La guía de inicio, para leer con calma:',
    SITE + 'guia/',
    '',
    'Si te trabás en algún paso, respondé este mail y te ayudo.',
    '',
    '— Germán',
    '',
    'Esto es lo que me sirvió a mí y no garantiza que te sirva a vos. No reemplaza a un fonoaudiólogo.',
    'Si querés que borre tu email, respondé "borrar" a este mail.',
  ].join('\n');
}

// Evita que una celda empiece con = + - @ y se tome como fórmula.
function seguro(t) { return /^[=+\-@]/.test(t) ? "'" + t : t; }

function salida(ok) {
  return ContentService.createTextOutput(JSON.stringify({ ok: ok }))
    .setMimeType(ContentService.MimeType.JSON);
}
