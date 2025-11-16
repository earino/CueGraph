import { motion } from 'framer-motion';
import { GraduationCap, Calendar } from 'lucide-react';
import type { OnboardingPhase } from '../lib/types';
import { getPhaseDescription } from '../lib/onboardingContent';

interface OnboardingProgressBannerProps {
  currentDay: number;
  phase: OnboardingPhase;
  daysCompleted: number[];
  onClick?: () => void;
}

export function OnboardingProgressBanner({
  currentDay,
  phase,
  daysCompleted,
  onClick,
}: OnboardingProgressBannerProps) {
  const totalDays = 60;
  const progressPercent = (currentDay / totalDays) * 100;
  const completedCount = daysCompleted.length;

  const phaseColors = {
    foundation: 'bg-blue-500',
    'evidence-building': 'bg-purple-500',
    mastery: 'bg-orange-500',
    completed: 'bg-green-500',
  };

  const phaseEmojis = {
    foundation: '🌱',
    'evidence-building': '🔍',
    mastery: '🎯',
    completed: '🎓',
  };

  return (
    <motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      onClick={onClick}
      className={`bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-2xl p-4 mb-6 border-2 border-purple-200 dark:border-purple-800 ${
        onClick ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
            Guided Onboarding
          </span>
        </div>
        <span className="text-xs font-medium text-purple-700 dark:text-purple-300 bg-white/50 dark:bg-gray-800/50 px-2 py-1 rounded-full">
          Day {currentDay} of {totalDays}
        </span>
      </div>

      {/* Progress bar */}
      <div className="mb-3">
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className={`h-full ${phaseColors[phase]}`}
          />
        </div>
      </div>

      {/* Phase info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{phaseEmojis[phase]}</span>
          <div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {getPhaseDescription(phase)}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            <Calendar className="w-3 h-3 inline mr-1" />
            {completedCount} days completed
          </p>
        </div>
      </div>

      {onClick && (
        <p className="text-xs text-center text-purple-600 dark:text-purple-400 mt-2 font-medium">
          Tap to view today's goal
        </p>
      )}
    </motion.div>
  );
}
