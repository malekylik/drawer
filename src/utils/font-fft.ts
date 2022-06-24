export interface CharInfo {
  x: number;
  y: number;
  width: number;
  height: number;
  lsb: number;
  rsb: number;
}

export function parseTTF(fontBuffer: Uint8Array) {
  const buffer = fontBuffer;

  let position = 0;

  const decoder = new TextDecoder();

  function readShort() {
    let res = ((buffer[position + 0] as number) << 8) | (buffer[position + 1] as number);

    if (res & 0x8000) res -= (1 << 16);

    position += 2;

    return res;
  }

  function readUShort() {
    let res = (((buffer[position + 0] as number) << 8) | (buffer[position + 1] as number)) >>> 0;

    position += 2;

    return res;
  }

  const readFShort = readShort;

  // function readFWord() {
  //   // let res = (buffer[position + 1] << 8) | buffer[position + 0];
  //   let res = (buffer[position + 0] << 8) | buffer[position + 1];

  //   position += 2;

  //   return res;
  // }

  function readWord() {
    let res = (((buffer[position + 0] as number) << 24) | ((buffer[position + 1] as number) << 16) | ((buffer[position + 2] as number) << 8) | (buffer[position + 3] as number)) >>> 0;

    position += 4;

    return res;
  }

  function readUWord() {
    let res = (((buffer[position + 0] as number) << 24) | ((buffer[position + 1] as number) << 16) | ((buffer[position + 2] as number) << 8) | (buffer[position + 3] as number)) >>> 0;

    position += 4;

    return res;
  }

  function readFixed() {
    return readWord() / (1 << 16);
  }

  function advanceCursor(offset: number) {
    position += offset;
  }

  function setCursor(newPosition: number) {
    position = newPosition;
  }

  function readDate () {
    const macTime = readUWord() * 0x100000000 + readUWord();
    const utcTime = macTime * 1000 + Date.UTC(1904, 1, 1);
    return new Date(utcTime);
  }

  function readAsString(lenght: number) {
    const val = decoder.decode(buffer.subarray(position, position + lenght));

    position += lenght;

    return val;
  }

  function getTableInfo(tables: Array<Table>, tag: 'glyf' | 'head' | 'maxp' | 'hhea' | 'loca' | 'cmap' | 'hmtx') {
    return tables.find(table => table.tag === tag);
  }

  setCursor(4);

  const numTables = readShort();

  // tableRecord
  setCursor(12);

  interface Table {
    tag: string;
    checksum: number;
    offset: number;
    length: number;
  }

  const tables: Array<Table> = [];

  for (let i = 0; i < numTables; i++) {
    const tag = readAsString(4).trim();

    tables.push({
      tag,
      checksum: readUWord(),
      offset: readUWord(),
      length: readUWord(),
    });
  }

  tables.sort((a, b) => a.offset - b.offset);


  console.log(tables);
  console.log(position);

  const headTableInfo = getTableInfo(tables, 'head');

  if (!headTableInfo) {
    console.log('head table info didnt find');
    process.exit(0);
  }

  setCursor(headTableInfo.offset);
  // console.log(numTables, tag, offset, lenght);

  const majorVersion = readShort();
  const minorVersion = readShort();
  const fontRevision = readFixed();

  setCursor(headTableInfo.offset + 18);

  const unitsPerEm = readUShort();
  const created = readDate();
  const modified = readDate();

  console.log(majorVersion, minorVersion, fontRevision);
  console.log(unitsPerEm, created, modified);

  advanceCursor(14);

  const indexToLocFormat = readShort();

  console.log('indexToLocFormat', indexToLocFormat);

  const maxpTableInfo = getTableInfo(tables, 'maxp');

  if (!maxpTableInfo) {
    console.log('maxp table info didnt find');
    process.exit(0);
  }

  setCursor(maxpTableInfo.offset);

  const version = readFixed();
  const numGlyphs = readUShort();

  const maxp = {
    version,
    numGlyphs,
  };

  console.log('maxp', maxp);

  const hheaTableInfo = getTableInfo(tables, 'hhea');

  if (!hheaTableInfo) {
    console.log('hhea table info didnt find');
    process.exit(0);
  }

  setCursor(hheaTableInfo.offset + 24 + 8);

  const metricDataFormat = readShort();
  const numOfLongHorMetrics = readUShort();

  const hhea = {
    metricDataFormat,
    numOfLongHorMetrics,
  };

  console.log('hhea', hhea);

  const hmtxTableInfo = getTableInfo(tables, 'hmtx');

  if (!hmtxTableInfo) {
    console.log('hmtx table info didnt find');
    process.exit(0);
  }

  setCursor(hmtxTableInfo.offset);

  // console.log(glyfs.at(-1));

  const hMetrics = [];
  for (let i = 0; i < hhea.numOfLongHorMetrics; i++) {
    hMetrics.push({
      advanceWidth: readUShort(),
      leftSideBearing: readShort(),
    });
  }

  const leftSideBearing = [];
  for (let i = 0; i < maxp.numGlyphs - hhea.numOfLongHorMetrics; i++) {
    leftSideBearing.push(readFShort());
  }

  const hmtx = {
    hMetrics,
    leftSideBearing,
  };

  console.log('hmtx', hmtx);

  const locaTableInfo = getTableInfo(tables, 'loca');

  if (!locaTableInfo) {
    console.log('loca table info didnt find');
    process.exit(0);
  }

  setCursor(locaTableInfo.offset);

  const loca = [];
  const getter = indexToLocFormat === 0 ? readUShort : readUWord;

  for (let i = 0; i < numGlyphs + 1; i++) {
    loca.push(getter());
  }

  console.log(loca);

  const glyfTableInfo = getTableInfo(tables, 'glyf');

  if (!glyfTableInfo) {
    console.log('glyf table info didnt find');
    process.exit(0);
  }

  setCursor(glyfTableInfo.offset);

  interface Glyph {
    numberOfContours: number;
    xMin: number;
    yMin: number;
    xMax: number;
    yMax: number;
  }

  const glyfs: Array<Glyph> = [];

  const multiplier = indexToLocFormat === 0 ? 2 : 1;

  for (let i = 0; i < loca.length - 1; i++) {
    const locaOffset = (loca[i] as number) * multiplier;

    setCursor(glyfTableInfo.offset + locaOffset);

    glyfs.push({
      numberOfContours: readShort(),
      xMin: readShort(),
      yMin: readShort(),
      xMax: readShort(),
      yMax: readShort(),
    });
  }

  const cmapTableInfo = getTableInfo(tables, 'cmap');

  if (!cmapTableInfo) {
    console.log('cmap table info didnt find');
    process.exit(0);
  }

  setCursor(cmapTableInfo.offset);

  interface EncodingRecord {
    platformID: number;
    encodingID: number;
    offset: number;
  }

  const cmap = {
    version: readUShort(),
    numTables: readUShort(),
    encodingRecords: [] as Array<EncodingRecord>,
    glyphIndexMap: {},
  };

  if (cmap.version !== 0) {
    console.log(`for now support only cmap version 0 but got ${cmap.version}`);
    process.exit(0);
  }

  for (let i = 0; i < cmap.numTables; i++) {
    cmap.encodingRecords.push({
      platformID: readUShort(),
      encodingID: readUShort(),
      offset: readUWord(),
    });
  }

  console.log(cmap);

  let selectedOffset = -1;
  for (let i = 0; i < cmap.numTables; i++) {
    const { platformID, encodingID, offset } = (cmap.encodingRecords[i] as EncodingRecord);
    const isWindowsPlatform =
      platformID === 3 &&
      (encodingID === 0 || encodingID === 1 || encodingID === 10);

    const isUnicodePlatform =
      platformID === 0 &&
      (encodingID === 0 ||
        encodingID === 1 ||
        encodingID === 2 ||
        encodingID === 3 ||
        encodingID === 4);

    if (isWindowsPlatform || isUnicodePlatform) {
      selectedOffset = offset;
      break;
    }
  }

  if (selectedOffset === -1) {
    console.log('Only support unicode and window platforms fonts encoding');
    process.exit(0);
  }

  console.log(selectedOffset);

  setCursor(cmapTableInfo.offset + selectedOffset);

  // advanceCursor(selectedOffset);

  const format = readUShort();

  console.log('format', format);

  if (selectedOffset === -1) {
    console.log('Only support fortma 4');
    process.exit(0);
  }

  const format4 = {
    format: format,
    length: readUShort(),
    language: readUShort(),
    segCountX2: readUShort(),
    searchRange: readUShort(),
    entrySelector: readUShort(),
    rangeShift: readUShort(),
    endCode: [] as Array<number>,
    startCode: [] as Array<number>,
    idDelta: [] as Array<number>,
    idRangeOffset: [] as Array<number>,
    glyphIndexMap: {} as Record<string, number>, // This one is my addition, contains final unicode->index mapping
  };

  const segCount = format4.segCountX2 >>> 1;

  for (let i = 0; i < segCount; i++) {
    format4.endCode.push(readUShort());
  }

  readUShort(); // Reserved pad.

  for (let i = 0; i < segCount; i++) {
    format4.startCode.push(readUShort());
  }

  for (let i = 0; i < segCount; i++) {
    format4.idDelta.push(readShort());
  }

  const idRangeOffsetsStart = position;

  for (let i = 0; i < segCount; i++) {
    format4.idRangeOffset.push(readUShort());
  }

  for (let i = 0; i < segCount - 1; i++) {
    let glyphIndex = 0;
    const endCode = format4.endCode[i] as number;
    const startCode = format4.startCode[i] as number;
    const idDelta = format4.idDelta[i] as number;
    const idRangeOffset = format4.idRangeOffset[i] as number;

    for (let c = startCode; c < endCode; c++) {
      if (idRangeOffset !== 0) {
        const startCodeOffset = (c - startCode) * 2;
        const currentRangeOffset = i * 2; // 2 because the numbers are 2 byte big. pointer arifmitic

        let glyphIndexOffset =
          idRangeOffset + // offset between the id range table and the glyphIdArray[]
          startCodeOffset + // gets us finally to the character
          (idRangeOffsetsStart + // where all offsets started
          currentRangeOffset); // offset for the current range

        setCursor(glyphIndexOffset);
        glyphIndex = readUShort();

        if (glyphIndex !== 0) {
          // & 0xffff is modulo 65536.
          glyphIndex = (glyphIndex + idDelta) & 0xffff;
        }
      } else {
        glyphIndex = (c + idDelta) & 0xffff;
      }

      format4.glyphIndexMap[c] = glyphIndex;
    }
  }

  interface TTF {
    glyphIndexMap: Record<string, number>;
    glyf: Glyph[];
    hmtx: typeof hmtx;
  }

  const spacing = (ttf: TTF) => {
    const alphabet =
      ' !"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~';

    const map: Record<string, CharInfo> = {};
    alphabet.split('').forEach(char => {
      const index = ttf.glyphIndexMap[char.codePointAt(0) || 0] || 0;
      const glyf = ttf.glyf[index] as Glyph;
      const hmtx = ttf.hmtx.hMetrics[index] as TTF['hmtx']['hMetrics'][number];

      // console.log('char', char, hmtx);

      map[char] = {
        x: glyf.xMin,
        y: glyf.yMin,
        width: glyf.xMax - glyf.xMin,
        height: glyf.yMax - glyf.yMin,
        lsb: hmtx.leftSideBearing,
        rsb: hmtx.advanceWidth - hmtx.leftSideBearing - (glyf.xMax - glyf.xMin),
      };
    });

    return map;
  };

  const scale = (fontSizeInPixels: number) => (1 / unitsPerEm) * fontSizeInPixels;

  const charInfo = spacing({ glyphIndexMap: format4.glyphIndexMap, glyf: glyfs, hmtx });

  console.log(charInfo);

  return { charInfo, scale };
}
