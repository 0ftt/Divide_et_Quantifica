import { Component } from '@angular/core';
import { ChartFrameComponent } from '../chart-frame/chart-frame.component';
import { ChartWidgetBase } from '../chart-widget-base';
import { candleCloses } from '$core/charts/chart-data';
import { getSeriesColors } from '$core/charts/chart-palette';
import { CHART_TEXT_COLOR } from '$core/charts/chart-theme';

@Component({
  selector: 'app-pie-widget',
  standalone: true,
  imports: [ChartFrameComponent],
  template: `
    <app-chart-frame [widget]="widget" [zoomLevel]="zoomLevel"
                     (remove)="remove.emit($event)"
                     (duplicate)="duplicate.emit($event)"
                     (link)="link.emit($event)">
      <div #host class="chart-host"></div>
    </app-chart-frame>
  `,
  styles: [':host{display:block} .chart-host{width:100%;height:100%}'],
})
export class PieWidgetComponent extends ChartWidgetBase {

  protected override buildOption(tickers: string[]): unknown {
    const colors = getSeriesColors(tickers.length);
    const data = tickers.map((t) => {
      const closes = candleCloses(this.candlesFor(t));
      return { name: t, value: +closes[closes.length - 1].toFixed(2) };
    });
    return {
      color: colors,
      tooltip: {
        trigger: 'item',
        backgroundColor: 'transparent',
        borderColor: '#1e293b',
        textStyle: { color: CHART_TEXT_COLOR },
      },
      legend: { bottom: 0, textStyle: { color: CHART_TEXT_COLOR, fontSize: 10 } },
      series: [
        {
          type: 'pie',
          radius: ['42%', '70%'],
          center: ['50%', '46%'],
          data,
          label: { color: CHART_TEXT_COLOR, fontSize: 10 },
        },
      ],
    };
  }
}
