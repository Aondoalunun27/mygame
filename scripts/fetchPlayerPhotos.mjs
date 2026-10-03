import { access, mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const photoDirectory = path.join(projectRoot, 'public/assets/players');
const manifestPath = path.join(photoDirectory, 'manifest.json');
const playersModulePath = path.join(projectRoot, 'js/players.js');
const assetsNotesPath = path.join(projectRoot, 'docs/ASSETS.md');
const userAgent = 'BallerGrid/1.0 (open football photo catalog; project source in GitHub)';

const roster = [
  'Harry Kane', 'Kylian Mbappé', 'Lamine Yamal', 'Erling Haaland', 'Lionel Messi',
  'Ousmane Dembélé', 'Jude Bellingham', 'Michael Olise', 'Rodri', 'Vinícius Júnior',
  'Mohamed Salah', 'Andrés Iniesta', 'Declan Rice', 'Bruno Fernandes', 'Khvicha Kvaratskhelia',
  'Achraf Hakimi', 'Lautaro Martínez', 'Luis Díaz', 'Nuno Mendes', 'William Saliba',
  'Pau Cubarsí', 'João Neves', 'Fabián Ruiz', 'Gabriel Magalhães', 'Marquinhos',
  'Xavi Hernández', 'Thibaut Courtois', 'Jan Oblak', 'Gianluigi Donnarumma', 'Manuel Neuer',
  'Raphinha', 'Bukayo Saka', 'Phil Foden', 'Cole Palmer', 'Florian Wirtz', 'Jamal Musiala',
  'Pedri', 'Federico Valverde', 'Martin Ødegaard', 'Eduardo Camavinga', 'Aurélien Tchouaméni',
  'Bernardo Silva', 'Kevin De Bruyne', 'Toni Kroos', 'Antoine Griezmann', 'Robert Lewandowski',
  'Julián Álvarez', 'Victor Osimhen', 'Alexander Isak', 'Wayne Rooney', 'Rafael Leão',
  'Rodrygo', 'Khéphren Thuram', 'Désiré Doué', 'Bradley Barcola', 'Ferran Torres',
  'Marcus Rashford', 'Gabriel Martinelli', 'Nico Williams', 'Didier Drogba', 'Dayot Upamecano',
  'Ronald Araújo', 'Alessandro Bastoni', 'Antonio Rüdiger', 'Éder Militão', 'Jules Koundé',
  'Theo Hernández', 'Alphonso Davies', 'Marc Cucurella', 'Reece James', 'Trent Alexander-Arnold',
  'João Cancelo', 'Kim Min-jae', 'Matthijs de Ligt', 'Frenkie de Jong', 'Alexis Mac Allister',
  'Enzo Fernández', 'Nicolò Barella', 'Hakan Çalhanoğlu', 'Federico Dimarco', 'Sandro Tonali',
  'Dominik Szoboszlai', 'Martin Zubimendi', 'Sadio Mané', 'Riyad Mahrez', 'Son Heung-min',
  'Cristiano Ronaldo', 'Neymar', 'Ángel Di María', 'Thomas Müller', 'Romelu Lukaku',
  'Dušan Vlahović', 'Ademola Lookman', 'Victor Boniface', 'Frank Lampard', 'David Beckham',
  'Pelé', 'Zinedine Zidane', 'Ronaldinho', 'Thierry Henry',
];

const aliases = {
  'Rodri': ['Rodri Manchester City footballer'],
  'Andrés Iniesta': ['File:Andrés Iniesta - 001.jpg', 'Andrés Iniesta football'],
  'Xavi Hernández': ['File:Xavi Hernández - 001.jpg', 'Xavi Hernández football'],
  'Wayne Rooney': ['File:Wayne-Rooney-Japan-England-2010-2.jpg', 'Wayne Rooney football'],
  'Didier Drogba': ['File:Didier Drogba Champions League Winner 2012.jpg', 'Didier Drogba football'],
  'Frank Lampard': ['File:Frank Lampard cropped.jpg', 'Frank Lampard football'],
  'David Beckham': ['File:David Beckham, 2008.jpg', 'David Beckham football'],
  'Lamine Yamal': ['Lamine Yamal Barcelona'],
  'Nico Williams': ['Nico Williams Athletic Bilbao'],
  'Raphinha': ['Raphinha Barcelona footballer'],
  'Pelé': ['Pele Brazil footballer'],
  'Zinedine Zidane': ['Zinedine Zidane football'],
  'Ronaldinho': ['Ronaldinho Brazil footballer'],
  'Thierry Henry': ['Thierry Henry footballer'],
  'Gabriel Magalhães': ['Gabriel Magalhaes Arsenal'],
  'Gianluigi Donnarumma': ['Gianluigi Donnarumma goalkeeper'],
  'Jan Oblak': ['Jan Oblak Atletico Madrid'],
  'Jamal Musiala': ['Jamal Musiala Bayern'],
  'Mohammed Kudus': ['Mohammed Kudus West Ham'],
};

const normalize = (value) => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/&amp;/g, 'and')
  .replace(/&#0*39;|&apos;/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, ' ')
  .trim();

const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

function slugify(value) {
  return normalize(value).replace(/\s+/g, '-');
}

function isOpenLicense(license = '') {
  return /^(CC BY(?:-SA)?(?:\s|$)|CC0(?:\s|$)|Public domain)/i.test(license.trim());
}

function matchesPlayer(player, metadata) {
  const haystack = normalize(metadata);
  const nameParts = normalize(player).split(' ');
  if (nameParts.length === 1) return haystack.includes(nameParts[0]);
  const firstName = nameParts[0];
  const familyName = nameParts.at(-1);
  return haystack.includes(firstName) && haystack.includes(familyName);
}

async function searchPlayer(player, usedFileHashes) {
  const searchTerms = aliases[player] ?? [`${player} football`];
  for (const term of searchTerms) {
    const endpoint = new URL('https://commons.wikimedia.org/w/api.php');
    for (const [key, value] of Object.entries({
      action: 'query',
      generator: 'search',
      gsrsearch: term,
      gsrnamespace: '6',
      gsrlimit: '12',
      prop: 'imageinfo',
      iiprop: 'url|extmetadata|sha1',
      iiurlwidth: '640',
      format: 'json',
      maxlag: '5',
    })) endpoint.searchParams.set(key, value);

    let data;
    for (let attempt = 0; attempt < 6; attempt += 1) {
      const response = await fetch(endpoint, { headers: { 'User-Agent': userAgent } });
      if (![429, 503].includes(response.status) && response.ok) {
        try {
          data = await response.json();
        } catch {
          if (attempt === 5) throw new Error(`Commons returned invalid search data for ${player}.`);
          const retryAfter = Number(response.headers.get('retry-after')) || 15 * (attempt + 1);
          console.warn(`Commons returned a rate-limit response; retrying ${player} after ${retryAfter}s.`);
          await delay(Math.min(retryAfter, 60) * 1000);
          continue;
        }
        if (!data.error) break;
      }
      if (attempt === 5) throw new Error(`Commons search failed for ${player}: HTTP ${response.status}`);
      const retryAfter = Number(response.headers.get('retry-after')) || 2 ** (attempt + 1);
      console.warn(`Commons rate limit; retrying ${player} after ${retryAfter}s.`);
      await delay(Math.min(retryAfter, 60) * 1000);
    }

    if (data.error) {
      console.warn(`Commons search error for ${player}: ${data.error.info ?? data.error.code}`);
      continue;
    }
    const candidates = Object.values(data.query?.pages ?? {});
    candidates.sort((left, right) => {
      const leftInfo = left.imageinfo?.[0];
      const rightInfo = right.imageinfo?.[0];
      const leftMatch = matchesPlayer(player, `${left.title} ${leftInfo?.extmetadata?.ImageDescription?.value ?? ''}`);
      const rightMatch = matchesPlayer(player, `${right.title} ${rightInfo?.extmetadata?.ImageDescription?.value ?? ''}`);
      return Number(rightMatch) - Number(leftMatch);
    });

    for (const page of candidates) {
      const info = page.imageinfo?.[0];
      const metadata = info?.extmetadata ?? {};
      const license = metadata.LicenseShortName?.value ?? '';
      const imageUrl = info?.thumburl;
      const identityText = [page.title, metadata.ImageDescription?.value, metadata.ObjectName?.value]
        .filter(Boolean)
        .join(' ');
      if (!imageUrl || !info.sha1 || !isOpenLicense(license)) continue;
      if (!matchesPlayer(player, identityText) || usedFileHashes.has(info.sha1)) continue;

      const artist = (metadata.Artist?.value ?? 'Unknown').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      const extension = path.extname(new URL(imageUrl).pathname).toLowerCase() || '.jpg';
      return {
        id: slugify(player),
        name: player,
        extension,
        image: `/assets/players/${slugify(player)}${extension}`,
        alt: `${player} during a football appearance`,
        source: info.descriptionurl,
        sourceTitle: page.title,
        artist,
        license,
        licenseUrl: metadata.LicenseUrl?.value ?? '',
        sha1: info.sha1,
        thumbnailUrl: imageUrl,
      };
    }
    await delay(1200);
  }
  return null;
}

async function downloadPhoto(record) {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const response = await fetch(record.thumbnailUrl, { headers: { 'User-Agent': userAgent } });
    if (response.ok) {
      const contentType = response.headers.get('content-type') ?? '';
      if (!contentType.startsWith('image/')) throw new Error(`Commons returned a non-image for ${record.name}.`);
      const filePath = path.join(photoDirectory, `${record.id}${record.extension}`);
      await writeFile(filePath, Buffer.from(await response.arrayBuffer()));
      return;
    }
    if (![429, 503].includes(response.status) || attempt === 3) {
      throw new Error(`Photo download failed for ${record.name}: HTTP ${response.status}`);
    }
    const retryAfter = Number(response.headers.get('retry-after')) || 12 * (attempt + 1);
    console.warn(`Image host rate limit; retrying ${record.name} after ${retryAfter}s.`);
    await delay(Math.min(retryAfter, 60) * 1000);
  }
}

function renderPlayersModule(records) {
  const publicRecords = records.map(({ thumbnailUrl, sha1, ...record }) => record);
  return `export const PLAYERS = Object.freeze(${JSON.stringify(publicRecords, null, 2)});\n`;
}

function renderAssetNotes(records) {
  const credits = records.map((record) =>
    `- \`${path.basename(record.image)}\`: ${record.name}; photograph by ${record.artist}; ${record.license}. [Source](${record.source})`,
  ).join('\n');
  return `# Asset Notes\n\nAll player portraits are locally bundled 640-pixel Wikimedia Commons thumbnails, so the game is playable offline. The original creator and reuse license for each file are credited below. Photo tiles use CSS crops; the downloaded photos are not otherwise edited.\n\n${credits}\n\n- \`football.svg\`: Soccer ball; by Pumbaa80; CC BY-SA 3.0. Used for the favicon, in-app ball imagery, and web app icon. Android launcher PNG variants are derived from this image and are shared under the same license. [Source](https://commons.wikimedia.org/wiki/File:Soccer_ball.svg) · [License](https://creativecommons.org/licenses/by-sa/3.0/)\n- Sound effects and background music are synthesized locally with Web Audio. No music recordings or sound files are bundled.\n- The system font stack uses fonts already available on the device.\n`;
}

await mkdir(photoDirectory, { recursive: true });
let records = [];
try {
  records = JSON.parse(await readFile(manifestPath, 'utf8'));
} catch {
  records = [];
}
for (const record of records) {
  const previousPath = path.join(photoDirectory, path.basename(record.image));
  record.id = slugify(record.name);
  record.extension = record.extension || path.extname(new URL(record.thumbnailUrl).pathname).toLowerCase() || '.jpg';
  record.image = `/assets/players/${record.id}${record.extension}`;
  const canonicalPath = path.join(photoDirectory, `${record.id}${record.extension}`);
  if (previousPath !== canonicalPath) {
    try {
      await access(previousPath);
      await rename(previousPath, canonicalPath);
    } catch {
      // The metadata may have been saved before a previous download completed.
    }
  }
}
const byName = new Map(records.map((record) => [record.name, record]));
const usedFileHashes = new Set(records.map((record) => record.sha1));
const failedPlayers = [];

console.log(`Preparing ${roster.length} unique player photos.`);
for (let index = 0; index < roster.length; index += 1) {
  const player = roster[index];
  let record = byName.get(player);
  if (record) {
    try {
      await access(path.join(photoDirectory, `${record.id}${record.extension}`));
      continue;
    } catch {
      // Resume a saved source selection before querying Commons again.
    }
  } else {
    record = await searchPlayer(player, usedFileHashes);
    if (!record) {
      failedPlayers.push(player);
      console.warn(`[${index + 1}/${roster.length}] No unique openly licensed portrait found for ${player}.`);
      continue;
    }
    byName.set(player, record);
    usedFileHashes.add(record.sha1);
    await writeFile(manifestPath, JSON.stringify([...byName.values()], null, 2));
  }
  try {
    await downloadPhoto(record);
    console.log(`[${index + 1}/${roster.length}] ${player}: ${record.license} (${record.artist})`);
  } catch (error) {
    failedPlayers.push(player);
    console.warn(error.message);
  }
  await delay(1200);
}

records = roster.map((player) => byName.get(player)).filter(Boolean);
await writeFile(manifestPath, JSON.stringify(records, null, 2));
console.log(`Downloaded ${records.length}/${roster.length} unique portraits.`);
if (failedPlayers.length) {
  console.error(`Missing portraits: ${failedPlayers.join(', ')}`);
  process.exitCode = 1;
} else {
  await writeFile(playersModulePath, renderPlayersModule(records));
  await writeFile(assetsNotesPath, renderAssetNotes(records));
  console.log(`Generated ${path.relative(projectRoot, playersModulePath)} and ${path.relative(projectRoot, assetsNotesPath)}.`);
}