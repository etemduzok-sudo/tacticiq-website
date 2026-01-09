// MatchCard Component Tests
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { MatchCard } from '../../components/MatchCard';

describe('MatchCard', () => {
  const mockMatch = {
    id: '1',
    status: 'live' as const,
    homeTeam: {
      name: 'Galatasaray',
      logo: '🦁',
      score: 2,
    },
    awayTeam: {
      name: 'Fenerbahçe',
      logo: '🐤',
      score: 1,
    },
    league: 'Süper Lig',
    date: '8 Oca 2026',
    time: '20:00',
    minute: 67,
  };

  it('renders match information correctly', () => {
    const { getByText } = render(
      <MatchCard match={mockMatch} onPress={() => {}} />
    );

    expect(getByText('Galatasaray')).toBeTruthy();
    expect(getByText('Fenerbahçe')).toBeTruthy();
    expect(getByText('Süper Lig')).toBeTruthy();
  });

  it('shows live indicator for live matches', () => {
    const { getByText } = render(
      <MatchCard match={mockMatch} onPress={() => {}} />
    );

    expect(getByText(/CANLI|67'/)).toBeTruthy();
  });

  it('calls onPress when card is pressed', () => {
    const onPressMock = jest.fn();
    const { getByTestId } = render(
      <MatchCard match={mockMatch} onPress={onPressMock} testID="match-card" />
    );

    fireEvent.press(getByTestId('match-card'));
    expect(onPressMock).toHaveBeenCalledWith(mockMatch);
  });

  it('shows correct score', () => {
    const { getByText } = render(
      <MatchCard match={mockMatch} onPress={() => {}} />
    );

    expect(getByText('2')).toBeTruthy();
    expect(getByText('1')).toBeTruthy();
  });

  it('renders upcoming match without score', () => {
    const upcomingMatch = {
      ...mockMatch,
      status: 'upcoming' as const,
      homeTeam: { ...mockMatch.homeTeam, score: undefined },
      awayTeam: { ...mockMatch.awayTeam, score: undefined },
    };

    const { queryByText } = render(
      <MatchCard match={upcomingMatch} onPress={() => {}} />
    );

    expect(queryByText('2')).toBeNull();
    expect(queryByText('1')).toBeNull();
  });
});
