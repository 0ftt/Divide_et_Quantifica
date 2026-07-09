import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import * as echarts from 'echarts';
import { baseGrid, categoryAxis, valueAxis, darkTooltip } from '$core/charts/chart-theme';

export interface HistoryPoint {
  label: string;
  value: number;
}

@Component({
  selector: 'app-mini-history-chart',
  standalone: true,
  template: `<div #host class="mini-history-host"></div>`,
  styles: [':host { display: block; height: 280px; } .mini-history-host { width: 100%; height: 100%; }'],
})
export class MiniHistoryChartComponent implements AfterViewInit, OnChanges, OnDestroy {

  @Input({ required: true }) points: HistoryPoint[] = [];

  @ViewChild('host', { static: false }) host!: ElementRef<HTMLDivElement>;
  private chart?: echarts.ECharts;

  ngAfterViewInit(): void {
    this.chart = echarts.init(this.host.nativeElement, undefined, { renderer: 'canvas' });
    this.render();

    requestAnimationFrame(() => this.chart?.resize());
  }

  ngOnChanges(): void {
    this.render();
  }

  ngOnDestroy(): void {
    this.chart?.dispose();
  }

  private render(): void {
    if (!this.chart) {
      return;
    }
    const labels = this.points.map((p) => p.label);
    const values = this.points.map((p) => p.value);
    this.chart.setOption(
      {
        grid: { ...baseGrid(), top: 16 },
        tooltip: darkTooltip(),
        xAxis: categoryAxis(labels),
        yAxis: valueAxis(),
        series: [
          {
            type: 'line',
            data: values,
            smooth: true,
            showSymbol: false,
            lineStyle: { color: '#00f2fe', width: 2 },
            areaStyle: { color: 'rgba(0, 242, 254, 0.12)' },
          },
        ],
      } as echarts.EChartsOption,
      true,
    );
  }
}
