export const CHART_TEXT_COLOR = '#e2e8f0';
export const CHART_AXIS_COLOR = '#1e293b';
export const CHART_SPLIT_COLOR = 'rgba(30, 41, 59, 0.6)';

export function baseGrid() {
  return { left: 48, right: 18, top: 26, bottom: 30 };
}

export function categoryAxis(data: string[]) {
  return {
    type: 'category',
    data,
    boundaryGap: true,
    axisLine: { lineStyle: { color: CHART_AXIS_COLOR } },
    axisLabel: { color: CHART_TEXT_COLOR, fontSize: 10 },
  };
}

export function valueAxis() {
  return {
    type: 'value',
    scale: true,
    axisLine: { lineStyle: { color: CHART_AXIS_COLOR } },
    axisLabel: { color: CHART_TEXT_COLOR, fontSize: 10 },
    splitLine: { lineStyle: { color: CHART_SPLIT_COLOR } },
  };
}

export function darkTooltip() {
  return {
    trigger: 'axis',
    backgroundColor: '#0f172a',
    borderColor: '#1e293b',
    textStyle: { color: CHART_TEXT_COLOR },
  };
}
