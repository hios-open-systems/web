import { normalizeSearch } from '../workbench/discovery.ts';

export const glossaryCategories = ['signals', 'operation', 'bands', 'technology'] as const;
export type GlossaryCategory = typeof glossaryCategories[number];

export const glossarySources = {
  arrl: { label: 'ARRL · Operating Aids', href: 'https://www.arrl.org/operating-aids' },
  quickstart: { label: 'ARRL · Quickstart Guide', href: 'https://www.arrl.org/files/file/Get%20Licensed/Quickstart%20Guide%20EBOOK.pdf' },
  itu: { label: 'UIT / ITU · V.431-9', href: 'https://www.itu.int/dms_pubrec/itu-r/rec/v/R-REC-V.431-9-202510-I%21%21PDF-E.pdf' },
  etsi: { label: 'ETSI · DMR TS 102 361-1', href: 'https://www.etsi.org/deliver/etsi_ts/102300_102399/10236101/02.07.01_60/ts_10236101v020701p.pdf' },
  repeaters: { label: 'ARRL · Repeaters', href: 'https://www.arrl.org/files/file/Technology/tis/info/pdf/repeater1.pdf' },
  controls: { label: 'Icom · RX / TX / PTT / SQL', href: 'https://www.icomjapan.com/api/download.php?fl=JTJGdXBsb2FkcyUyRnN1cHBvcnQlMkZtYW51YWwlMkZJQy1BMTZfQTE2RV9GTV9FTkdfMy5wZGY%3D&post_id=1801' },
  wsjtx: { label: 'WSJT-X · FT8', href: 'https://wsjt.sourceforge.io/wsjtx-doc/wsjtx-main-2.7.0.html#_ft8' },
  enacom: { label: 'ENACOM', href: 'https://www.enacom.gob.ar/normativa-principal_p2974' },
} as const;

interface EntryConfig {
  id: string;
  category: GlossaryCategory;
  source: keyof typeof glossarySources;
  keywords?: string;
  related?: readonly string[];
}

export const glossaryEntries = [
  { id: 'cq', category: 'signals', source: 'quickstart', related: ['qrz', 'callsign'] },
  { id: 'qsl', category: 'signals', source: 'arrl', related: ['qso'] },
  { id: 'qso', category: 'signals', source: 'quickstart', related: ['qsl', 'cq'] },
  { id: 'ptt', category: 'operation', source: 'controls', keywords: 'push to talk', related: ['tx', 'rx'] },
  { id: 'dmr', category: 'technology', source: 'etsi', related: ['colorCode', 'timeSlot', 'talkgroup'] },
  { id: 'hf', category: 'bands', source: 'itu', related: ['fortyMeters', 'twentyMeters'] },
  { id: 'vhf', category: 'bands', source: 'itu', related: ['twoMeters'] },
  { id: 'uhf', category: 'bands', source: 'itu', related: ['seventyCentimeters'] },
  { id: 'qth', category: 'signals', source: 'arrl' },
  { id: 'qrz', category: 'signals', source: 'arrl', related: ['cq'] },
  { id: 'qrl', category: 'signals', source: 'arrl', related: ['cq'] },
  { id: 'qrm', category: 'signals', source: 'arrl', related: ['qrn'] },
  { id: 'qrn', category: 'signals', source: 'arrl', related: ['qrm'] },
  { id: 'qsb', category: 'signals', source: 'arrl' },
  { id: 'qsy', category: 'signals', source: 'arrl' },
  { id: 'qrt', category: 'signals', source: 'arrl', related: ['qrv'] },
  { id: 'qrv', category: 'signals', source: 'arrl' },
  { id: 'qrp', category: 'signals', source: 'arrl' },
  { id: 'seventyThree', category: 'signals', source: 'quickstart', keywords: '73 salutations saludos regards' },
  { id: 'rx', category: 'operation', source: 'repeaters', related: ['tx', 'ptt'] },
  { id: 'tx', category: 'operation', source: 'repeaters', related: ['rx', 'ptt'] },
  { id: 'simplex', category: 'operation', source: 'repeaters', related: ['repeater'] },
  { id: 'repeater', category: 'operation', source: 'repeaters', related: ['simplex', 'rx', 'tx'] },
  { id: 'squelch', category: 'operation', source: 'controls', keywords: 'sql mute silenciamiento silenziatore rauschsperre' },
  { id: 'callsign', category: 'operation', source: 'enacom', keywords: 'call sign indicativo señal distintiva rufzeichen nominativo' },
  { id: 'fortyMeters', category: 'bands', source: 'enacom', keywords: '40m 40 metros meters metri meter 7mhz', related: ['hf'] },
  { id: 'twentyMeters', category: 'bands', source: 'enacom', keywords: '20m 20 metros meters metri meter 14mhz', related: ['hf'] },
  { id: 'twoMeters', category: 'bands', source: 'enacom', keywords: '2m 2 metros meters metri meter 145mhz', related: ['vhf', 'repeater'] },
  { id: 'seventyCentimeters', category: 'bands', source: 'enacom', keywords: '70cm 70 centimetros centimeters zentimeter centimetri 435mhz', related: ['uhf'] },
  { id: 'colorCode', category: 'technology', source: 'etsi', keywords: 'cc codigo de color color code', related: ['dmr'] },
  { id: 'timeSlot', category: 'technology', source: 'etsi', keywords: 'ts tdma time slot ranura', related: ['dmr', 'talkgroup'] },
  { id: 'talkgroup', category: 'technology', source: 'etsi', keywords: 'tg talk group grupo', related: ['dmr', 'timeSlot'] },
  { id: 'fm', category: 'technology', source: 'quickstart', related: ['am', 'ssb'] },
  { id: 'am', category: 'technology', source: 'quickstart', related: ['fm', 'ssb'] },
  { id: 'ssb', category: 'technology', source: 'quickstart', keywords: 'blu usb lsb banda lateral upper lower sideband', related: ['am'] },
  { id: 'cw', category: 'technology', source: 'quickstart', keywords: 'morse telegrafia telegraphy' },
  { id: 'ft8', category: 'technology', source: 'wsjtx', keywords: 'wsjt wsjtx weak signal digital' },
] as const satisfies readonly EntryConfig[];

export type GlossaryEntryId = typeof glossaryEntries[number]['id'];

export interface GlossaryEntry extends EntryConfig {
  id: GlossaryEntryId;
  term: string;
  name: string;
  english: string;
  meaning: string;
  example: string;
}

export function filterGlossary(entries: readonly GlossaryEntry[], query: string, category: GlossaryCategory | 'all') {
  const words = normalizeSearch(query).split(/\s+/).filter(Boolean);
  return entries.filter((entry) => {
    if (category !== 'all' && category !== entry.category) return false;
    const text = normalizeSearch(`${entry.term} ${entry.name} ${entry.english} ${entry.meaning} ${entry.example} ${entry.keywords ?? ''}`);
    return words.every((word) => text.includes(word));
  });
}
