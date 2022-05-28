export class RenderStat {
  public flushedSqures: number;
  public flushedCircles: number;

  constructor () {
    this.flushedSqures = 0;
    this.flushedCircles = 0;
  }

  clear () {
    this.flushedSqures = 0;
    this.flushedCircles = 0;
  }
}
