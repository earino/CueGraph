import { motion } from 'framer-motion';
import { Target, CheckCircle, BookOpen } from 'lucide-react';
import type { OnboardingDay } from '../lib/onboardingContent';

interface DailyGoalCardProps {
  dayContent: OnboardingDay;
  isCompleted: boolean;
  onMarkComplete?: () => void;
}

export function DailyGoalCard({ dayContent, isCompleted, onMarkComplete }: DailyGoalCardProps) {
  const phaseColors = {
    foundation: 'from-blue-500 to-cyan-500',
    'evidence-building': 'from-purple-500 to-pink-500',
    mastery: 'from-orange-500 to-red-500',
    completed: 'from-green-500 to-emerald-500',
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
      className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border-2 border-gray-100 dark:border-gray-700 overflow-hidden mb-6"
    >
      {/* Header with gradient */}
      <div className={`bg-gradient-to-r ${phaseColors[dayContent.phase]} p-4`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{phaseEmojis[dayContent.phase]}</span>
            <div>
              <p className="text-white text-sm font-medium opacity-90">
                Day {dayContent.day} of 60
              </p>
              <h2 className="text-white text-lg font-bold">
                {dayContent.title}
              </h2>
            </div>
          </div>
          {isCompleted && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="bg-white/20 rounded-full p-2"
            >
              <CheckCircle className="w-6 h-6 text-white" />
            </motion.div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-5 space-y-4">
        {/* Description */}
        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
          {dayContent.description}
        </p>

        {/* Today's Goal */}
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
          <div className="flex items-start gap-3">
            <Target className="w-5 h-5 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-purple-900 dark:text-purple-100 text-sm mb-1">
                Today's Goal
              </p>
              <p className="text-purple-800 dark:text-purple-200 text-sm">
                {dayContent.goal}
              </p>
            </div>
          </div>
        </div>

        {/* Tips */}
        {dayContent.tips.length > 0 && (
          <details className="group">
            <summary className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-gray-900 dark:text-gray-100 hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
              <BookOpen className="w-4 h-4" />
              <span>Tips & Guidance ({dayContent.tips.length})</span>
              <span className="ml-auto text-xs text-gray-500 group-open:hidden">
                Click to expand
              </span>
            </summary>
            <ul className="mt-3 space-y-2">
              {dayContent.tips.map((tip, index) => (
                <li
                  key={index}
                  className="flex gap-2 text-sm text-gray-600 dark:text-gray-400"
                >
                  <span className="text-purple-500 flex-shrink-0">•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </details>
        )}

        {/* Feature Intro */}
        {dayContent.featureIntro && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
            <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
              ✨ New Feature
            </p>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              {dayContent.featureIntro}
            </p>
          </div>
        )}

        {/* Check-in indicator */}
        {dayContent.checkIn && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
            <p className="text-sm font-semibold text-green-900 dark:text-green-100 mb-1">
              📝 Reflection Day
            </p>
            <p className="text-sm text-green-800 dark:text-green-200">
              Take time today to review your progress and reflect on what you've learned.
            </p>
          </div>
        )}

        {/* Mark complete button */}
        {!isCompleted && onMarkComplete && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onMarkComplete}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <CheckCircle className="w-5 h-5" />
            Mark Day Complete
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}
