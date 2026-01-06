import { useState } from "react";

interface MatchPredictionProps {
  matchData: any;
}

// Mock data for 4-3-3 formation
const mockFormation = {
  id: "4-3-3",
  name: "4-3-3 (Atak)",
  positions: ["GK", "LB", "CB", "CB", "RB", "CM", "CM", "CM", "LW", "ST", "RW"],
};

const mockPlayers = [
  { id: 1, name: "Muslera", position: "GK", rating: 85, number: 1, stats: { pace: 45, shooting: 30, passing: 65, dribbling: 40 }, form: 92 },
  { id: 5, name: "Kazımcan", position: "LB", rating: 78, number: 5, stats: { pace: 82, shooting: 60, passing: 75, dribbling: 78 }, form: 78 },
  { id: 3, name: "Nelsson", position: "CB", rating: 80, number: 3, stats: { pace: 65, shooting: 40, passing: 70, dribbling: 55 }, form: 85 },
  { id: 4, name: "Abdülkerim", position: "CB", rating: 79, number: 4, stats: { pace: 70, shooting: 45, passing: 72, dribbling: 60 }, form: 82 },
  { id: 2, name: "Dubois", position: "RB", rating: 82, number: 2, stats: { pace: 85, shooting: 65, passing: 78, dribbling: 75 }, form: 80 },
  { id: 12, name: "Oliveira", position: "CM", rating: 77, number: 8, stats: { pace: 72, shooting: 70, passing: 80, dribbling: 75 }, form: 76 },
  { id: 7, name: "Sara", position: "CM", rating: 81, number: 20, stats: { pace: 78, shooting: 75, passing: 85, dribbling: 82 }, form: 84 },
  { id: 15, name: "Demirbay", position: "CM", rating: 79, number: 17, stats: { pace: 70, shooting: 78, passing: 84, dribbling: 76 }, form: 85 },
  { id: 8, name: "Zaha", position: "LW", rating: 84, number: 14, stats: { pace: 88, shooting: 82, passing: 78, dribbling: 90 }, form: 88 },
  { id: 11, name: "Icardi", position: "ST", rating: 85, number: 9, stats: { pace: 78, shooting: 92, passing: 75, dribbling: 82 }, form: 88 },
  { id: 10, name: "Barış Alper", position: "RW", rating: 80, number: 7, stats: { pace: 86, shooting: 78, passing: 75, dribbling: 84 }, form: 82 },
];

// Yedek oyuncular
const substitutePlayers = [
  { id: 101, name: "Günay", position: "GK", rating: 72, number: 25 },
  { id: 102, name: "Boey", position: "RB", rating: 76, number: 93 },
  { id: 103, name: "Sanchez", position: "CB", rating: 78, number: 6 },
  { id: 104, name: "Torreira", position: "CM", rating: 79, number: 34 },
  { id: 105, name: "Mertens", position: "CAM", rating: 80, number: 10 },
  { id: 106, name: "Tetê", position: "RW", rating: 77, number: 11 },
  { id: 107, name: "Batshuayi", position: "ST", rating: 78, number: 23 },
];

const mockPositions = [
  { x: 50, y: 88 }, // GK
  { x: 12, y: 70 }, { x: 37, y: 72 }, { x: 63, y: 72 }, { x: 88, y: 70 }, // Defense
  { x: 30, y: 50 }, { x: 50, y: 48 }, { x: 70, y: 50 }, // Midfield
  { x: 15, y: 20 }, { x: 50, y: 15 }, { x: 85, y: 20 }, // Attack
];

export function MatchPrediction({ matchData }: MatchPredictionProps) {
  const [predictions, setPredictions] = useState({
    firstHalfHomeScore: null as number | null,
    firstHalfAwayScore: null as number | null,
    firstHalfInjuryTime: null as string | null,
    secondHalfHomeScore: null as number | null,
    secondHalfAwayScore: null as number | null,
    secondHalfInjuryTime: null as string | null,
    totalGoals: null as string | null,
    yellowCards: null as string | null,
    redCards: null as string | null,
    possession: null as string | null,
    totalShots: null as string | null,
    shotsOnTarget: null as string | null,
    totalCorners: null as string | null,
    tempo: null as string | null,
    scenario: null as string | null,
    firstGoalTime: null as string | null,
  });

  const [selectedPlayer, setSelectedPlayer] = useState<typeof mockPlayers[0] | null>(null);
  const [playerPredictions, setPlayerPredictions] = useState<{[key: number]: any}>({});
  const [showSubstituteDropdown, setShowSubstituteDropdown] = useState(false);
  const [showInjurySubstituteDropdown, setShowInjurySubstituteDropdown] = useState(false);

  const handlePredictionChange = (category: string, value: string) => {
    setPredictions(prev => ({
      ...prev,
      [category]: prev[category as keyof typeof prev] === value ? null : value
    }));
  };

  const handleScoreChange = (category: 'firstHalfHomeScore' | 'firstHalfAwayScore' | 'secondHalfHomeScore' | 'secondHalfAwayScore', value: number) => {
    setPredictions(prev => ({
      ...prev,
      [category]: prev[category] === value ? null : value
    }));
  };

  const handlePlayerPredictionChange = (category: string, value: string | boolean) => {
    if (!selectedPlayer) return;
    
    // Handle substitute player selection
    if (category === 'substitutePlayer' && value) {
      setShowSubstituteDropdown(false);
    }
    
    // Handle injury substitute player selection
    if (category === 'injurySubstitutePlayer' && value) {
      setShowInjurySubstituteDropdown(false);
    }
    
    setPlayerPredictions(prev => ({
      ...prev,
      [selectedPlayer.id]: {
        ...(prev[selectedPlayer.id] || {}),
        [category]: prev[selectedPlayer.id]?.[category] === value ? null : value
      }
    }));
  };

  const currentPlayerPredictions = selectedPlayer ? playerPredictions[selectedPlayer.id] || {} : {};

  return (
    <div className="flex flex-col h-[calc(100vh-52px)] overflow-hidden">
      {/* Player Prediction Modal */}
      {selectedPlayer && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-background w-full max-w-md h-[800px] rounded-t-3xl shadow-2xl animate-slide-up flex flex-col mb-[52px]">
            {/* Header - Compact */}
            <div className="flex-shrink-0 relative bg-gradient-to-br from-slate-800 to-slate-900 p-3 pb-4">
              {/* Close Button */}
              <button
                onClick={() => setSelectedPlayer(null)}
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all"
              >
                <span className="text-white text-lg">×</span>
              </button>

              {/* Player Info Card - Compact */}
              <div className="flex items-center gap-3">
                {/* Player Number Circle */}
                <div className="relative">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#059669] to-[#047857] flex items-center justify-center border-2 border-white/20 shadow-lg">
                    <span className="text-2xl font-black text-white">{selectedPlayer.number}</span>
                  </div>
                  {/* Rating Badge */}
                  <div className="absolute -top-1 -right-1 bg-[#F59E0B] text-slate-900 text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold border border-white shadow-lg">
                    {selectedPlayer.rating}
                  </div>
                </div>

                {/* Player Details */}
                <div className="flex-1">
                  <h2 className="text-lg font-black text-white">{selectedPlayer.name}</h2>
                  <p className="text-xs text-white/70 font-medium">{selectedPlayer.position} • Form: <span className="text-[#F59E0B] font-bold">{selectedPlayer.form}%</span></p>
                </div>
              </div>
            </div>

            {/* Predictions - Scrollable with bottom padding */}
            <div className="flex-1 px-3 py-3 space-y-2 overflow-y-auto pb-20">
              {/* Gol Atar */}
              <div className="space-y-1.5">
                <button
                  onClick={() => handlePlayerPredictionChange('willScore', true)}
                  className={`w-full h-[43px] rounded-xl font-semibold transition-all flex items-center justify-center gap-1.5 text-sm ${
                    currentPlayerPredictions.willScore
                      ? 'bg-[#059669] text-white shadow-lg scale-105'
                      : 'bg-card border border-border text-foreground hover:border-[#059669]'
                  }`}
                >
                  ⚽ Gol Atar
                </button>

                {/* Kaç Gol? - Hierarchical sub-options */}
                <div className="pl-3 space-y-1">
                  <p className="text-[10px] text-slate-500">Kaç gol?</p>
                  <div className="grid grid-cols-3 gap-1.5">
                    {['1', '2', '3+'].map(count => (
                      <button
                        key={count}
                        onClick={() => handlePlayerPredictionChange('goalCount', count)}
                        className={`h-[31px] rounded-lg font-bold transition-all text-sm ${
                          currentPlayerPredictions.goalCount === count
                            ? 'bg-[#059669] text-white shadow-md'
                            : 'bg-slate-800/30 border border-slate-700/50 text-slate-500 hover:text-slate-300 hover:border-slate-600'
                        }`}
                      >
                        {count}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Asist Yapar */}
              <div className="space-y-1.5">
                <button
                  onClick={() => handlePlayerPredictionChange('willAssist', true)}
                  className={`w-full h-[43px] rounded-xl font-semibold transition-all flex items-center justify-center gap-1.5 text-sm ${
                    currentPlayerPredictions.willAssist
                      ? 'bg-[#059669] text-white shadow-lg scale-105'
                      : 'bg-card border border-border text-foreground hover:border-[#059669]'
                  }`}
                >
                  🅰️ Asist Yapar
                </button>

                {/* Kaç Asist? - Hierarchical sub-options */}
                <div className="pl-3 space-y-1">
                  <p className="text-[10px] text-slate-500">Kaç asist?</p>
                  <div className="grid grid-cols-3 gap-1.5">
                    {['1', '2', '3+'].map(count => (
                      <button
                        key={count}
                        onClick={() => handlePlayerPredictionChange('assistCount', count)}
                        className={`h-[31px] rounded-lg font-bold transition-all text-sm ${
                          currentPlayerPredictions.assistCount === count
                            ? 'bg-[#059669] text-white shadow-md'
                            : 'bg-slate-800/30 border border-slate-700/50 text-slate-500 hover:text-slate-300 hover:border-slate-600'
                        }`}
                      >
                        {count}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sarı Kart Görür */}
              <button
                onClick={() => handlePlayerPredictionChange('yellowCard', true)}
                className={`w-full h-[39px] rounded-xl font-medium transition-all flex items-center justify-center gap-1.5 text-sm ${
                  currentPlayerPredictions.yellowCard
                    ? 'bg-[#059669] text-white shadow-lg scale-105'
                    : 'bg-card border border-border text-foreground hover:border-[#059669]'
                }`}
              >
                🟨 Sarı Kart Görür
              </button>

              {/* 2. Sarıdan Kırmızı Görür */}
              <button
                onClick={() => handlePlayerPredictionChange('secondYellowRed', true)}
                className={`w-full h-[39px] rounded-xl font-medium transition-all flex items-center justify-center gap-1.5 text-sm ${
                  currentPlayerPredictions.secondYellowRed
                    ? 'bg-[#059669] text-white shadow-lg scale-105'
                    : 'bg-card border border-border text-foreground hover:border-[#059669]'
                }`}
              >
                🟨🟥 2. Sarıdan Kırmızı Görür
              </button>

              {/* Direkt Kırmızı Kart Görür */}
              <button
                onClick={() => handlePlayerPredictionChange('directRedCard', true)}
                className={`w-full h-[39px] rounded-xl font-medium transition-all flex items-center justify-center gap-1.5 text-sm ${
                  currentPlayerPredictions.directRedCard
                    ? 'bg-[#059669] text-white shadow-lg scale-105'
                    : 'bg-card border border-border text-foreground hover:border-[#059669]'
                }`}
              >
                🟥 Direkt Kırmızı Kart Görür
              </button>

              {/* Oyundan Çıkar */}
              <div className="space-y-1.5">
                <button
                  onClick={() => {
                    handlePlayerPredictionChange('substitutedOut', true);
                    setShowSubstituteDropdown(!showSubstituteDropdown);
                  }}
                  className={`w-full h-[43px] rounded-xl font-semibold transition-all flex items-center justify-center gap-1.5 text-sm ${
                    currentPlayerPredictions.substitutedOut
                      ? 'bg-[#059669] text-white shadow-lg scale-105'
                      : 'bg-card border border-border text-foreground hover:border-[#059669]'
                  }`}
                >
                  🔄 Oyundan Çıkar
                </button>

                {/* Yerine Kim Girer? - Hierarchical sub-section */}
                {showSubstituteDropdown && (
                  <div className="pl-3">
                    <div className="bg-slate-800/20 border border-slate-700/40 rounded-lg p-2">
                      <p className="text-[10px] text-slate-500 mb-1.5">Yerine kim girer?</p>
                      <div className="relative">
                        <select
                          value={currentPlayerPredictions.substitutePlayer || ''}
                          onChange={(e) => handlePlayerPredictionChange('substitutePlayer', e.target.value)}
                          className="w-full h-[31px] rounded-lg bg-slate-700/60 border border-slate-600/50 text-white text-xs px-2.5 pr-7 font-medium focus:outline-none focus:border-[#059669] appearance-none cursor-pointer transition-all hover:bg-slate-700/80"
                        >
                          <option value="" className="bg-slate-800">Oyuncu Seçin</option>
                          {substitutePlayers.map(player => (
                            <option key={player.id} value={player.id} className="bg-slate-800">
                              #{player.number} {player.name} ({player.position}) - {player.rating}
                            </option>
                          ))}
                        </select>
                        {/* Custom dropdown arrow */}
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                          <svg width="8" height="5" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M1 1.5L6 6.5L11 1.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Selected Player Display */}
                {!showSubstituteDropdown && currentPlayerPredictions.substitutePlayer && (
                  <div className="pl-3">
                    <div className="bg-slate-800/20 border border-slate-700/40 rounded-lg p-2">
                      <p className="text-[10px] text-slate-500 mb-1">Yerine giren:</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-white font-medium">
                          {substitutePlayers.find(p => p.id.toString() === currentPlayerPredictions.substitutePlayer)?.name || 'Seçili'}
                        </span>
                        <button
                          onClick={() => setShowSubstituteDropdown(true)}
                          className="text-[10px] text-[#059669] hover:text-[#059669]/80"
                        >
                          Değiştir
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Sakatlanarak Oyundan Çıkar */}
              <div className="space-y-1.5">
                <button
                  onClick={() => {
                    handlePlayerPredictionChange('injuredOut', true);
                    setShowInjurySubstituteDropdown(!showInjurySubstituteDropdown);
                  }}
                  className={`w-full h-[43px] rounded-xl font-semibold transition-all flex items-center justify-center gap-1.5 text-sm ${
                    currentPlayerPredictions.injuredOut
                      ? 'bg-[#059669] text-white shadow-lg scale-105'
                      : 'bg-card border border-border text-foreground hover:border-[#059669]'
                  }`}
                >
                  🚑 Sakatlanarak Oyundan Çıkar
                </button>

                {/* Yerine Kim Girer? - Hierarchical sub-section */}
                {showInjurySubstituteDropdown && (
                  <div className="pl-3">
                    <div className="bg-slate-800/20 border border-slate-700/40 rounded-lg p-2">
                      <p className="text-[10px] text-slate-500 mb-1.5">Yerine kim girer?</p>
                      <div className="relative">
                        <select
                          value={currentPlayerPredictions.injurySubstitutePlayer || ''}
                          onChange={(e) => handlePlayerPredictionChange('injurySubstitutePlayer', e.target.value)}
                          className="w-full h-[31px] rounded-lg bg-slate-700/60 border border-slate-600/50 text-white text-xs px-2.5 pr-7 font-medium focus:outline-none focus:border-[#059669] appearance-none cursor-pointer transition-all hover:bg-slate-700/80"
                        >
                          <option value="" className="bg-slate-800">Oyuncu Seçin</option>
                          {substitutePlayers.map(player => (
                            <option key={player.id} value={player.id} className="bg-slate-800">
                              #{player.number} {player.name} ({player.position}) - {player.rating}
                            </option>
                          ))}
                        </select>
                        {/* Custom dropdown arrow */}
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                          <svg width="8" height="5" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M1 1.5L6 6.5L11 1.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Selected Player Display */}
                {!showInjurySubstituteDropdown && currentPlayerPredictions.injurySubstitutePlayer && (
                  <div className="pl-3">
                    <div className="bg-slate-800/20 border border-slate-700/40 rounded-lg p-2">
                      <p className="text-[10px] text-slate-500 mb-1">Yerine giren:</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-white font-medium">
                          {substitutePlayers.find(p => p.id.toString() === currentPlayerPredictions.injurySubstitutePlayer)?.name || 'Seçili'}
                        </span>
                        <button
                          onClick={() => setShowInjurySubstituteDropdown(true)}
                          className="text-[10px] text-[#059669] hover:text-[#059669]/80"
                        >
                          Değiştir
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Maçın Adamı Olur */}
              <button
                onClick={() => handlePlayerPredictionChange('isMVP', true)}
                className={`w-full h-[39px] rounded-xl font-medium transition-all flex items-center justify-center gap-1.5 text-sm ${
                  currentPlayerPredictions.isMVP
                    ? 'bg-[#F59E0B] text-white shadow-lg scale-105 border-2 border-[#F59E0B]'
                    : 'bg-card border border-border text-foreground hover:border-[#059669]'
                }`}
              >
                👑 Maçın Adamı Olur
              </button>
            </div>

            {/* Bottom Action Button - Fixed Positioned */}
            <div className="flex-shrink-0 p-3 border-t border-border bg-background">
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => setSelectedPlayer(null)}
                  className="w-full h-11 bg-card border border-border hover:bg-slate-800/50 text-foreground rounded-xl font-semibold transition-all text-sm"
                >
                  İptal Et
                </button>
                <button 
                  onClick={() => setSelectedPlayer(null)}
                  className="w-full h-11 bg-[#059669] hover:bg-[#059669]/90 text-white rounded-xl font-semibold transition-all shadow-lg text-sm"
                >
                  Kaydet
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Football Field with Players */}
      <div className="flex-1 px-4 overflow-y-auto flex flex-col min-h-0">
        <div className="relative w-full flex-shrink-0 aspect-[2/3] max-w-3xl mx-auto bg-gradient-to-b from-green-600 via-green-500 to-green-600 shadow-2xl overflow-hidden rounded-lg mb-1">
          {/* FIFA Standard Field Lines */}
          <svg className="absolute inset-0 w-full h-full opacity-30" viewBox="0 0 100 150" preserveAspectRatio="none">
            {/* Outer boundary */}
            <rect x="2" y="2" width="96" height="146" fill="none" stroke="white" strokeWidth="0.5" />
            
            {/* Halfway line */}
            <line x1="2" y1="75" x2="98" y2="75" stroke="white" strokeWidth="0.5" />
            
            {/* Center circle - 9.15m radius */}
            <circle cx="50" cy="75" r="13.5" fill="none" stroke="white" strokeWidth="0.5" />
            <circle cx="50" cy="75" r="1" fill="white" />
            
            {/* Top penalty area: 16.5m depth, 40.32m width */}
            <rect x="20.35" y="2" width="59.3" height="23" fill="none" stroke="white" strokeWidth="0.5" />
            
            {/* Top goal area: 5.5m depth, 18.32m width */}
            <rect x="36.55" y="2" width="26.9" height="7.7" fill="none" stroke="white" strokeWidth="0.5" />
            
            {/* Top penalty spot: 11m from goal line */}
            <circle cx="50" cy="17.3" r="0.8" fill="white" />
            
            {/* Top penalty arc: 9.15m radius from penalty spot, outside penalty area */}
            <circle cx="50" cy="17.3" r="13.5" fill="none" stroke="white" strokeWidth="0.5" clipPath="url(#topPenaltyClip)" />
            
            {/* Bottom penalty area */}
            <rect x="20.35" y="125" width="59.3" height="23" fill="none" stroke="white" strokeWidth="0.5" />
            
            {/* Bottom goal area */}
            <rect x="36.55" y="140.3" width="26.9" height="7.7" fill="none" stroke="white" strokeWidth="0.5" />
            
            {/* Bottom penalty spot */}
            <circle cx="50" cy="132.7" r="0.8" fill="white" />
            
            {/* Bottom penalty arc: 9.15m radius from penalty spot, outside penalty area */}
            <circle cx="50" cy="132.7" r="13.5" fill="none" stroke="white" strokeWidth="0.5" clipPath="url(#bottomPenaltyClip)" />
            
            {/* Corner arcs - 1m radius */}
            <path d="M 2 4.5 A 2.5 2.5 0 0 1 4.5 2" stroke="white" strokeWidth="0.5" fill="none" />
            <path d="M 95.5 2 A 2.5 2.5 0 0 1 98 4.5" stroke="white" strokeWidth="0.5" fill="none" />
            <path d="M 98 145.5 A 2.5 2.5 0 0 1 95.5 148" stroke="white" strokeWidth="0.5" fill="none" />
            <path d="M 4.5 148 A 2.5 2.5 0 0 1 2 145.5" stroke="white" strokeWidth="0.5" fill="none" />
            
            {/* Clip paths for penalty arcs - only show outside penalty area */}
            <defs>
              <clipPath id="topPenaltyClip">
                <rect x="0" y="25" width="100" height="125" />
              </clipPath>
              <clipPath id="bottomPenaltyClip">
                <rect x="0" y="0" width="100" height="125" />
              </clipPath>
            </defs>
          </svg>

          {/* Player Positions */}
          <div className="relative w-full h-full">
            {mockPositions.map((pos, index) => {
              const player = mockPlayers[index];
              const positionLabel = mockFormation.positions[index] || "";
              
              // Oyuncuya tahmin yapıldı mı kontrol et
              const hasPredictions = playerPredictions[player.id] && Object.keys(playerPredictions[player.id]).length > 0;

              return (
                <div
                  key={index}
                  className="absolute -translate-x-1/2 -translate-y-1/2 z-10"
                  style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                >
                  <div className="relative group">
                    {/* Oyuncu kartı */}
                    <button
                      className={`w-16 h-20 rounded-lg shadow-lg bg-gradient-to-br from-slate-800 to-slate-900 flex flex-col items-center justify-center relative hover:scale-105 transition-all ${
                        hasPredictions
                          ? 'border-[3px] border-[#F59E0B] shadow-[0_0_20px_rgba(245,158,11,0.7)]'
                          : 'border-2 border-white'
                      }`}
                      onClick={() => setSelectedPlayer(player)}
                    >
                      {/* Overall Rating - Sol üstte */}
                      <div className="absolute -top-2 -left-2 bg-[#F59E0B] text-slate-900 text-xs w-6 h-6 rounded-full flex items-center justify-center z-40 font-bold border-2 border-white">
                        {player.rating}
                      </div>
                      
                      {/* Forma Numarası (Ortada, büyük) */}
                      <div className="text-3xl font-black text-white leading-none mb-1">
                        {player.number}
                      </div>
                      
                      {/* İsim - Kart içinde */}
                      <div className="text-[10px] font-bold text-white/90 leading-tight px-1 text-center max-w-full truncate">
                        {player.name}
                      </div>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Info Note */}
        <div className="text-center py-2 flex-shrink-0">
          <p className="text-sm text-muted-foreground">
            Tahmin yapmak için oyuncu kartlarına tıklayın ve ekranı aşağı kaydırın
          </p>
        </div>

        {/* Prediction Categories */}
        <div className="space-y-6 pb-6 flex-shrink-0">
          {/* 1. İlk Yarı Tahminleri */}
          <div className="space-y-4">
            <h3 className="font-bold text-foreground">⏱️ İlk Yarı Tahminleri</h3>
            
            {/* İlk Yarı Skoru */}
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">⚽ İlk Yarı Skoru</p>
              <div className="bg-card border border-border rounded-xl p-4">
                {/* Score Selectors - Scrollable Pickers */}
                <div className="flex items-center justify-center gap-6 mt-2">
                  {/* Home Score Picker */}
                  <div className="text-center flex-1">
                    <p className="text-xs text-muted-foreground mb-2">Ev Sahibi Golü</p>
                    <div className="relative h-32 overflow-hidden bg-background/50 rounded-lg">
                      {/* Gradient overlays */}
                      <div className="absolute top-0 left-0 right-0 h-10 bg-gradient-to-b from-card to-transparent z-10 pointer-events-none"></div>
                      <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-card to-transparent z-10 pointer-events-none"></div>
                      
                      {/* Center highlight */}
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-12 border-2 border-[#059669] rounded-lg pointer-events-none z-10"></div>
                      
                      {/* Scrollable numbers */}
                      <div 
                        className="flex flex-col items-center overflow-y-auto h-full py-10 scrollbar-hide"
                        style={{ scrollSnapType: 'y mandatory' }}
                      >
                        {[0, 1, 2, 3, 4, 5].map((score) => (
                          <div
                            key={score}
                            className={`h-12 flex items-center justify-center flex-shrink-0 transition-all cursor-pointer w-full ${
                              predictions.firstHalfHomeScore === score
                                ? 'text-4xl font-black text-[#059669]'
                                : 'text-2xl font-medium text-muted-foreground opacity-40'
                            }`}
                            style={{ scrollSnapAlign: 'center' }}
                            onClick={() => handleScoreChange('firstHalfHomeScore', score)}
                          >
                            {score === 5 ? '5+' : score}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Away Score Picker */}
                  <div className="text-center flex-1">
                    <p className="text-xs text-muted-foreground mb-2">Deplasman Golü</p>
                    <div className="relative h-32 overflow-hidden bg-background/50 rounded-lg">
                      {/* Gradient overlays */}
                      <div className="absolute top-0 left-0 right-0 h-10 bg-gradient-to-b from-card to-transparent z-10 pointer-events-none"></div>
                      <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-card to-transparent z-10 pointer-events-none"></div>
                      
                      {/* Center highlight */}
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-12 border-2 border-[#059669] rounded-lg pointer-events-none z-10"></div>
                      
                      {/* Scrollable numbers */}
                      <div 
                        className="flex flex-col items-center overflow-y-auto h-full py-10 scrollbar-hide"
                        style={{ scrollSnapType: 'y mandatory' }}
                      >
                        {[0, 1, 2, 3, 4, 5].map((score) => (
                          <div
                            key={score}
                            className={`h-12 flex items-center justify-center flex-shrink-0 transition-all cursor-pointer w-full ${
                              predictions.firstHalfAwayScore === score
                                ? 'text-4xl font-black text-[#059669]'
                                : 'text-2xl font-medium text-muted-foreground opacity-40'
                            }`}
                            style={{ scrollSnapAlign: 'center' }}
                            onClick={() => handleScoreChange('firstHalfAwayScore', score)}
                          >
                            {score === 5 ? '5+' : score}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* İlk Yarı Uzatma Süresi */}
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">⏱️ İlk Yarı Uzatma Süresi</p>
              <div className="grid grid-cols-5 gap-2">
                {['+1 dk', '+2 dk', '+3 dk', '+4 dk', '+5+ dk'].map(time => (
                  <button
                    key={time}
                    onClick={() => handlePredictionChange('firstHalfInjuryTime', time)}
                    className={`h-12 rounded-xl font-medium transition-all text-sm ${
                      predictions.firstHalfInjuryTime === time
                        ? 'bg-[#059669] text-white shadow-lg scale-105'
                        : 'bg-card border border-border text-foreground hover:border-[#059669]'
                    }`}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 2. İkinci Yarı Tahminleri */}
          <div className="space-y-4">
            <h3 className="font-bold text-foreground">⏱️ Maç Sonu Tahminleri</h3>
            
            {/* Maç Sonu Skoru */}
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">⚽ Maç Sonu Skoru</p>
              <div className="bg-card border border-border rounded-xl p-4">
                {/* Score Selectors - Scrollable Pickers */}
                <div className="flex items-center justify-center gap-6 mt-2">
                  {/* Home Score Picker */}
                  <div className="text-center flex-1">
                    <p className="text-xs text-muted-foreground mb-2">Ev Sahibi Golü</p>
                    <div className="relative h-32 overflow-hidden bg-background/50 rounded-lg">
                      {/* Gradient overlays */}
                      <div className="absolute top-0 left-0 right-0 h-10 bg-gradient-to-b from-card to-transparent z-10 pointer-events-none"></div>
                      <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-card to-transparent z-10 pointer-events-none"></div>
                      
                      {/* Center highlight */}
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-12 border-2 border-[#059669] rounded-lg pointer-events-none z-10"></div>
                      
                      {/* Scrollable numbers */}
                      <div 
                        className="flex flex-col items-center overflow-y-auto h-full py-10 scrollbar-hide"
                        style={{ scrollSnapType: 'y mandatory' }}
                      >
                        {[0, 1, 2, 3, 4, 5].map((score) => (
                          <div
                            key={score}
                            className={`h-12 flex items-center justify-center flex-shrink-0 transition-all cursor-pointer w-full ${
                              predictions.secondHalfHomeScore === score
                                ? 'text-4xl font-black text-[#059669]'
                                : 'text-2xl font-medium text-muted-foreground opacity-40'
                            }`}
                            style={{ scrollSnapAlign: 'center' }}
                            onClick={() => handleScoreChange('secondHalfHomeScore', score)}
                          >
                            {score === 5 ? '5+' : score}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Away Score Picker */}
                  <div className="text-center flex-1">
                    <p className="text-xs text-muted-foreground mb-2">Deplasman Golü</p>
                    <div className="relative h-32 overflow-hidden bg-background/50 rounded-lg">
                      {/* Gradient overlays */}
                      <div className="absolute top-0 left-0 right-0 h-10 bg-gradient-to-b from-card to-transparent z-10 pointer-events-none"></div>
                      <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-card to-transparent z-10 pointer-events-none"></div>
                      
                      {/* Center highlight */}
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-12 border-2 border-[#059669] rounded-lg pointer-events-none z-10"></div>
                      
                      {/* Scrollable numbers */}
                      <div 
                        className="flex flex-col items-center overflow-y-auto h-full py-10 scrollbar-hide"
                        style={{ scrollSnapType: 'y mandatory' }}
                      >
                        {[0, 1, 2, 3, 4, 5].map((score) => (
                          <div
                            key={score}
                            className={`h-12 flex items-center justify-center flex-shrink-0 transition-all cursor-pointer w-full ${
                              predictions.secondHalfAwayScore === score
                                ? 'text-4xl font-black text-[#059669]'
                                : 'text-2xl font-medium text-muted-foreground opacity-40'
                            }`}
                            style={{ scrollSnapAlign: 'center' }}
                            onClick={() => handleScoreChange('secondHalfAwayScore', score)}
                          >
                            {score === 5 ? '5+' : score}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* İkinci Yarı Uzatma Süresi */}
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">⏱️ İkinci Yarı Uzatma Süresi</p>
              <div className="grid grid-cols-5 gap-2">
                {['+1 dk', '+2 dk', '+3 dk', '+4 dk', '+5+ dk'].map(time => (
                  <button
                    key={time}
                    onClick={() => handlePredictionChange('secondHalfInjuryTime', time)}
                    className={`h-12 rounded-xl font-medium transition-all text-sm ${
                      predictions.secondHalfInjuryTime === time
                        ? 'bg-[#059669] text-white shadow-lg scale-105'
                        : 'bg-card border border-border text-foreground hover:border-[#059669]'
                    }`}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 3. Maç Sonu Toplam Skor */}
          <div className="space-y-4">
            <h3 className="font-bold text-foreground">🧮 Toplam Gol Sayısı</h3>
            
            {/* Toplam Gol Sayısı */}
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">⚽ Toplam Gol Sayısı</p>
              <div className="grid grid-cols-4 gap-2">
                {['0-1 gol', '2-3 gol', '4-5 gol', '6+ gol'].map(range => (
                  <button
                    key={range}
                    onClick={() => handlePredictionChange('totalGoals', range)}
                    className={`h-12 rounded-xl font-medium transition-all text-sm ${
                      predictions.totalGoals === range
                        ? 'bg-[#059669] text-white shadow-lg scale-105'
                        : 'bg-card border border-border text-foreground hover:border-[#059669]'
                    }`}
                  >
                    {range}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 4. İlk Gol Zamanı */}
          <div className="space-y-4">
            <h3 className="font-bold text-foreground">⏰ İlk Gol Zamanı</h3>
            
            {/* İlk Gol Zamanı */}
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">⏰ İlk Gol Zamanı</p>
              <div className="grid grid-cols-3 gap-2">
                {['1-15 dk', '16-30 dk', '31-45 dk', '46-60 dk', '61-75 dk', '76-90+ dk'].map(range => (
                  <button
                    key={range}
                    onClick={() => handlePredictionChange('firstGoalTime', range)}
                    className={`h-12 rounded-xl font-medium transition-all ${
                      predictions.firstGoalTime === range
                        ? 'bg-[#059669] text-white shadow-lg scale-105'
                        : 'bg-card border border-border text-foreground hover:border-[#059669]'
                    }`}
                  >
                    {range}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 5. Disiplin Tahminleri */}
          <div className="space-y-4">
            <h3 className="font-bold text-foreground">🟨🟥 Disiplin Tahminleri</h3>
            
            {/* Toplam Sarı Kart */}
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">🟨 Toplam Sarı Kart Sayısı</p>
              <div className="grid grid-cols-4 gap-2">
                {['0-2', '3-4', '5-6', '7+'].map(range => (
                  <button
                    key={range}
                    onClick={() => handlePredictionChange('yellowCards', range)}
                    className={`h-12 rounded-xl font-medium transition-all ${
                      predictions.yellowCards === range
                        ? 'bg-[#059669] text-white shadow-lg scale-105'
                        : 'bg-card border border-border text-foreground hover:border-[#059669]'
                    }`}
                  >
                    {range}
                  </button>
                ))}
              </div>
            </div>

            {/* Toplam Kırmızı Kart */}
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">🟥 Toplam Kırmızı Kart Sayısı</p>
              <div className="grid grid-cols-4 gap-2">
                {['0', '1', '2', '3+'].map(count => (
                  <button
                    key={count}
                    onClick={() => handlePredictionChange('redCards', count)}
                    className={`h-12 rounded-xl font-medium transition-all ${
                      predictions.redCards === count
                        ? 'bg-[#059669] text-white shadow-lg scale-105'
                        : 'bg-card border border-border text-foreground hover:border-[#059669]'
                    }`}
                  >
                    {count}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 6. Oyun Kontrolü */}
          <div className="space-y-4">
            <h3 className="font-bold text-foreground">📊 Oyun Kontrolü – Topa Sahip Olma</h3>
            
            {/* Topa Sahip Olma */}
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">🔵 Ev Sahibi / Deplasman Topa Sahip Olma (%)</p>
              <div className="bg-card border border-border rounded-xl p-6">
                {/* Two-sided Display */}
                <div className="flex items-center justify-between mb-6">
                  {/* Ev Sahibi Side */}
                  <div className="text-center flex-1">
                    <p className="text-xs text-muted-foreground mb-2">Ev Sahibi</p>
                    <div className={`text-3xl font-black transition-all ${
                      predictions.possession !== null 
                        ? 'text-[#059669]' 
                        : 'text-muted-foreground'
                    }`}>
                      {predictions.possession 
                        ? `${predictions.possession}%`
                        : '-%'}
                    </div>
                  </div>

                  <div className="text-xl font-bold text-muted-foreground px-4">vs</div>
                  
                  {/* Deplasman Side */}
                  <div className="text-center flex-1">
                    <p className="text-xs text-muted-foreground mb-2">Deplasman</p>
                    <div className={`text-3xl font-black transition-all ${
                      predictions.possession !== null 
                        ? 'text-foreground' 
                        : 'text-muted-foreground'
                    }`}>
                      {predictions.possession 
                        ? `${(100 - parseFloat(predictions.possession)).toFixed(0)}%`
                        : '-%'}
                    </div>
                  </div>
                </div>

                {/* Slider Container */}
                <div className="relative">
                  {/* Slider Track */}
                  <div className="relative h-12 flex items-center px-2">
                    {/* Background Track */}
                    <div className="absolute inset-x-2 h-2 bg-background rounded-full"></div>
                    
                    {/* Active Track - fills from left to slider position */}
                    {predictions.possession && (
                      <div 
                        className="absolute h-2 bg-[#059669] rounded-full transition-all pointer-events-none"
                        style={{
                          left: '0.5rem',
                          right: `calc(100% - 0.5rem - ${((parseFloat(predictions.possession) - 30) / 40) * 100}%)`
                        }}
                      ></div>
                    )}

                    {/* HTML Range Input */}
                    <input
                      type="range"
                      min="30"
                      max="70"
                      step="5"
                      value={predictions.possession || '50'}
                      onChange={(e) => handlePredictionChange('possession', e.target.value)}
                      className="absolute inset-x-0 w-full h-12 appearance-none bg-transparent cursor-pointer z-10"
                      style={{
                        WebkitAppearance: 'none',
                      }}
                    />

                    {/* Tick Marks */}
                    <div className="absolute inset-x-2 flex justify-between pointer-events-none">
                      {[30, 35, 40, 45, 50, 55, 60, 65, 70].map((value) => {
                        const percentage = ((value - 30) / 40) * 100;
                        const isSelected = predictions.possession === value.toString();
                        
                        return (
                          <div
                            key={value}
                            className="relative"
                            style={{ width: '0px' }}
                          >
                            {/* Dot */}
                            <div className={`w-3 h-3 rounded-full transition-all -translate-x-1/2 ${
                              isSelected
                                ? 'bg-white border-2 border-[#059669] shadow-lg scale-150'
                                : 'bg-background border-2 border-border'
                            }`}></div>
                            
                            {/* Label - only show for major values */}
                            {value % 20 === 10 || value === 30 || value === 50 || value === 70 ? (
                              <div className={`absolute top-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs transition-all ${
                                isSelected
                                  ? 'text-[#059669] font-bold'
                                  : 'text-muted-foreground'
                              }`}>
                                {value}%
                              </div>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Side Labels */}
                  <div className="flex justify-between mt-8 text-xs font-medium">
                    <span className="text-[#059669]">← Ev Sahibi Üstünlüğü</span>
                    <span className="text-muted-foreground">Deplasman Üstünlüğü →</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 7. Toplam ve İsabetli Şut Sayıları */}
          <div className="space-y-4">
            <h3 className="font-bold text-foreground">🎯 Toplam ve İsabetli Şut Sayıları</h3>
            
            {/* Toplam Şut Sayısı */}
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">⚽ Toplam Şut Sayısı</p>
              <div className="grid grid-cols-4 gap-2">
                {['0-10', '11-20', '21-30', '31+'].map(range => (
                  <button
                    key={range}
                    onClick={() => handlePredictionChange('totalShots', range)}
                    className={`h-12 rounded-xl font-medium transition-all text-sm ${
                      predictions.totalShots === range
                        ? 'bg-[#059669] text-white shadow-lg scale-105'
                        : 'bg-card border border-border text-foreground hover:border-[#059669]'
                    }`}
                  >
                    {range}
                  </button>
                ))}
              </div>
            </div>

            {/* İsabetli Şut Sayısı */}
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">🎯 İsabetli Şut Sayısı</p>
              <div className="grid grid-cols-4 gap-2">
                {['0-5', '6-10', '11-15', '16+'].map(range => (
                  <button
                    key={range}
                    onClick={() => handlePredictionChange('shotsOnTarget', range)}
                    className={`h-12 rounded-xl font-medium transition-all text-sm ${
                      predictions.shotsOnTarget === range
                        ? 'bg-[#059669] text-white shadow-lg scale-105'
                        : 'bg-card border border-border text-foreground hover:border-[#059669]'
                    }`}
                  >
                    {range}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 8. Toplam Korner Aralığı */}
          <div className="space-y-4">
            <h3 className="font-bold text-foreground">⚽ Toplam Korner Aralığı</h3>
            
            {/* Korner Sayısı */}
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">🚩 Toplam Korner Sayısı</p>
              <div className="grid grid-cols-3 gap-2">
                {['0-6', '7-12', '12+'].map(range => (
                  <button
                    key={range}
                    onClick={() => handlePredictionChange('totalCorners', range)}
                    className={`h-12 rounded-xl font-medium transition-all text-sm ${
                      predictions.totalCorners === range
                        ? 'bg-[#059669] text-white shadow-lg scale-105'
                        : 'bg-card border border-border text-foreground hover:border-[#059669]'
                    }`}
                  >
                    {range}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 9. Maçın Genel Temposu */}
          <div className="space-y-4">
            <h3 className="font-bold text-foreground">⚡ Maçın Genel Temposu</h3>
            
            {/* Oyun Hızı */}
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">🏃‍♂️ Oyun Hızı / Tempo</p>
              <div className="grid grid-cols-3 gap-2">
                {['Düşük tempo', 'Orta tempo', 'Yüksek tempo'].map(tempo => (
                  <button
                    key={tempo}
                    onClick={() => handlePredictionChange('tempo', tempo)}
                    className={`h-12 rounded-xl font-medium transition-all text-sm ${
                      predictions.tempo === tempo
                        ? 'bg-[#059669] text-white shadow-lg scale-105'
                        : 'bg-card border border-border text-foreground hover:border-[#059669]'
                    }`}
                  >
                    {tempo}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 10. Maç Senaryosu */}
          <div className="space-y-4">
            <h3 className="font-bold text-foreground">🧠 Maç Senaryosu (Makro)</h3>
            
            <div className="grid grid-cols-2 gap-2">
              {[
                'Kontrollü oyun',
                'Baskılı oyun',
                'Geçiş oyunu ağırlıklı',
                'Duran toplar belirleyici olur'
              ].map(scenario => (
                <button
                  key={scenario}
                  onClick={() => handlePredictionChange('scenario', scenario)}
                  className={`h-12 rounded-xl font-medium transition-all text-sm ${
                    predictions.scenario === scenario
                      ? 'bg-[#059669] text-white shadow-lg scale-105'
                      : 'bg-card border border-border text-foreground hover:border-[#059669]'
                  }`}
                >
                  {scenario}
                </button>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <button className="w-full h-12 bg-[#059669] hover:bg-[#059669]/90 text-white rounded-xl font-medium transition-all shadow-lg">
            Tahminleri Kaydet
          </button>
        </div>
      </div>
    </div>
  );
}