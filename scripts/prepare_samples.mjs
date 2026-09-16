import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const samplesDir = path.join(__dirname, '..', 'docs', 'samples');
if (!fs.existsSync(samplesDir)) {
  fs.mkdirSync(samplesDir, { recursive: true });
}

export const concertEssay = `thousands of people pay for admission, travel to the same place, wait in lines, give up comfort and personal space, often unable to see or hear properly, all for a few hours of an experience built around music they can already access almost anywhere at any time

the music still matters, but it is only one part of what is being sold, physical presence, proximity to the performer, spectacle, ritual, crowd intensity, scarcity, shared excitement and the feeling of participating in something important enough for thousands of other people to gather around it too

the recorded music can already be heard exactly as produced, without crowd noise, at any volume, paused, replayed, repeated and listened to under conditions chosen by the listener, so the entire extra value of the concert has to come from everything surrounding the music, physical presence, proximity, spectacle, ritual, crowd intensity and the status attached to being near the person who made it

and that physical presence is literally a product, one human being becoming valuable enough that thousands of strangers pay just to occupy the same space as them for a few hours, despite having no relationship with them, receiving no recognition from them and knowing almost nothing about them beyond a carefully exposed public surface

that last part makes the whole thing even more superficial, enormous emotional and monetary value assigned to someone most attendees do not know personally at all, they know songs, interviews, clips, performances, branding, fragments of personality selected for public consumption, then somehow that tiny controlled slice is enough for physical proximity to the person themselves to acquire extraordinary value

a few words from the stage can trigger screaming from thousands of people who have no serious basis for treating the speaker as personally important, the reaction coming first and the actual knowledge of the person barely existing, repeated exposure to a face and voice doing the work that actual relationship normally would, familiarity becoming attachment to someone whose private character, ordinary behavior and actual self remain almost completely unknown

then the crowd begins feeding on itself, thousands singing the same words, screaming at the same moments, raising phones, copying gestures, reacting not only to the performer but to thousands of other people reacting to the performer, each visible reaction making the next reaction easier, louder and more automatic

at that point much of the intensity is no longer an individual response to what is happening on stage, it is social contagion, people responding to the fact that everyone around them is responding, excitement becoming evidence for more excitement, volume becoming evidence for importance, scale becoming evidence that the thing deserves the scale, basic heuristics running at maximum, reactions copied before they are examined, people absorbing the crowd's emotion and experiencing part of it as their own

and then this mass reaction gets romanticized as something profound, “humanity,” “soul,” “being alive,” as though thousands of nervous systems synchronizing around noise, repetition, proximity and social cues reveals some deep truth about human existence, when most of what is happening can be explained by mechanisms so primitive they require almost no reflection at all

calling it “soul” does not make it less mechanical, calling it “humanity” does not make it intelligent, putting poetic language over mass emotional contagion only hides how little thought is required for thousands of people to copy one another, amplify one another and then experience the resulting intensity as something spiritually significant

the audience is not merely consuming the spectacle either, it supplies much of the noise, scale, movement, footage, social proof and emotional force that make the event feel enormous, then mistakes the intensity produced by thousands of mutually amplifying reactions for evidence that the performer or moment itself contained that intensity

people help create the emotional force, become overwhelmed by the force they collectively created, then attribute it back to the thing at the center

the hierarchy underneath all of this is embarrassingly simple, one person remains singular while thousands become an anonymous mass, one side pays to get closer, the other is paid because enough people want to get closer, one side becomes less individually relevant as the crowd grows, the person on stage becomes more important precisely because the crowd grew

that is celebrity worship stripped of the flattering language around it, thousands of people giving money, time, attention, comfort and emotional energy to someone they do not know, physically gathering around them, reacting to one another until the reaction itself becomes enormous, then using the size of their own collective reaction as proof that the person at the center deserved that importance in the first place

and that is what all the flattering language is covering up, a pile of assumptions, superficial attachment, borrowed reactions, status worship, emotional contagion and primitive imitation, thousands of people barely knowing the person they are screaming for, taking everyone else’s excitement as evidence of importance, amplifying one another until the reaction becomes enormous, then crediting that self-generated intensity back to the person at the center and calling the whole thing “soul,” “humanity” or “being alive,” as if collective surrender of judgment became profound simply because enough people participated in it at once, and if this is what society keeps presenting as evidence of human depth, then the standard has fallen low enough for mass reflex to pass as meaning and collective stupidity to pass as something special

wrote this after hearing that a girl died around one of these concerts, after watching an entire culture glorify the same crowding, exhaustion, discomfort and loss of judgment as passion thousands are paying for, waiting, screaming and packing themselves together for proximity to strangers they have elevated far beyond anything they actually know about them a few people on stage filling their pockets and feeding their ego while the crowd supplies the money, worship, noise and importance that keeps the whole machine alive mass naïvety turned into ritual, collective stupidity sold back as something special, then romanticized as “humanity” by the same people participating in it`;

export const spanishEssay = `¿Qué queda de un pensamiento cuando se despoja del ruido cotidiano y se plasma en la desnudez de un soporte tipográfico? En un entorno dominado por la prisa y la saturación visual, la palabra reposada adquiere una extraña gravedad. No se trata únicamente de comunicar un dato, sino de esculpir una cadencia donde cada acento, cada signo de puntuación y cada espacio en blanco jueguen a favor de la inteligibilidad.

La tipografía editorial no admite atajos: una comilla tipográfica («curly quote»), una diéresis o una letra «ñ» no son meros adornos ornamentales, sino las señas de identidad de una lengua viva. Cuando un algoritmo arbitrario divide una frase a mitad de su aliento o desparrama una sílaba en una página huérfana, la armonía interna del texto se fractura de inmediato.

Por ello, la rasterización determinista rescata el oficio clásico de la imprenta. Medir con exactitud milimétrica la altura renderizada de cada glifo, calcular el respiro entre párrafos contiguos y equilibrar la densidad visual entre pliegos sucesivos permite que el lector recupere el placer de la lectura continua. El ojo no tropieza con artificios ni trucos de diseño: sólo encuentra contraste puro, pureza cromática (#000000 absoluto sobre #FFFFFF impoluto) y la serenidad de una prosa que sabe exactamente dónde detenerse.`;

export const mediumArticle = `Software craftsmanship is often framed as a battle between speed and elegance, but this dichotomy misunderstands both. When an interface feels genuinely fast, it is almost never because the code cut corners; it is because the architecture respected the medium.

A deterministic tool does not guess what the user wants. It gives them explicit, predictable knobs: line height, canvas dimensions, font weight, and boundary constraints. When you press a button, the system executes pure functions over known state, producing the exact same mathematical layout every single time.

In typography, this predictability is everything. The distance between two paragraphs should be identical on page one and page three. A 4:5 portrait canvas should never silently deform into a squarish card simply because the last sentence was short. By treating text measurement as geometry rather than guesswork, we restore confidence to digital writing.`;

export const shortQuote = `Simplicity is not the absence of clutter, that's a consequence of simplicity. Simplicity is somehow essentially describing the purpose and place of an object and product. The best design is the one that disappears into utility, leaving only the thought itself.`;

fs.writeFileSync(path.join(samplesDir, 'concert-essay-16paras.txt'), concertEssay, 'utf8');
fs.writeFileSync(path.join(samplesDir, 'spanish-literary-essay.txt'), spanishEssay, 'utf8');
fs.writeFileSync(path.join(samplesDir, 'medium-craftsmanship-2pages.txt'), mediumArticle, 'utf8');
fs.writeFileSync(path.join(samplesDir, 'short-aphorism-1page.txt'), shortQuote, 'utf8');

console.log('Sample texts successfully generated in docs/samples/');
