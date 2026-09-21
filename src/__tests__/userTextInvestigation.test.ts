import { describe, it, expect } from 'vitest';
import { paginateDocument } from '../engine/pagination';
import { autoFitFontSize } from '../engine/autoFit';
import { optimizeCanvasFill } from '../engine/canvasFillOptimizer';
import {
  DEFAULT_ADVANCED,
  DEFAULT_CANVAS,
  DEFAULT_DOCUMENT,
  DEFAULT_SPACING,
  DEFAULT_TYPOGRAPHY,
} from '../engine/presetStore';

const paragraphText = 'test '.repeat(172).trim();
const userFullText = [
  paragraphText,
  paragraphText,
  paragraphText,
  paragraphText,
  paragraphText,
  paragraphText,
].join('\n\n');

const spanish16ParaText = `miles de personas pagan una entrada, viajan hasta el mismo lugar, hacen fila, renuncian a comodidad y espacio personal, muchas veces sin poder ver ni escuchar bien, todo por unas horas de una experiencia armada alrededor de música a la que ya pueden acceder prácticamente desde cualquier lugar y en cualquier momento

la música sigue importando, pero es apenas una parte de lo que se vende, presencia física, cercanía con el artista, espectáculo, ritual, intensidad colectiva, escasez, excitación compartida y la sensación de estar participando de algo lo bastante importante como para que miles de personas también hayan decidido reunirse alrededor de eso

la versión grabada ya puede escucharse exactamente como fue producida, sin el ruido del público, al volumen que uno quiera, pausarla, repetirla, volver atrás y escucharla bajo condiciones elegidas por uno mismo, así que todo el valor extra del recital tiene que venir de lo que rodea a la música, presencia física, cercanía, espectáculo, ritual, intensidad del público y el estatus asociado a estar cerca de la persona que la hizo

y esa presencia física es literalmente un producto, un ser humano adquiriendo suficiente valor como para que miles de desconocidos paguen simplemente por ocupar el mismo espacio que él durante unas horas, sin tener ninguna relación con esa persona, sin recibir ningún reconocimiento de ella y sabiendo poco / nada sobre quién es realmente más allá de una imagen pública cuidadosamente mostrada

esa parte vuelve todo todavía más superficial, una cantidad enorme de valor emocional y económico puesta sobre alguien a quien la mayoría de los asistentes no conoce personalmente en absoluto, conocen canciones, entrevistas, clips, actuaciones, branding, fragmentos de personalidad elegidos para el consumo público, y de alguna manera ese recorte mínimo y controlado alcanza para que la simple cercanía física con esa persona adquiera un valor extraordinario

unas pocas palabras desde el escenario pueden hacer gritar a miles de personas que no tienen ninguna base seria para considerar al que habla alguien personalmente importante, la reacción aparece primero y el conocimiento real de la persona / grupo es mínimo, años viendo la misma cara y escuchando la misma voz creando una sensación de familiaridad con alguien cuyo carácter privado, comportamiento cotidiano y forma real de ser siguen siendo desconocidos

después el público empieza a alimentarse a sí mismo, miles cantando las mismas palabras, gritando en los mismos momentos, levantando los teléfonos, copiando gestos, reaccionando no solamente al artista sino a miles de personas reaccionando al artista, cada reacción visible haciendo que la siguiente salga más fácil, más fuerte y más automática

a esa altura gran parte de la intensidad ya no es una respuesta individual a lo que está pasando en el escenario, es contagio social, gente reaccionando al hecho de que todos a su alrededor están reaccionando, excitación generando más excitación, volumen convertido en prueba de importancia, escala convertida en prueba de que aquello merece esa escala, atajos mentales funcionando al máximo, reacciones copiadas antes de ser examinadas, personas absorbiendo la emoción del grupo y sintiendo una parte de ella como propia

y después toda esa reacción masiva se romantiza como algo profundo, “humanidad”, “alma”, “estar vivo”, como si miles de sistemas nerviosos sincronizándose alrededor del ruido, la repetición, la cercanía y las señales sociales revelaran alguna verdad profunda sobre la existencia humana, cuando gran parte de lo que está pasando puede explicarse por mecanismos tan primitivos que no requieren reflexión alguna

llamarlo “alma” no lo vuelve menos mecánico, llamarlo “humanidad” no lo vuelve inteligente, ponerle lenguaje poético al contagio emocional de masas solamente oculta lo poco que hace falta pensar para que miles de personas se copien, se amplifiquen y después vivan la intensidad producida por ese mismo proceso como algo espiritualmente significativo

el público tampoco se limita a consumir el espectáculo, aporta gran parte del ruido, la escala, el movimiento, las grabaciones, la validación social y la fuerza emocional que hacen que el evento se sienta enorme, y después confunde la intensidad producida por miles de reacciones que se amplifiquen entre sí con evidencia de que el artista o el momento contenían por sí mismos toda esa intensidad

la gente ayuda a crear la fuerza emocional, queda abrumada por la fuerza que creó colectivamente y después se la atribuye a aquello que está en el centro

la jerarquía debajo de todo esto es vergonzosamente simple, una persona sigue siendo singular mientras miles se convierten en una masa anónima, un lado paga por acercarse, el otro cobra porque suficiente gente quiere acercarse, un lado se vuelve menos relevante individualmente cuanto más crece la multitud, la persona en el escenario se vuelve más importante precisamente porque la multitud creció

eso es culto a la celebridad sin todo el lenguaje halagador que lo recubre, miles de personas entregando dinero, tiempo, atención, comodidad y energía emocional a alguien que no conocen, reuniéndose físicamente alrededor suyo, reaccionando entre ellas hasta que la reacción misma se vuelve enorme, y después usando el tamaño de su propia reacción colectiva como prueba de que la persona en el centro realmente merecía toda esa importancia desde el principio

y eso es justamente lo que todo el lenguaje halagador está tapando, una acumulación de suposiciones, apego superficial, reacciones prestadas, culto al estatus, contagio emocional e imitación primitiva, miles de personas apenas conociendo a quien están gritando, tomando la excitación de los demás como prueba de importancia, amplificándose entre sí hasta que la reacción se vuelve enorme, después devolviendo toda esa intensidad generada por ellos mismos a la persona que está en el centro y llamando al conjunto “alma”, “humanidad” o “estar vivo”, como si la renuncia colectiva al juicio propio se volviera profunda simplemente porque suficiente gente participó de ella al mismo tiempo, y si esto es lo que la sociedad sigue presentando como prueba de profundidad humana, entonces el estándar cayó lo bastante bajo como para que una reacción de masa pase por significado y la estupidez colectiva pase por algo especial

escribí esto después de enterarme de que una chica murió alrededor de uno de estos recitales, después de ver a toda una cultura glorificar el mismo amontonamiento, agotamiento, incomodidad y pérdida de juicio como pasión, miles pagando, esperando, gritando y apretándose unos contra otros por estar cerca de desconocidos a quienes elevaron muchísimo más allá de cualquier cosa que realmente sepan de ellos, unos pocos arriba del escenario llenándose los bolsillos y alimentando el ego mientras la multitud pone el dinero, la adoración, el ruido y la importancia que mantienen viva toda la máquina, ingenuidad de masas convertida en ritual, estupidez colectiva vendida de vuelta como algo especial y después romantizada como “humanidad” por la misma gente que participa de ella`;

describe('User Text Investigation', () => {
  it('guarantees >= 95% utilization across all 4 pages on user 6-paragraph text without splitting paragraphs', () => {
    const doc = {
      ...DEFAULT_DOCUMENT,
      text: userFullText,
      pageCount: 4,
      distributionMode: 'paragraph-preserving' as const,
    };

    const autoFitRes = autoFitFontSize(doc, {
      canvas: DEFAULT_CANVAS,
      typography: DEFAULT_TYPOGRAPHY,
      spacing: { ...DEFAULT_SPACING, preset: 'compact', paddingTop: 48, paddingBottom: 48, paddingLeft: 48, paddingRight: 48, minBottomSpace: 0 },
      advanced: { ...DEFAULT_ADVANCED, autoFit: true },
    });

    expect(autoFitRes.pages.length).toBe(4);
    for (const page of autoFitRes.pages) {
      expect(page.isOverflowing).toBe(false);
      expect(page.utilization).toBeGreaterThanOrEqual(95);
    }

    const fillRes = optimizeCanvasFill(
      doc,
      { ...DEFAULT_CANVAS, trimLastPageHeight: false },
      DEFAULT_TYPOGRAPHY,
      { ...DEFAULT_SPACING, preset: 'compact', paddingTop: 48, paddingBottom: 48, paddingLeft: 48, paddingRight: 48, minBottomSpace: 0 },
      DEFAULT_ADVANCED
    );

    expect(fillRes.paginationResult.pages.length).toBe(4);
    for (const page of fillRes.paginationResult.pages) {
      expect(page.isOverflowing).toBe(false);
      expect(page.utilization).toBeGreaterThanOrEqual(95);
    }
  });

  it('investigates user exact 16-paragraph Spanish essay', () => {
    const doc = {
      ...DEFAULT_DOCUMENT,
      text: spanish16ParaText,
      pageCount: 4,
      distributionMode: 'paragraph-preserving' as const,
    };

    const autoFitRes = autoFitFontSize(doc, {
      canvas: DEFAULT_CANVAS,
      typography: DEFAULT_TYPOGRAPHY,
      spacing: { ...DEFAULT_SPACING, preset: 'compact', paddingTop: 48, paddingBottom: 48, paddingLeft: 48, paddingRight: 48, minBottomSpace: 0 },
      advanced: { ...DEFAULT_ADVANCED, autoFit: true },
    });

    console.log('--- TEST: TRIM ALL PAGES (UNIFORM FONT SIZE) ---');
    const trimAllDocRes = paginateDocument(doc, {
      canvas: { ...DEFAULT_CANVAS, trimAllPages: true },
      typography: { ...DEFAULT_TYPOGRAPHY, fontSize: 28 },
      spacing: { ...DEFAULT_SPACING, preset: 'compact', paddingTop: 48, paddingBottom: 48, paddingLeft: 48, paddingRight: 48, minBottomSpace: 0 },
      advanced: DEFAULT_ADVANCED,
    });
    trimAllDocRes.pages.forEach((p, i) => {
      console.log(`Page ${i + 1}: util=${p.utilization}%, lines=${p.lines.length}, h=${p.renderedHeight}`);
      expect(p.utilization).toBe(100);
      expect(p.isOverflowing).toBe(false);
    });
  });
});

