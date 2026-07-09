import { Injectable } from '@angular/core';
import { WidgetData, isChartWidget } from '$core/models/widget.model';

function hashSeed(text: string): number {
  let h = 0;
  for (let i = 0; i < text.length; i++) {
    h = (h * 31 + text.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export interface ConnectionLine {
  id: string;
  pathD: string;
  boatDelay: string;
  duckDelay: string;
}

export interface LinkResult {
  ok: boolean;
  reason?: string;
}

@Injectable({ providedIn: 'root' })
export class WidgetService {

  selectedWidget: WidgetData | null = null;

  linkingSourceId: string | null = null;

  pendingStockTicker: string | null = null;

  selectWidget(widget: WidgetData): void {
    this.selectedWidget = widget;
  }

  deselectWidget(): void {
    this.selectedWidget = null;
  }

  isLinking(): boolean {
    return this.linkingSourceId !== null;
  }

  startLinking(sourceId: string): void {
    this.linkingSourceId = sourceId;
  }

  cancelLinking(): void {
    this.linkingSourceId = null;
  }

    private resolvePair(
    a: WidgetData,
    b: WidgetData,
  ): { consumer: WidgetData; source: WidgetData } | null {

    const isConsumer = (w: WidgetData) =>
      w.type === 'connectionHub' ||
      w.type === 'average' ||
      w.type === 'net' ||
      isChartWidget(w);
    const isSource = (w: WidgetData) =>
      w.type === 'stockInfo' ||
      w.type === 'unlistedStock' ||
      w.type === 'inventory';

    if (isConsumer(a) && isSource(b)) {
      return { consumer: a, source: b };
    }
    if (isConsumer(b) && isSource(a)) {
      return { consumer: b, source: a };
    }

    const forwardsBundle = (w: WidgetData) => w.type === 'connectionHub' || isChartWidget(w);
    const aggregatesBundle = (w: WidgetData) =>
      isChartWidget(w) || w.type === 'average' || w.type === 'net';
    if (aggregatesBundle(a) && forwardsBundle(b) && a.id !== b.id) {
      return { consumer: a, source: b };
    }
    if (aggregatesBundle(b) && forwardsBundle(a) && a.id !== b.id) {
      return { consumer: b, source: a };
    }
    return null;
  }

  canConnect(a: WidgetData, b: WidgetData): boolean {
    if (a.id === b.id) {
      return false;
    }
    const pair = this.resolvePair(a, b);
    if (!pair) {
      return false;
    }
    return !pair.consumer.connectedIDs?.includes(pair.source.id);
  }

    completeLinking(target: WidgetData, widgets: WidgetData[]): LinkResult {
    const source = widgets.find((w) => w.id === this.linkingSourceId);
    this.linkingSourceId = null;

    if (!source) {
      return { ok: false, reason: 'link.sourceNotFound' };
    }
    if (source.id === target.id) {
      return { ok: false, reason: 'link.self' };
    }

    const pair = this.resolvePair(source, target);
    if (!pair) {
      return { ok: false, reason: 'link.invalidPair' };
    }
    if (pair.consumer.connectedIDs?.includes(pair.source.id)) {
      return { ok: false, reason: 'link.duplicate' };
    }

    pair.consumer.connectedIDs = pair.consumer.connectedIDs ?? [];
    pair.consumer.connectedIDs.push(pair.source.id);
    return { ok: true };
  }

    calculateConnections(widgets: WidgetData[]): ConnectionLine[] {
    const lines: ConnectionLine[] = [];

    const consumers = widgets.filter(
      (w) =>
        w.type === 'connectionHub' ||
        w.type === 'average' ||
        w.type === 'net' ||
        isChartWidget(w),
    );

    for (const hub of consumers) {
      if (!hub.connectedIDs) {
        continue;
      }

      for (const id of hub.connectedIDs) {
        const source = widgets.find((w) => w.id === id);
        if (!source) {
          continue;
        }

        const ax = source.posX + (source.width || 300) / 2;
        const ay = source.posY + 18;
        const bx = hub.posX + (hub.width || 300) / 2;
        const by = hub.posY + 18;
        const seed = hashSeed(`${hub.id}-${source.id}`);
        lines.push({
          id: `path-${hub.id}-${source.id}`,
          pathD: `M ${ax} ${ay} L ${bx} ${by}`,
          boatDelay: `${((seed % 500) / 100).toFixed(2)}s`,
          duckDelay: `${((seed % 3000) / 100).toFixed(2)}s`,
        });
      }
    }

    return lines;
  }
}
