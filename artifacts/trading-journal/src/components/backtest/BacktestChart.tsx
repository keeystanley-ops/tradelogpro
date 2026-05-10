import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { createChart, IChartApi, ISeriesApi, CandlestickData, Time, CandlestickSeries, createSeriesMarkers } from 'lightweight-charts';

interface BacktestChartProps {
  data: CandlestickData[];
  onVisibleLogicalRangeChange?: (range: any) => void;
  markers?: any[];
}

export interface BacktestChartHandle {
  addMarker: (marker: any) => void;
  clearMarkers: () => void;
  updateData: (data: CandlestickData[]) => void;
  scrollToTime: (time: Time) => void;
}

const BacktestChart = forwardRef<BacktestChartHandle, BacktestChartProps>(({ data, markers = [] }, ref) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const markersRef = useRef<any>(null);

  useImperativeHandle(ref, () => ({
    addMarker: (marker: any) => {
      if (markersRef.current) {
        const currentMarkers = markersRef.current.markers() || [];
        markersRef.current.setMarkers([...currentMarkers, marker]);
      }
    },
    clearMarkers: () => {
      if (markersRef.current) {
        markersRef.current.setMarkers([]);
      }
    },
    updateData: (newData: CandlestickData[]) => {
      if (seriesRef.current) {
        seriesRef.current.setData(newData);
      }
    },
    scrollToTime: (time: Time) => {
        if (chartRef.current) {
            chartRef.current.timeScale().scrollToPosition(0, true);
        }
    }
  }));

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { color: 'transparent' },
        textColor: '#9CA3AF',
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.05)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.05)' },
      },
      crosshair: {
        mode: 0,
        vertLine: { 
            color: '#7C3AED', 
            width: 1, 
            style: 2,
            labelBackgroundColor: '#7C3AED'
        },
        horzLine: { 
            color: '#7C3AED', 
            width: 1, 
            style: 2,
            labelBackgroundColor: '#7C3AED'
        },
      },
      timeScale: {
        borderColor: 'rgba(255, 255, 255, 0.1)',
        timeVisible: true,
        secondsVisible: false,
      },
      rightPriceScale: {
        borderColor: 'rgba(255, 255, 255, 0.1)',
      },
    });

    // v5 Series Initialization
    const series = chart.addSeries(CandlestickSeries, {
      upColor: '#10B981',
      downColor: '#EF4444',
      borderVisible: false,
      wickUpColor: '#10B981',
      wickDownColor: '#EF4444',
    });

    series.setData(data);
    
    // v5 Markers Initialization (Markers are now a plugin)
    const markersPlugin = createSeriesMarkers(series);
    markersPlugin.setMarkers(markers);

    chartRef.current = chart;
    seriesRef.current = series as any;
    markersRef.current = markersPlugin;

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ 
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight 
        });
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, []);

  // Update data when it changes
  useEffect(() => {
    if (seriesRef.current) {
      seriesRef.current.setData(data);
    }
  }, [data]);

  // Update markers when they change
  useEffect(() => {
    if (markersRef.current) {
      markersRef.current.setMarkers(markers);
    }
  }, [markers]);

  return <div ref={chartContainerRef} className="w-full h-full min-h-[500px]" />;
});

export default BacktestChart;
