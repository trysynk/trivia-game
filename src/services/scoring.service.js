const { Settings } = require('../models');

// Default speed bonus tiers (fallback if settings not loaded)
const DEFAULT_SPEED_TIERS = [
  { maxTime: 3, bonus: 50 },
  { maxTime: 6, bonus: 30 },
  { maxTime: 10, bonus: 15 },
  { maxTime: Infinity, bonus: 0 }
];

let cachedSettings = null;

const loadSettings = async () => {
  if (!cachedSettings) {
    cachedSettings = await Settings.getSettings();
  }
  return cachedSettings;
};

const clearSettingsCache = () => {
  cachedSettings = null;
};

const getSpeedBonusTiers = async (gameType) => {
  const settings = await loadSettings();

  if (settings && settings.gameDefaults) {
    const gameKey = gameType === 'everyone' ? 'everyoneAnswers' :
                    gameType === 'buzzer' ? 'buzzerMode' : 'mainGame';

    if (settings.gameDefaults[gameKey]?.speedBonusTiers) {
      return settings.gameDefaults[gameKey].speedBonusTiers;
    }
  }

  return DEFAULT_SPEED_TIERS;
};

const calculateSpeedBonus = async (responseTimeSeconds, gameType = 'everyone') => {
  const tiers = await getSpeedBonusTiers(gameType);

  for (const tier of tiers) {
    if (responseTimeSeconds <= tier.maxTime) {
      return tier.bonus;
    }
  }

  return 0;
};

const calculateScore = async (options) => {
  const {
    basePoints,
    isCorrect,
    responseTimeSeconds,
    gameType = 'everyone',
    difficulty = 'medium',
    isFirstCorrect = false,
    buzzerPosition = null
  } = options;

  if (!isCorrect) {
    return {
      basePoints: 0,
      speedBonus: 0,
      difficultyMultiplier: 1,
      firstCorrectBonus: 0,
      buzzerBonus: 0,
      totalPoints: 0
    };
  }

  // Difficulty multipliers
  const difficultyMultipliers = {
    easy: 1,
    medium: 1.5,
    hard: 2
  };

  const difficultyMultiplier = difficultyMultipliers[difficulty] || 1;

  // Calculate speed bonus
  const speedBonus = await calculateSpeedBonus(responseTimeSeconds, gameType);

  // First correct bonus (for everyone mode)
  const firstCorrectBonus = isFirstCorrect ? 10 : 0;

  // Buzzer position bonus (for buzzer mode)
  let buzzerBonus = 0;
  if (gameType === 'buzzer' && buzzerPosition) {
    buzzerBonus = buzzerPosition === 1 ? 20 : 0;
  }

  const adjustedBase = Math.round(basePoints * difficultyMultiplier);
  const totalPoints = adjustedBase + speedBonus + firstCorrectBonus + buzzerBonus;

  return {
    basePoints: adjustedBase,
    speedBonus,
    difficultyMultiplier,
    firstCorrectBonus,
    buzzerBonus,
    totalPoints
  };
};

const calculateTeamScore = (teamPlayers) => {
  return teamPlayers.reduce((total, player) => total + (player.score || 0), 0);
};

const determineWinner = (participants, gameType = 'main') => {
  if (!participants || participants.length === 0) {
    return null;
  }

  if (gameType === 'main') {
    // Team-based game
    const sortedTeams = [...participants].sort((a, b) => b.finalScore - a.finalScore);
    if (sortedTeams.length > 0) {
      return {
        type: 'team',
        name: sortedTeams[0].name,
        score: sortedTeams[0].finalScore,
        icon: sortedTeams[0].icon
      };
    }
  } else {
    // Player-based game (everyone/buzzer)
    const sortedPlayers = [...participants].sort((a, b) => b.score - a.score);
    if (sortedPlayers.length > 0) {
      return {
        type: 'player',
        name: sortedPlayers[0].name,
        score: sortedPlayers[0].score,
        avatar: sortedPlayers[0].avatar
      };
    }
  }

  return null;
};

const getRankings = (players) => {
  const sorted = [...players]
    .filter(p => p.isActive !== false)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      // Tiebreaker: faster average response time
      if (a.totalAnswerTime && b.totalAnswerTime) {
        const aAvg = a.totalAnswerTime / (a.correctAnswers || 1);
        const bAvg = b.totalAnswerTime / (b.correctAnswers || 1);
        return aAvg - bAvg;
      }
      return 0;
    });

  return sorted.map((player, index) => ({
    rank: index + 1,
    name: player.name,
    score: player.score,
    correctAnswers: player.correctAnswers || 0,
    wrongAnswers: player.wrongAnswers || 0,
    avatar: player.avatar,
    color: player.color
  }));
};

module.exports = {
  calculateSpeedBonus,
  calculateScore,
  calculateTeamScore,
  determineWinner,
  getRankings,
  getSpeedBonusTiers,
  clearSettingsCache
};
