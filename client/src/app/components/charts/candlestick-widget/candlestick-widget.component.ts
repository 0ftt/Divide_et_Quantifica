import { Component } from '@angular/core';
import { ChartFrameComponent } from '../chart-frame/chart-frame.component';
import { ChartWidgetBase } from '../chart-widget-base';
import { candleDates } from '$core/charts/chart-data';
import { PRICE_COLORS } from '$core/charts/chart-palette';
import { baseGrid, categoryAxis, valueAxis, darkTooltip } from '$core/charts/chart-theme';

@Component({
  selector: 'app-candlestick-widget',
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
export class CandlestickWidgetComponent extends ChartWidgetBase {

  protected override buildOption(tickers: string[]): unknown {
    const ticker = tickers[0];
    const candles = this.candlesFor(ticker);
    const data = candles.map((c) => [c.open, c.close, c.low, c.high]);
    return {
      grid: baseGrid(),
      tooltip: darkTooltip(),
      xAxis: categoryAxis(candleDates(candles)),
      yAxis: valueAxis(),
      series: [
        {
          type: 'candlestick',
          name: ticker,
          data,
          itemStyle: {
            color: PRICE_COLORS.up,
            color0: PRICE_COLORS.down,
            borderColor: PRICE_COLORS.up,
            borderColor0: PRICE_COLORS.down,
          },
        },
      ],
    };
  }
}
