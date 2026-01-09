// useMatches Hook Tests
import { renderHook, waitFor } from '@testing-library/react-native';
import { useMatches } from '../../hooks/useMatches';
import api from '../../services/api';

// Mock API
jest.mock('../../services/api');
jest.mock('../../hooks/useFavoriteTeams', () => ({
  useFavoriteTeams: () => ({
    favoriteTeams: [
      { id: 1, name: 'Galatasaray', logo: '' },
      { id: 2, name: 'Fenerbahce', logo: '' },
    ],
    loading: false,
  }),
}));

describe('useMatches', () => {
  const mockMatches = [
    {
      fixture: { id: 1, date: '2026-01-08', timestamp: 1704672000, status: { short: 'NS', long: 'Not Started', elapsed: null } },
      league: { id: 1, name: 'Süper Lig', country: 'Turkey', logo: '' },
      teams: {
        home: { id: 1, name: 'Galatasaray', logo: '' },
        away: { id: 2, name: 'Fenerbahce', logo: '' },
      },
      goals: { home: null, away: null },
      score: {
        halftime: { home: null, away: null },
        fulltime: { home: null, away: null },
      },
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches matches successfully', async () => {
    (api.matches.getMatchesByDate as jest.Mock).mockResolvedValue({
      success: true,
      data: mockMatches,
    });
    (api.matches.getLiveMatches as jest.Mock).mockResolvedValue({
      success: true,
      data: [],
    });

    const { result } = renderHook(() => useMatches());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.matches).toHaveLength(1);
    expect(result.current.error).toBeNull();
  });

  it('handles API errors gracefully', async () => {
    (api.matches.getMatchesByDate as jest.Mock).mockRejectedValue(
      new Error('Network error')
    );
    (api.matches.getLiveMatches as jest.Mock).mockRejectedValue(
      new Error('Network error')
    );

    const { result } = renderHook(() => useMatches());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.matches).toHaveLength(0);
  });

  it('filters matches by favorite teams', async () => {
    const allMatches = [
      ...mockMatches,
      {
        ...mockMatches[0],
        fixture: { ...mockMatches[0].fixture, id: 2 },
        teams: {
          home: { id: 3, name: 'Besiktas', logo: '' },
          away: { id: 4, name: 'Trabzonspor', logo: '' },
        },
      },
    ];

    (api.matches.getMatchesByDate as jest.Mock).mockResolvedValue({
      success: true,
      data: allMatches,
    });
    (api.matches.getLiveMatches as jest.Mock).mockResolvedValue({
      success: true,
      data: [],
    });

    const { result } = renderHook(() => useMatches(undefined, true));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Should only return matches with favorite teams
    expect(result.current.matches).toHaveLength(1);
    expect(result.current.matches[0].teams.home.name).toBe('Galatasaray');
  });
});
