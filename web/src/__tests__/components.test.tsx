import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { Navigation } from '../components/Navigation';
import { AnalysisViewer } from '../components/AnalysisViewer';
import { DemoBanner } from '../components/DemoBanner';
import { ThemeProvider } from '../context/ThemeContext';
import { ExplainProvider } from '../context/ExplainContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

describe('UI Instrument Components Suite', () => {
  it('renders Navigation brand and nav links correctly', () => {
    const handleRouteChange = vi.fn();
    render(
      <ThemeProvider>
        <ExplainProvider>
          <Navigation
            currentRoute="overview"
            onRouteChange={handleRouteChange}
            onOpenCommandPalette={vi.fn()}
            onStartTour={vi.fn()}
          />
        </ExplainProvider>
      </ThemeProvider>
    );

    expect(screen.getByText('VISION-STUDIO')).toBeDefined();
    expect(screen.getAllByText('Overview').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Analyze').length).toBeGreaterThan(0);
    expect(screen.getAllByText('History').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Model Lab').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Survey Map').length).toBeGreaterThan(0);
  });

  it('renders DemoBanner when demoCount > 0 and handles clear action', () => {
    const handleClear = vi.fn();
    render(
      <QueryClientProvider client={queryClient}>
        <DemoBanner demoCount={42} onClearDemo={handleClear} />
      </QueryClientProvider>
    );

    expect(screen.getByText(/SIMULATION \/ DEMO DATA ACTIVE/i)).toBeDefined();
    expect(screen.getByText(/42 synthetic and benchmark demonstration records/i)).toBeDefined();
  });

  it('renders AnalysisViewer with target counts and confidence controls', () => {
    const mockDetections = [
      {
        class_id: 2,
        class_name: 'plastic_bag',
        confidence: 0.85,
        bbox: { x: 50, y: 60, w: 100, h: 80 }
      },
      {
        class_id: 14,
        class_name: 'tin_can',
        confidence: 0.45,
        bbox: { x: 200, y: 150, w: 40, h: 50 }
      }
    ];

    render(
      <AnalysisViewer
        detections={mockDetections}
        modelName="YOLO11n TrashCan Finalist"
        depthMeters={2450}
        imageWidth={640}
        imageHeight={480}
      />
    );

    expect(screen.getByText(/YOLO11n TrashCan Finalist/i)).toBeDefined();
    expect(screen.getByText('plastic_bag')).toBeDefined();
    expect(screen.getByText('tin_can')).toBeDefined();
    expect(screen.getByText(/DEPTH: -2450.0 m/i)).toBeDefined();
  });
});
