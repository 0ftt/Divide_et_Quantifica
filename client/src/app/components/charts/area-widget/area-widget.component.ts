import { Component } from '@angular/core';
import { ChartFrameComponent } from '../chart-frame/chart-frame.component';
import { ChartWidgetBase } from '../chart-widget-base';
import { candleDates, candleCloses } from '$core/charts/chart-data';
import { getSeriesColors } from '$core/charts/chart-palette';
import { baseGrid, categoryAxis, valueAxis, darkTooltip, CHART_TEXT_COLOR } from '$core/charts/chart-theme';

@Component({
  selector: 'app-area-widget',
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
export class AreaWidgetComponent extends ChartWidgetBase {
  protected override buildOption(tickers: string[]): unknown {
    const colors = getSeriesColors(tickers.length);
    const dates = candleDates(this.candlesFor(tickers[0]));
    const series = tickers.map((t, i) => ({
      type: 'line',
      name: t,
      smooth: true,
      showSymbol: false,
      data: candleCloses(this.candlesFor(t)),
      lineStyle: { color: colors[i], width: 2 },
      itemStyle: { color: colors[i] },
      areaStyle: { color: colors[i], opacity: 0.22 },
    }));
    return {
      grid: { ...baseGrid(), top: 34 },
      tooltip: darkTooltip(),
      legend: { top: 4, textStyle: { color: CHART_TEXT_COLOR, fontSize: 9 } },
      xAxis: categoryAxis(dates),
      yAxis: valueAxis(),
      series,
    };
  }
}
