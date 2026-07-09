import { Component } from '@angular/core';
import { ChartFrameComponent } from '../chart-frame/chart-frame.component';
import { ChartWidgetBase } from '../chart-widget-base';
import { candleDates, candleVolumes } from '$core/charts/chart-data';
import { getSeriesColors } from '$core/charts/chart-palette';
import { baseGrid, categoryAxis, valueAxis, darkTooltip, CHART_TEXT_COLOR } from '$core/charts/chart-theme';

@Component({
  selector: 'app-bar-widget',
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
export class BarWidgetComponent extends ChartWidgetBase {

  protected override buildOption(tickers: string[]): unknown {
    const colors = getSeriesColors(tickers.length);
    const dates = candleDates(this.candlesFor(tickers[0]));
    const series = tickers.map((t, i) => ({
      type: 'bar',
      name: t,
      data: candleVolumes(this.candlesFor(t)),
      itemStyle: { color: colors[i], borderRadius: [2, 2, 0, 0] },
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
