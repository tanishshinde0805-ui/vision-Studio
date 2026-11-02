import React, { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './api';
import { AnalysisRecord } from './types';
import { Navigation } from './components/Navigation';
import { DemoBanner } from './components/DemoBanner';
import { CommandPalette } from './components/CommandPalette';
import { TourOverlay } from './components/TourOverlay';

// Pages
import { Overview } from './pages/Overview';
import { Analyze } from './pages/Analyze';
import { History } from './pages/History';
import { AnalysisDetail } from './pages/AnalysisDetail';
import { ModelLab } from './pages/ModelLab';
import { MapView } from './pages/MapView';
import { HowItWorks } from './pages/HowItWorks';
import { Settings } from './pages/Settings';

export const App: React.FC = () => {
  const queryClient = useQueryClient();
  const [currentRoute, setCurrentRoute] = useState<string>('overview');
  const [selectedAnalysisId, setSelectedAnalysisId] = useState<string | null>(null);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);
  const [isTourOpen, setIsTourOpen] = useState<boolean>(false);

  // Keyboard shortcut Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((open) => !open);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Fetch Health
  const { data: health } = useQuery({
    queryKey: ['health'],
    queryFn: () => api.getHealth(),
    refetchInterval: 30000,
  });

  // Fetch Stats
  const { data: stats } = useQuery({
    queryKey: ['stats'],
    queryFn: () => api.getStats(true),
  });

  // Fetch Analyses History
  const { data: rawAnalyses = [], refetch: refetchAnalyses } = useQuery({
    queryKey: ['analyses'],
    queryFn: () => api.getAnalyses({ limit: 100, include_demo: true }),
  });

  const analyses: AnalysisRecord[] = Array.isArray(rawAnalyses)
    ? rawAnalyses
    : (rawAnalyses && Array.isArray((rawAnalyses as any).items))
      ? (rawAnalyses as any).items
      : [];

  // Check demo count
  const demoCount = analyses.filter((a) => a.demo || a.source === 'demo').length;

  // Clear demo mutation
  const clearDemoMutation = useMutation({
    mutationFn: () => api.clearDemoData(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analyses'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });

  // Delete single analysis mutation
  const deleteAnalysisMutation = useMutation({
    mutationFn: (id: string) => api.deleteAnalysis(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analyses'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });

  const handleSelectAnalysis = (id: string) => {
    setSelectedAnalysisId(id);
    setCurrentRoute('detail');
  };

  const handleNavigate = (route: string) => {
    if (route !== 'detail') {
      setSelectedAnalysisId(null);
    }
    setCurrentRoute(route);
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        backgroundColor: 'var(--bg-app)',
        color: 'var(--text-primary)',
      }}
    >
      {/* Top Header & Navigation */}
      <Navigation
        currentRoute={currentRoute}
        onRouteChange={handleNavigate}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onStartTour={() => setIsTourOpen(true)}
        systemStatus={health?.status || 'online'}
        demoCount={demoCount}
      />


      {/* Main Content Area */}
      <main
        style={{
          flex: 1,
          maxWidth: '1440px',
          width: '100%',
          margin: '0 auto',
          padding: 'var(--space-6) var(--space-4)',
        }}
      >
        {currentRoute === 'overview' && (
          <Overview
            stats={stats}
            analyses={analyses}
            onSelectAnalysis={handleSelectAnalysis}
            onNavigate={handleNavigate}
          />
        )}

        {currentRoute === 'analyze' && (
          <Analyze
            onAnalysisCreated={(record) => {
              refetchAnalyses();
              handleSelectAnalysis(record.id);
            }}
            onSelectAnalysis={handleSelectAnalysis}
          />
        )}

        {currentRoute === 'history' && (
          <History
            analyses={analyses}
            onSelectAnalysis={handleSelectAnalysis}
            onDeleteAnalysis={(id) => deleteAnalysisMutation.mutate(id)}
            onClearDemoData={() => clearDemoMutation.mutate()}
          />
        )}

        {currentRoute === 'detail' && selectedAnalysisId && (
          <AnalysisDetail
            analysisId={selectedAnalysisId}
            onBack={() => setCurrentRoute('history')}
          />
        )}

        {currentRoute === 'model-lab' && <ModelLab />}

        {currentRoute === 'map' && (
          <MapView
            analyses={analyses}
            onSelectAnalysis={handleSelectAnalysis}
          />
        )}

        {currentRoute === 'how-it-works' && <HowItWorks />}

        {currentRoute === 'settings' && (
          <Settings
            onRefreshData={() => {
              refetchAnalyses();
              queryClient.invalidateQueries({ queryKey: ['stats'] });
            }}
          />
        )}
      </main>

      {/* Global Command Palette (Ctrl+K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigate={handleNavigate}
        analyses={analyses}
        onSelectAnalysis={handleSelectAnalysis}
      />

      {/* Interactive Tour Overlay */}
      <TourOverlay
        isOpen={isTourOpen}
        onClose={() => setIsTourOpen(false)}
      />
    </div>
  );
};
