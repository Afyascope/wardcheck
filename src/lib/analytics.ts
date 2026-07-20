import ReactGA from "react-ga4";

const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;

export function initializeAnalytics() {
  if (!measurementId) return;

  ReactGA.initialize(measurementId);
}

export function trackPageView(path: string) {
  if (!measurementId) return;

  ReactGA.send({
    hitType: "pageview",
    page: path,
  });
}

export function trackEvent(name: string, params?: Record<string, unknown>) {
  if (!measurementId) return;

  ReactGA.event(name, params);
}