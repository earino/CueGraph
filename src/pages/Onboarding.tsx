import { useState } from 'react';
import { useCueGraph } from '../lib/store';
import { Chip } from '../components/Chip';
import { EventButton } from '../components/EventButton';
import { trackEvent, isPostHogConfigured } from '../lib/telemetry';

const questionChips = [
  {
    id: 'spicy_bathroom',
    label: 'Spicy food & bathroom',
    question: 'Does spicy food mess up my stomach or skin?',
    eventTypeIds: ['eat-spicy-food', 'felt-spicy-food', 'skin-flush']
  },
  {
    id: 'spicy_skin',
    label: 'Spicy food & skin',
    question: 'Does spicy food trigger skin issues?',
    eventTypeIds: ['eat-spicy-food', 'skin-flush', 'dandruff-flare']
  },
  {
    id: 'drinking_mornings',
    label: 'Drinking & mornings',
    question: 'Does drinking on weeknights ruin my mornings?',
    eventTypeIds: ['got-drunk', 'felt-like-shit', 'late-to-work']
  },
  {
    id: 'sleep_mood',
    label: 'Sleep & mood',
    question: 'Does poor sleep make me extra snappy?',
    eventTypeIds: ['poor-sleep', 'mood-dip', 'high-stress-day']
  },
  {
    id: 'sugar_crashes',
    label: 'Sugar & crashes',
    question: 'Do sugar crashes affect my energy?',
    eventTypeIds: ['high-sugar', 'mood-dip']
  },
];

export function Onboarding() {
  const { eventTypes, updateUserSettings } = useCueGraph();
  const [step, setStep] = useState(1);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);
  const [questions, setQuestions] = useState<string[]>(['', '', '', '']);
  const [selectedChipEventTypes, setSelectedChipEventTypes] = useState<string[]>([]);
  const [pinnedEventTypeIds, setPinnedEventTypeIds] = useState<string[]>([]);

  const handleNext = () => setStep(step + 1);
  const handleBack = () => setStep(step - 1);

  const handleChipClick = (chip: typeof questionChips[0]) => {
    // Find first empty question slot and fill it
    const emptyIndex = questions.findIndex(q => !q);
    if (emptyIndex !== -1) {
      const newQuestions = [...questions];
      newQuestions[emptyIndex] = chip.question;
      setQuestions(newQuestions);
    }

    // Add related event types to highlight list
    setSelectedChipEventTypes(prev =>
      Array.from(new Set([...prev, ...chip.eventTypeIds]))
    );

    trackEvent('onboarding_question_chip_selected', { chip: chip.id });
  };

  const handleQuestionChange = (index: number, value: string) => {
    const newQuestions = [...questions];
    newQuestions[index] = value;
    setQuestions(newQuestions);
  };

  const handleEventTypeToggle = (eventTypeId: string) => {
    setPinnedEventTypeIds(prev =>
      prev.includes(eventTypeId)
        ? prev.filter(id => id !== eventTypeId)
        : [...prev, eventTypeId]
    );
  };

  const handleComplete = async () => {
    const filteredQuestions = questions.filter(q => q.trim());

    await updateUserSettings({
      onboardingCompleted: true,
      analyticsEnabled,
      questions: filteredQuestions,
      pinnedEventTypeIds,
    });

    trackEvent('onboarding_completed', {
      question_count: filteredQuestions.length,
      pinned_count: pinnedEventTypeIds.length,
    });
  };

  // Screen 1: Intro
  if (step === 1) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white dark:from-gray-900 dark:to-gray-800 p-6 flex flex-col">
        <div className="flex-1 flex flex-col justify-center max-w-2xl mx-auto w-full">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Welcome to CueGraph
          </h1>

          <p className="text-lg text-gray-700 dark:text-gray-300 mb-4">
            Map how your life's events seem to trigger each other.
          </p>

          <div className="space-y-3 mb-8">
            <div className="flex items-start gap-3">
              <span className="text-2xl">📝</span>
              <p className="text-gray-700 dark:text-gray-300">
                <strong>Log life events</strong> like meals, activities, symptoms, and moods
              </p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">🔗</span>
              <p className="text-gray-700 dark:text-gray-300">
                <strong>Connect the dots</strong> by marking what you think caused what
              </p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">🕸️</span>
              <p className="text-gray-700 dark:text-gray-300">
                <strong>Discover patterns</strong> in how events relate over time
              </p>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-8">
            <p className="text-sm text-blue-900 dark:text-blue-200 mb-3">
              <strong>Privacy first:</strong> All your event data stays on your device. No accounts, no servers, no sharing.
            </p>

            {isPostHogConfigured() && (
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={analyticsEnabled}
                  onChange={(e) => setAnalyticsEnabled(e.target.checked)}
                  className="mt-1 w-5 h-5 text-primary-600 rounded"
                />
                <span className="text-sm text-blue-900 dark:text-blue-200">
                  Share anonymous usage statistics (like which screens you visit) to help improve CueGraph. We never send the contents of your events or notes.
                </span>
              </label>
            )}
          </div>
        </div>

        <button
          onClick={handleNext}
          className="w-full py-4 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-colors"
        >
          Get Started
        </button>
      </div>
    );
  }

  // Screen 2: Questions
  if (step === 2) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 p-6 flex flex-col">
        <div className="flex-1 max-w-2xl mx-auto w-full">
          <button
            onClick={handleBack}
            className="text-primary-600 dark:text-primary-400 mb-6"
          >
            ← Back
          </button>

          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            What are you curious about?
          </h2>

          <p className="text-gray-600 dark:text-gray-400 mb-6">
            What 1-4 questions would you like to explore? (Optional)
          </p>

          <div className="space-y-4 mb-6">
            {questions.map((question, index) => (
              <div key={index}>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Question {index + 1} {index === 0 ? '(optional)' : ''}
                </label>
                <input
                  type="text"
                  value={question}
                  onChange={(e) => handleQuestionChange(index, e.target.value)}
                  placeholder="e.g., Does spicy food mess up my stomach?"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            ))}
          </div>

          <div className="mb-8">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Quick suggestions:
            </p>
            <div className="flex flex-wrap gap-2">
              {questionChips.map(chip => (
                <Chip
                  key={chip.id}
                  label={chip.label}
                  onClick={() => handleChipClick(chip)}
                />
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={handleNext}
          className="w-full py-4 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-colors"
        >
          Continue
        </button>
      </div>
    );
  }

  // Screen 3: Choose starter events
  if (step === 3) {
    const builtInTypes = eventTypes.filter(t => t.isBuiltIn);

    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 p-6 flex flex-col">
        <div className="flex-1 max-w-2xl mx-auto w-full">
          <button
            onClick={handleBack}
            className="text-primary-600 dark:text-primary-400 mb-6"
          >
            ← Back
          </button>

          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Choose events to track
          </h2>

          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Select 3-8 events you want quick access to on your home screen.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
            {builtInTypes.map(eventType => {
              const isSelected = pinnedEventTypeIds.includes(eventType.id);
              const isHighlighted = selectedChipEventTypes.includes(eventType.id);

              return (
                <div key={eventType.id} className={isHighlighted ? 'ring-2 ring-primary-400 rounded-xl' : ''}>
                  <EventButton
                    eventType={eventType}
                    onClick={() => handleEventTypeToggle(eventType.id)}
                    selected={isSelected}
                  />
                </div>
              );
            })}
          </div>

          <div className="text-center text-sm text-gray-600 dark:text-gray-400 mb-4">
            {pinnedEventTypeIds.length} selected
          </div>
        </div>

        <button
          onClick={handleComplete}
          disabled={pinnedEventTypeIds.length < 3}
          className={`
            w-full py-4 font-semibold rounded-xl transition-colors
            ${pinnedEventTypeIds.length >= 3
              ? 'bg-primary-600 hover:bg-primary-700 text-white'
              : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
            }
          `}
        >
          {pinnedEventTypeIds.length < 3
            ? `Select at least ${3 - pinnedEventTypeIds.length} more`
            : 'Start Using CueGraph'
          }
        </button>
      </div>
    );
  }

  return null;
}
