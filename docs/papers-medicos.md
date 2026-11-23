# Papers clínicos sobre la R múltiple: v0.1

Estado: relevamiento para analizar. Fecha: 2026-11-23. Complementa `metodos-existentes.md` y `libros-metodos.md`.

## Alcance y límites

- **Búsqueda:** PubMed (base médica de la Biblioteca Nacional de Medicina de EE. UU.), con los términos *trill*, *multiple vibrant* y *vibrante múltiple*, combinados con *Spanish* o *alveolar*. Dio 28 resultados. La mayoría son de fonética, percepción o variación dialectal, no de tratamiento.
- **No hay ensayos clínicos de tratamiento de la R múltiple** en adultos ni en niños entre los resultados. Por eso se eligieron los tres trabajos más útiles para el método: uno sobre una causa física, uno sobre entrenamiento y uno sobre cómo diseñar la práctica.
- **Se leyeron solo los resúmenes** (abstracts), obtenidos por la API oficial de PubMed. No se leyó el texto completo.

## 1. Anatomía: cuando la R múltiple no sale por la forma de la boca

**Alfwaress, F., Maaitah, E. A., Al-Khateeb, S. y Zama, Z. A. (2015).** The relationship of vocal tract dimensions and substitution of the palatal approximant /j/ for the alveolar trill /r/. *International Journal of Speech-Language Pathology*, 17(5), 518–526. PMID 25861878. https://doi.org/10.3109/17549507.2015.1024165

- **Pregunta:** si las personas que reemplazan la R múltiple por un sonido parecido a la "y" tienen diferencias anatómicas.
- **Participantes:** 60 hablantes nativos de árabe de 15 a 20 años: 30 con esa sustitución y 30 sin dificultad. Todos con mordida normal (clase I).
- **Método:** radiografías laterales de cráneo (cefalometría) y moldes dentales.
- **Resultados:** el grupo con dificultad tenía, con diferencia significativa:
  - maxilar superior más corto y tracto vocal más estrecho
  - lengua más corta y más baja
  - paladar blando más corto y más fino
  - menor distancia entre el hueso hioides y la mandíbula o la vértebra C3
  - arcos dentales más cortos y más angostos entre caninos
- **Conclusión de los autores:** la sustitución "is associated with altered dimensions of the vocal tract". Esas diferencias podrían explicar por qué la R múltiple persiste cuando otros sonidos sí responden a la terapia. Sugieren que puede hacer falta una consulta de ortodoncia o cirugía maxilofacial.
- **Límites:** es un estudio de asociación, no prueba causa. La muestra es de hablantes de árabe y de un solo tipo de error.

## 2. Entrenamiento: escuchar y producir juntos

**Herd, W., Jongman, A. y Sereno, J. (2013).** Perceptual and production training of intervocalic /d, ɾ, r/ in American English learners of Spanish. *Journal of the Acoustical Society of America*, 133(6), 4247–4255. PMID 23742375. https://doi.org/10.1121/1.4802902

- **Pregunta:** qué tipo de entrenamiento mejora la percepción y la producción de la /d/, la R simple y la R múltiple entre vocales.
- **Participantes:** 42 estadounidenses que estudiaban español.
- **Método:** tres entrenamientos "de alta variabilidad", es decir, con muchas voces y palabras distintas:
  1. solo percepción (escuchar y distinguir)
  2. solo producción (decir)
  3. combinado (escuchar y decir)
- **Resultados:** los tres funcionaron. Quienes entrenaron solo percepción o solo producción mejoraron sobre todo en percepción. **Los que hicieron el entrenamiento combinado mejoraron en producción.** La eficacia dependió del contraste entrenado y de cómo se evaluó.
- **Límites:** son estudiantes de segunda lengua, no personas con dislalia. Según el resumen, el estudio midió el efecto del entrenamiento, no cuánto se mantuvo.

## 3. Cómo diseñar la práctica: principios de aprendizaje motor

**Maas, E., Robin, D. A., Austermann Hula, S. N., Freedman, S. E., Wulf, G., Ballard, K. J. y Schmidt, R. A. (2008).** Principles of motor learning in treatment of motor speech disorders. *American Journal of Speech-Language Pathology*, 17(3), 277–298. PMID 18663111. https://doi.org/10.1044/1058-0360(2008/025)

- **Tipo:** revisión tutorial. No es un experimento.
- **Objetivo:** revisar los principios que mejoran el aprendizaje de habilidades motoras en general y ver si se aplican al tratamiento de trastornos motores del habla.
- **Conclusión de los autores:** los principios "may interact with each other and differentially affect diverse aspects of movements". Son pocos los estudios que los prueban directamente en el habla, pero la evidencia disponible "suggests that these principles hold promise". Hace falta más investigación en poblaciones con dificultad.
- **Qué principios son:** el resumen no los enumera. Según Rivera Campos (2019), que aplica esta revisión (ver `metodos-existentes.md`), incluyen la frecuencia de la devolución sobre la ejecución y sobre el resultado, y cómo reducirla a medida que la persona aprende. **El resto de los principios no se verificó**, porque no se leyó el texto completo.

## Complementarios

Se leyeron en la misma búsqueda y sirven para el análisis.

- **Campos, A. R., Boyce, S. E., Hwu, F. y DeMott, B. N. (2023).** Tongue root configuration of the apicoalveolar trill /r/: An ultrasound imaging study. *Communication Disorders Quarterly*, 44(3), 143–151. PMID 40873859. https://doi.org/10.1177/15257401221111531
  - Con ecografías de adultos nativos de español, encontraron que además de levantar la parte delantera de la lengua "Spanish speakers also retract the back part of their tongue (i.e., the tongue root)".
  - Las descripciones comunes se ocupan solo de la punta de la lengua.
- **Kummer, A. W. (2023).** Ankyloglossia: Typical characteristics, effects on function, and clinical implications. *Seminars in Speech and Language*, 44(4), 217–229. PMID 37748489. https://doi.org/10.1055/s-0043-1772598
  - Revisión sobre el frenillo lingual corto: "the systematic reviews concluded that there is no evidence that ankyloglossia causes speech disorders".
  - La frenotomía "should rarely, if ever, be recommended for speech disorders".

## Observaciones para el análisis

1. **Derivación a un profesional.** Alfwaress et al. (2015) muestran que en algunas personas la dificultad se asocia con la anatomía (maxilar, lengua, paladar). Para ellas, el bot debería sugerir consultar a un ortodoncista o un cirujano maxilofacial además del fonoaudiólogo. Kummer (2023) indica en cambio que el frenillo corto no explica los trastornos del habla, así que no conviene que el bot lo mencione como causa probable.
2. **Escuchar además de decir.** Herd et al. (2013) encontraron que la producción mejoró con el entrenamiento combinado. El método propio no tiene ejercicios de escucha. Implicaría volver a evaluar el audio, que se había descartado.
3. **Diseño de la práctica.** Maas et al. (2008) son la referencia clínica para decidir cómo distribuir la práctica, cuánto variarla y cómo dar devolución. El bot se apoya en el volumen de práctica y no aplica ninguno de esos principios de forma explícita. Hace falta leer el texto completo para usarlos.
4. **La raíz de la lengua.** Campos et al. (2023) describen un movimiento de la parte trasera de la lengua que las explicaciones comunes no mencionan. Podría entrar en la teoría de las prácticas, pero ningún estudio leído prueba que enseñarlo ayude.

## Fuente de la búsqueda

Resúmenes obtenidos por la API E-utilities de PubMed: https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=25861878,23742375,18663111,40873859,37748489&rettype=abstract&retmode=text
