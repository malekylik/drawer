import { FontMeta } from '../render/renderer';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function createSDGVisializer(glyph: FontMeta['glyphs'][number], atlasWidth: number, arr: Uint8Array | Int8Array, customize = (e: HTMLSpanElement, v?: number) => {}) {
  const bottom = ((glyph?.atlasBounds.bottom ?? 0) | 0) - 1;
  const top = (glyph?.atlasBounds.top ?? 0) | 0;
  const left = (glyph?.atlasBounds.left ?? 0) | 0;
  const right = Math.ceil(glyph?.atlasBounds.right ?? 0) | 0;
  const rowSize = right - left;
  const rowCount = top - bottom;

  const wrapper = document.createElement('div');

  wrapper.style.border = '1px solid black';

  const rows = [];

  for (let j = 0; j < rowCount; j++) {
    const row = document.createElement('div');
    row.classList.add('length-row-visualizer');

    for (let i = 0; i < rowSize; i++) {
      const cell = document.createElement('span');
      cell.style.display = 'inline-flex';
      cell.style.border = '1px solid black';
      cell.style.width = '40px';
      cell.style.height = '40px';
      cell.style.justifyContent = 'center';
      cell.style.alignItems = 'center';

      row.append(cell);
    }

    wrapper.append(row);
    rows.push(row);
  }

  for (let j = top; j > top - rowCount; j--) {
    for (let i = left; i < left + rowSize; i++) {
      // console.log(i - left, top - j);
      const cell = (rows[top - j] as HTMLDivElement).children[i - left];

      if (cell) {
        customize(cell as HTMLSpanElement, arr[j * atlasWidth + i]);
        cell.innerHTML = String(arr[j * atlasWidth + i] ?? 999);
      }
    }
  }

  document.body.append(wrapper);
}
