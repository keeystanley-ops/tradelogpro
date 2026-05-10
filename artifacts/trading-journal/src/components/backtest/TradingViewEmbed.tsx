import React, { useEffect, useRef } from 'react';

declare global {
  interface Window {
    TradingView: any;
  }
}

interface TradingViewEmbedProps {
  symbol: string;
  theme?: 'light' | 'dark';
  autosize?: boolean;
}

export default function TradingViewEmbed({ symbol, theme = 'dark', autosize = true }: TradingViewEmbedProps) {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // We append the script only once
    if (!document.getElementById('tradingview-widget-script')) {
      const script = document.createElement('script');
      script.id = 'tradingview-widget-script';
      script.src = 'https://s3.tradingview.com/tv.js';
      script.async = true;
      script.onload = () => createWidget();
      document.head.appendChild(script);
    } else if (window.TradingView) {
      createWidget();
    }

    function createWidget() {
      if (container.current && window.TradingView) {
        new window.TradingView.widget({
          "autosize": autosize,
          "symbol": symbol.includes(':') ? symbol : `BINANCE:${symbol}`,
          "interval": "D",
          "timezone": "Etc/UTC",
          "theme": theme,
          "style": "1",
          "locale": "en",
          "toolbar_bg": "#f1f3f6",
          "enable_publishing": false,
          "hide_side_toolbar": false,
          "allow_symbol_change": true,
          "container_id": container.current.id,
          "studies": [
            "MASimple@tv-basicstudies",
            "RSI@tv-basicstudies",
            "StochasticRSI@tv-basicstudies"
          ],
        });
      }
    }
  }, [symbol, theme, autosize]);

  return (
    <div className="tradingview-widget-container h-full w-full" ref={container} id={`tv_chart_${Math.random().toString(36).substr(2, 9)}`}>
      <div className="tradingview-widget-container__widget h-full w-full"></div>
    </div>
  );
}
