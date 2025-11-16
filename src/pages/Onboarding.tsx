import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Zap, TrendingUp } from 'lucide-react';
import { useCueGraph } from '../lib/store';
import { trackEvent } from '../lib/telemetry';
import { startOnboarding } from '../lib/onboardingLogic';

// Popular starter events for quick onboarding
const STARTER_EVENTS = [
  { label: 'Ate spicy food', emoji: '🌶️', category: 'action' as const, id: 'eat-spicy-food' },
  { label: 'Had coffee', emoji: '☕', category: 'action' as const, id: 'caffeine-late' },
  { label: 'Felt great', emoji: '😊', category: 'mood' as const, id: 'mood-up' },
  { label: 'Had a headache', emoji: '🤕', category: 'symptom' as const, id: 'headache' },
  { label: 'Worked out', emoji: '💪', category: 'action' as const, id: 'hard-workout' },
  { label: 'Felt stressed', emoji: '😰', category: 'mood' as const, id: 'high-stress-day' },
  { label: 'Slept poorly', emoji: '😴', category: 'symptom' as const, id: 'poor-sleep' },
  { label: 'Had a drink', emoji: '🍺', category: 'action' as const, id: 'got-drunk' },
];

export function Onboarding() {
  const { eventTypes, updateUserSettings, logEvent, createEventType } = useCueGraph();
  const [step, setStep] = useState(1);
  const [showConfetti, setShowConfetti] = useState(false);

  // Scroll to top when step changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [step]);

  const handleNext = () => setStep(step + 1);

  const handleEventSelect = async (event: typeof STARTER_EVENTS[0]) => {
    setShowConfetti(true);

    // Find or create the event type
    let eventType = eventTypes.find(t => t.id === event.id);
    if (!eventType) {
      eventType = await createEventType({
        label: event.label,
        emoji: event.emoji,
        category: event.category,
      });
    }

    // Log the event
    await logEvent(eventType.id);

    // Wait a moment for the celebration, then move to next step
    setTimeout(() => {
      handleNext();
      setShowConfetti(false);
    }, 1500);

    trackEvent('onboarding_first_event_logged', { event_id: event.id });
  };

  const handleComplete = async () => {
    // Initialize the 60-day guided onboarding journey
    const onboardingUpdates = startOnboarding();

    await updateUserSettings({
      onboardingCompleted: true,
      pinnedEventTypeIds: [], // We'll let them customize this later in the app
      ...onboardingUpdates,
    });

    trackEvent('onboarding_completed', {
      question_count: 0,
      pinned_count: 0,
    });

    trackEvent('guided_onboarding_started');
  };

  // Screen 1: Hero/Welcome
  if (step === 1) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="min-h-screen bg-gradient-to-br from-violet-500 via-purple-500 to-pink-500 p-6 flex flex-col relative overflow-hidden"
      >
        {/* Animated background blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute -top-20 -right-20 w-96 h-96 bg-white/10 rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              scale: [1.2, 1, 1.2],
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute -bottom-20 -left-20 w-96 h-96 bg-white/10 rounded-full blur-3xl"
          />
        </div>

        <div className="flex-1 flex flex-col justify-center max-w-2xl mx-auto w-full relative z-10">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
              <Sparkles className="w-4 h-4 text-white" />
              <span className="text-sm font-medium text-white">Your personal pattern finder</span>
            </div>

            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Discover what triggers what in your life
            </h1>

            <p className="text-xl text-white/90 mb-8 leading-relaxed">
              Track events. Connect causes. See patterns emerge.
            </p>

            <div className="space-y-4 mb-12">
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-2xl p-4"
              >
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-white">Log life events in seconds</p>
                  <p className="text-sm text-white/80">Meals, symptoms, moods, activities</p>
                </div>
              </motion.div>

              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-2xl p-4"
              >
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-white">Discover surprising patterns</p>
                  <p className="text-sm text-white/80">See what causes what over time</p>
                </div>
              </motion.div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4 mb-8">
              <p className="text-sm text-white/90">
                🔒 <strong>Privacy first:</strong> All your data stays on your device. No accounts, no servers.
              </p>
            </div>
          </motion.div>
        </div>

        <motion.button
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleNext}
          className="w-full py-5 bg-white text-purple-600 font-bold text-lg rounded-2xl shadow-xl hover:shadow-2xl transition-all"
        >
          Get started
        </motion.button>
      </motion.div>
    );
  }

  // Screen 2: Log First Event
  if (step === 2) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 p-6 flex flex-col"
      >
        <div className="flex-1 max-w-2xl mx-auto w-full">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <div className="text-center mb-8">
              <h2 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                Let's log your first event
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                What happened recently? Pick one:
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              {STARTER_EVENTS.map((event, index) => (
                <motion.button
                  key={event.id}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                  whileHover={{ scale: 1.05, y: -4 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleEventSelect(event)}
                  className="relative bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-md hover:shadow-xl transition-all border-2 border-gray-100 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600"
                >
                  <div className="text-4xl mb-3">{event.emoji}</div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                    {event.label}
                  </p>
                </motion.button>
              ))}
            </div>

            <motion.button
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              whileHover={{ scale: 1.02 }}
              onClick={() => {
                // For now, just move to next step
                // In a real implementation, this would open a create event modal
                handleNext();
              }}
              className="w-full py-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl text-gray-600 dark:text-gray-400 hover:border-purple-400 dark:hover:border-purple-500 hover:text-purple-600 dark:hover:text-purple-400 transition-all font-medium"
            >
              ✨ Or create your own
            </motion.button>
          </motion.div>
        </div>

        {/* Confetti effect */}
        <AnimatePresence>
          {showConfetti && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 pointer-events-none flex items-center justify-center z-50"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1.5 }}
                exit={{ scale: 0 }}
                className="text-8xl"
              >
                🎉
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }

  // Screen 3: Show the Magic
  if (step === 3) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6 flex flex-col"
      >
        <div className="flex-1 flex flex-col justify-center max-w-2xl mx-auto w-full">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <div className="text-center mb-12">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="inline-block text-6xl mb-6"
              >
                🎯
              </motion.div>

              <h2 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                Great! Here's how it works
              </h2>

              <p className="text-lg text-gray-600 dark:text-gray-400">
                The more you log, the more patterns you'll discover
              </p>
            </div>

            {/* The Loop */}
            <div className="space-y-6 mb-12">
              <motion.div
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="flex items-start gap-4 bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center flex-shrink-0 text-2xl">
                  1️⃣
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100 mb-1">
                    Log events as they happen
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Quick-tap events throughout your day. Takes just seconds.
                  </p>
                </div>
              </motion.div>

              <motion.div
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="flex items-start gap-4 bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center flex-shrink-0 text-2xl">
                  2️⃣
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100 mb-1">
                    Connect the dots
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    When something happens, we'll ask "What caused this?" Tap to connect.
                  </p>
                </div>
              </motion.div>

              <motion.div
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="flex items-start gap-4 bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center flex-shrink-0 text-2xl">
                  3️⃣
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100 mb-1">
                    Discover surprising patterns
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    See correlations emerge. Find out what really triggers what.
                  </p>
                </div>
              </motion.div>
            </div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-2xl p-4 text-center mb-6"
            >
              <p className="text-purple-900 dark:text-purple-200">
                <strong>Pro tip:</strong> The more events you log, the better patterns you'll discover!
              </p>
            </motion.div>
          </motion.div>
        </div>

        <motion.button
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleComplete}
          className="w-full py-5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold text-lg rounded-2xl shadow-xl hover:shadow-2xl transition-all"
        >
          Start tracking
        </motion.button>
      </motion.div>
    );
  }

  return null;
}
