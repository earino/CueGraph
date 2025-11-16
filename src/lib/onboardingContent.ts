import type { OnboardingPhase } from './types';

export interface OnboardingDay {
  day: number;
  phase: OnboardingPhase;
  title: string;
  description: string;
  goal: string;
  tips: string[];
  suggestedEventTypes?: string[]; // IDs of built-in event types to suggest
  featureIntro?: string; // Introduce a specific feature
  checkIn?: boolean; // Is this a reflection/review day?
}

export const ONBOARDING_CURRICULUM: OnboardingDay[] = [
  // ==================== PHASE 1: FOUNDATION (Days 1-14) ====================

  // Week 1: Basic Event Tracking
  {
    day: 1,
    phase: 'foundation',
    title: 'Welcome to Causal Discovery',
    description: 'Today is about getting started with the basics. We\'ll learn what an "event" is and how to log your first few.',
    goal: 'Log at least 3 events today',
    tips: [
      'An event is anything that happens - an action, a symptom, a mood change',
      'Start simple: coffee, meals, how you feel',
      'Don\'t overthink it - you can always add more detail later',
      'Tap the + button anytime something happens'
    ],
    suggestedEventTypes: ['had-coffee', 'headache', 'good-sleep'],
    featureIntro: 'The Log page is your home base. This is where you\'ll record events throughout your day.'
  },
  {
    day: 2,
    phase: 'foundation',
    title: 'Building Consistency',
    description: 'Consistency is key to discovering patterns. Today, focus on logging events as they happen throughout your day.',
    goal: 'Log events at 3 different times of day',
    tips: [
      'Set reminders on your phone to check in',
      'Log events in real-time when possible',
      'Add notes to remember context later',
      'Use the intensity slider for symptoms or moods'
    ],
    suggestedEventTypes: ['had-coffee', 'headache', 'good-sleep', 'exercise']
  },
  {
    day: 3,
    phase: 'foundation',
    title: 'Understanding Event Types',
    description: 'Events come in different categories: actions, symptoms, moods, and situations. Today, try logging a variety.',
    goal: 'Log at least one event from each category',
    tips: [
      'Actions: things you do (eat, drink, exercise)',
      'Symptoms: physical sensations (headache, energy)',
      'Moods: emotional states (happy, anxious)',
      'Situations: contexts (stressful meeting, good sleep)'
    ],
    suggestedEventTypes: ['had-coffee', 'headache', 'felt-anxious', 'stressful-event', 'exercise']
  },
  {
    day: 4,
    phase: 'foundation',
    title: 'Adding Detail',
    description: 'The more detail you add, the better patterns you\'ll discover. Today, practice using intensity ratings and notes.',
    goal: 'Add notes or intensity to every event you log',
    tips: [
      'Intensity helps track severity (1 = mild, 5 = severe)',
      'Notes capture important context',
      'You can edit events later if you forget something',
      'Be consistent with how you rate intensity'
    ]
  },
  {
    day: 5,
    phase: 'foundation',
    title: 'Creating Custom Events',
    description: 'Everyone is unique. Today, create your first custom event type that matters to you.',
    goal: 'Create 1-2 custom event types',
    tips: [
      'Think about what you want to understand better',
      'Choose clear, specific names',
      'Pick an emoji that makes it easy to recognize',
      'You can always create more later'
    ],
    featureIntro: 'Go to Settings → Event Types to create custom events. These will appear in your quick-log buttons.'
  },
  {
    day: 6,
    phase: 'foundation',
    title: 'Review Your Week',
    description: 'Take a moment to look back at your first week of tracking. What patterns do you notice?',
    goal: 'Review your history and reflect',
    tips: [
      'Visit the History page to see all your events',
      'Look for events that seem to cluster together',
      'Notice any patterns in timing or frequency',
      'Don\'t worry about proving anything yet - just observe'
    ],
    checkIn: true,
    featureIntro: 'The History page shows all your logged events in chronological order. Use it to review what you\'ve tracked.'
  },
  {
    day: 7,
    phase: 'foundation',
    title: 'Week 1 Complete!',
    description: 'You\'ve built the foundation! You\'re logging consistently and paying attention to events in your life.',
    goal: 'Continue logging throughout the day',
    tips: [
      'You\'ve learned the basics of event tracking',
      'Consistency will get easier each day',
      'Next week, we\'ll explore cause and effect',
      'Keep up the great work!'
    ],
    checkIn: true
  },

  // Week 2: Introduction to Causality
  {
    day: 8,
    phase: 'foundation',
    title: 'Cause and Effect',
    description: 'Today we introduce the core concept: some events might cause other events. Let\'s start thinking about connections.',
    goal: 'Think about 2-3 possible cause-effect relationships',
    tips: [
      'Does coffee sometimes lead to anxiety?',
      'Does poor sleep lead to headaches?',
      'Does exercise improve your mood?',
      'Just brainstorm - we\'ll test these ideas later'
    ],
    featureIntro: 'Start noticing which events seem to come before or after others. We\'ll begin tracking these connections tomorrow.'
  },
  {
    day: 9,
    phase: 'foundation',
    title: 'Marking Your First Link',
    description: 'When you notice one event followed by another, you can mark that connection. Today, create your first causal link.',
    goal: 'Mark at least 1 causal link between events',
    tips: [
      'In History, tap an event and select "Mark as Cause"',
      'Then tap the effect event and select "Link to Cause"',
      'Don\'t overthink it - mark what you observe',
      'You need multiple examples to see real patterns'
    ],
    featureIntro: 'Causal links help the app learn what patterns to look for in your data.'
  },
  {
    day: 10,
    phase: 'foundation',
    title: 'Building Your Hypothesis',
    description: 'Science starts with a question. Today, form a clear hypothesis about a cause-effect relationship you want to explore.',
    goal: 'Write down your hypothesis',
    tips: [
      'Make it specific: "Coffee after 2pm causes poor sleep"',
      'Choose something you can actually test',
      'Pick something that matters to you',
      'You can track multiple hypotheses over time'
    ]
  },
  {
    day: 11,
    phase: 'foundation',
    title: 'Collecting Evidence',
    description: 'To test your hypothesis, you need evidence. Today, focus on logging the events related to your question.',
    goal: 'Log all relevant events for your hypothesis',
    tips: [
      'If testing coffee and sleep, log both consistently',
      'Don\'t change your behavior yet - just observe',
      'Add notes about circumstances',
      'Mark links when you see the pattern occur'
    ]
  },
  {
    day: 12,
    phase: 'foundation',
    title: 'Time Windows Matter',
    description: 'Causes don\'t always lead to immediate effects. Today, pay attention to timing between events.',
    goal: 'Notice and note timing patterns',
    tips: [
      'How long after coffee do you feel anxious?',
      'How many hours after poor sleep does the headache start?',
      'Time windows can be minutes, hours, or even days',
      'This timing info helps find patterns in your data'
    ]
  },
  {
    day: 13,
    phase: 'foundation',
    title: 'Week 2 Reflection',
    description: 'You\'ve started thinking causally! Review your links and hypothesis.',
    goal: 'Review your causal links and refine your hypothesis',
    tips: [
      'Look at the links you\'ve created',
      'Is your hypothesis getting clearer?',
      'Do you need to adjust what you\'re tracking?',
      'Remember: this is an iterative process'
    ],
    checkIn: true
  },
  {
    day: 14,
    phase: 'foundation',
    title: 'Foundation Phase Complete!',
    description: 'You\'ve mastered the basics! You can log events, mark links, and think about causality. Ready for the next phase?',
    goal: 'Celebrate your progress',
    tips: [
      'You\'re building a valuable habit',
      'You understand the core concepts',
      'Next: we\'ll build more evidence and see patterns emerge',
      'Keep tracking consistently!'
    ],
    checkIn: true
  },

  // ==================== PHASE 2: EVIDENCE BUILDING (Days 15-35) ====================

  // Week 3: Pattern Observation
  {
    day: 15,
    phase: 'evidence-building',
    title: 'Welcome to Evidence Building',
    description: 'You\'re entering Phase 2! Now we focus on gathering enough data to see real patterns emerge.',
    goal: 'Continue consistent tracking',
    tips: [
      'Patterns need multiple examples to be meaningful',
      'Keep logging the same events consistently',
      'Don\'t give up if patterns aren\'t clear yet',
      'Quality data takes time to accumulate'
    ]
  },
  {
    day: 16,
    phase: 'evidence-building',
    title: 'Introducing the Graph',
    description: 'The Graph view visualizes connections between event types. Today, explore what your graph looks like.',
    goal: 'Explore the Graph page',
    tips: [
      'Nodes represent event types',
      'Arrows show cause → effect relationships',
      'Thicker arrows mean stronger evidence',
      'Click nodes and edges to see details'
    ],
    featureIntro: 'Visit the Graph tab to see your causal network visualization. It updates as you add more data.'
  },
  {
    day: 17,
    phase: 'evidence-building',
    title: 'Adding Context with Notes',
    description: 'Context matters! Today, focus on adding detailed notes to help you understand patterns later.',
    goal: 'Add detailed notes to each event',
    tips: [
      'Note circumstances: "at work", "after workout"',
      'Capture your state: "feeling stressed", "well-rested"',
      'These notes help interpret patterns',
      'Future you will thank present you!'
    ]
  },
  {
    day: 18,
    phase: 'evidence-building',
    title: 'Consistency Check',
    description: 'Consistent tracking is crucial. Review your tracking frequency.',
    goal: 'Identify and fix any gaps in tracking',
    tips: [
      'Are you logging every occurrence of key events?',
      'Set phone reminders if you\'re forgetting',
      'Missing data creates misleading patterns',
      'It\'s okay to start fresh if needed'
    ],
    checkIn: true
  },
  {
    day: 19,
    phase: 'evidence-building',
    title: 'Multiple Hypotheses',
    description: 'Most things have multiple causes. Today, explore 2-3 different hypotheses.',
    goal: 'Identify and track 2-3 different hypotheses',
    tips: [
      'What else might affect your sleep? Stress? Exercise?',
      'What else might trigger headaches? Dehydration? Screen time?',
      'Track multiple factors to see which matter most',
      'Life is complex - embrace that!'
    ]
  },
  {
    day: 20,
    phase: 'evidence-building',
    title: 'Negative Evidence',
    description: 'What about when the pattern DOESN\'T happen? This is valuable data too!',
    goal: 'Notice and log when expected effects don\'t occur',
    tips: [
      'Had coffee but no anxiety? That\'s important!',
      'Poor sleep but no headache? Worth noting!',
      'Negative evidence helps refine your understanding',
      'Add notes: "expected headache but felt fine"'
    ]
  },
  {
    day: 21,
    phase: 'evidence-building',
    title: 'Week 3 Complete',
    description: 'Three weeks in! Your data is getting richer. Review your progress.',
    goal: 'Review your graph and patterns',
    tips: [
      'Look at your graph - what\'s emerging?',
      'Which links have the most evidence?',
      'Are there any surprises?',
      'Keep building on this foundation'
    ],
    checkIn: true
  },

  // Week 4: Understanding Correlations
  {
    day: 22,
    phase: 'evidence-building',
    title: 'Introducing Insights',
    description: 'The Insights page shows patterns the app has detected. Today, explore what it\'s found.',
    goal: 'Explore the Insights page',
    tips: [
      'Insights shows correlations from your data',
      'These are patterns, not proven causes',
      'Higher percentages mean stronger correlations',
      'Use this to discover unexpected connections'
    ],
    featureIntro: 'The Insights page automatically analyzes your data to find statistical patterns and correlations.'
  },
  {
    day: 23,
    phase: 'evidence-building',
    title: 'Correlation vs Causation',
    description: 'Just because two events correlate doesn\'t mean one causes the other. Let\'s understand the difference.',
    goal: 'Review your insights with a critical eye',
    tips: [
      'Correlation: events happening together',
      'Causation: one event actually causing another',
      'Look for third factors that might explain both',
      'Your manual links help identify true causes'
    ]
  },
  {
    day: 24,
    phase: 'evidence-building',
    title: 'Testing Your Hypothesis',
    description: 'With more data, you can start testing. Do your insights support or contradict your hypothesis?',
    goal: 'Compare insights to your original hypothesis',
    tips: [
      'Is the correlation there in the data?',
      'Is it as strong as you expected?',
      'Are there alternative explanations?',
      'Be open to being wrong - that\'s science!'
    ]
  },
  {
    day: 25,
    phase: 'evidence-building',
    title: 'Unexpected Discoveries',
    description: 'Sometimes the most interesting findings are the ones you weren\'t looking for. Today, explore unexpected patterns.',
    goal: 'Find one surprising correlation',
    tips: [
      'Look at insights you didn\'t expect',
      'Consider why these events might be related',
      'Form new hypotheses to investigate',
      'Discovery often comes from surprises!'
    ]
  },
  {
    day: 26,
    phase: 'evidence-building',
    title: 'Refining Event Types',
    description: 'As you learn more, you might need more specific event types. Today, refine your tracking.',
    goal: 'Create more specific event types if needed',
    tips: [
      'Instead of "exercise", try "cardio" vs "strength training"',
      'Instead of "headache", try "migraine" vs "tension headache"',
      'More specific = better insights',
      'You can edit historical events to use new types'
    ]
  },
  {
    day: 27,
    phase: 'evidence-building',
    title: 'Time Window Analysis',
    description: 'Different effects happen at different speeds. Today, pay attention to timing patterns in your insights.',
    goal: 'Note the time windows in your correlations',
    tips: [
      'Some effects are immediate (minutes)',
      'Some are delayed (hours or days)',
      'The median delay tells you typical timing',
      'Use this to refine when you log effects'
    ]
  },
  {
    day: 28,
    phase: 'evidence-building',
    title: 'Four Week Check-In',
    description: 'You\'re halfway through! Time for a comprehensive review.',
    goal: 'Complete review and adjustment',
    tips: [
      'What have you learned so far?',
      'Which hypotheses are supported?',
      'Which need more investigation?',
      'Are you tracking the right things?',
      'Make any needed adjustments to your approach'
    ],
    checkIn: true
  },

  // Week 5: Advanced Pattern Recognition
  {
    day: 29,
    phase: 'evidence-building',
    title: 'Multi-Step Causation',
    description: 'Sometimes A causes B, which causes C. Today, look for chains of causation.',
    goal: 'Identify one multi-step causal chain',
    tips: [
      'Example: Poor sleep → Drink extra coffee → Feel anxious',
      'Look at your graph for connected paths',
      'These chains reveal complex dynamics',
      'Understanding chains helps you intervene effectively'
    ]
  },
  {
    day: 30,
    phase: 'evidence-building',
    title: 'Confounding Variables',
    description: 'Sometimes a third factor influences both the cause and effect. Today, look for confounders.',
    goal: 'Identify potential confounding variables',
    tips: [
      'Example: Stress might cause both poor sleep AND headaches',
      'Look for common causes of correlated events',
      'Add these confounders as new event types',
      'This deepens your understanding'
    ]
  },
  {
    day: 31,
    phase: 'evidence-building',
    title: 'Day 31: Building Comprehensive Evidence',
    description: 'Strong conclusions need diverse evidence. Today, ensure you\'re collecting comprehensive data.',
    goal: 'Review data completeness',
    tips: [
      'Are you logging consistently?',
      'Do you have both positive and negative examples?',
      'Have you tracked this long enough?',
      'Quality evidence takes time and diligence'
    ]
  },
  {
    day: 32,
    phase: 'evidence-building',
    title: 'Intervention Planning',
    description: 'Understanding causes means you can intervene! Today, plan a small experiment.',
    goal: 'Plan one behavioral intervention',
    tips: [
      'If coffee causes anxiety, try cutting back',
      'If exercise improves mood, commit to regular sessions',
      'Change ONE thing at a time',
      'Keep logging to see if it works!'
    ]
  },
  {
    day: 33,
    phase: 'evidence-building',
    title: 'Running Your Experiment',
    description: 'Today, start your planned intervention. Science in action!',
    goal: 'Begin your behavioral experiment',
    tips: [
      'Change the suspected cause',
      'Keep logging the effect carefully',
      'Don\'t change anything else if possible',
      'Give it at least a week to see results',
      'Add notes about the intervention'
    ]
  },
  {
    day: 34,
    phase: 'evidence-building',
    title: 'Week 5 Reflection',
    description: 'You\'re becoming a causal thinker! Review your experiments and insights.',
    goal: 'Reflect on your learning',
    tips: [
      'What patterns are clearest now?',
      'How is your intervention going?',
      'What new questions have emerged?',
      'Are you ready to dive deeper?'
    ],
    checkIn: true
  },
  {
    day: 35,
    phase: 'evidence-building',
    title: 'Evidence Building Complete!',
    description: 'You\'ve built a rich dataset and discovered meaningful patterns. Ready for mastery?',
    goal: 'Celebrate your analytical progress',
    tips: [
      'You\'ve collected substantial evidence',
      'You understand correlation vs causation',
      'You\'re running experiments',
      'Next: refine and master your practice!'
    ],
    checkIn: true
  },

  // ==================== PHASE 3: MASTERY (Days 36-60) ====================

  // Week 6: Advanced Analysis
  {
    day: 36,
    phase: 'mastery',
    title: 'Welcome to Mastery',
    description: 'Phase 3 is about refining your practice and becoming an expert at causal discovery.',
    goal: 'Continue advanced tracking',
    tips: [
      'You have the fundamentals down',
      'Now we refine and optimize',
      'Focus on the questions that matter most',
      'You\'re in control of your learning'
    ]
  },
  {
    day: 37,
    phase: 'mastery',
    title: 'Statistical Significance',
    description: 'Not all patterns are real - some are random noise. Today, focus on the strongest patterns.',
    goal: 'Identify your most reliable patterns',
    tips: [
      'Look for patterns with many instances',
      'Higher correlation percentages are more reliable',
      'Time-tested patterns are more trustworthy',
      'Be skeptical of patterns with few examples'
    ]
  },
  {
    day: 38,
    phase: 'mastery',
    title: 'Personalized Event Types',
    description: 'You know what matters to you now. Today, create a fully personalized event taxonomy.',
    goal: 'Refine your event type collection',
    tips: [
      'Remove event types you never use',
      'Add specific types for your key questions',
      'Organize with clear, consistent naming',
      'Your setup should match YOUR life'
    ]
  },
  {
    day: 39,
    phase: 'mastery',
    title: 'Bidirectional Causation',
    description: 'Sometimes A causes B AND B causes A, creating feedback loops. Today, look for cycles.',
    goal: 'Identify feedback loops',
    tips: [
      'Example: Anxiety → Poor sleep → More anxiety',
      'These cycles can amplify problems',
      'Breaking the cycle at any point helps',
      'Look for circular patterns in your graph'
    ]
  },
  {
    day: 40,
    phase: 'mastery',
    title: 'Intervention Results',
    description: 'Review your experiment from last week. What did you learn?',
    goal: 'Analyze intervention outcomes',
    tips: [
      'Did changing the cause affect the effect?',
      'How strong was the impact?',
      'Were there unexpected consequences?',
      'Plan your next intervention based on results'
    ],
    checkIn: true
  },
  {
    day: 41,
    phase: 'mastery',
    title: 'Complex Questions',
    description: 'You can now tackle sophisticated questions. Today, form a complex multi-factor hypothesis.',
    goal: 'Develop a complex hypothesis',
    tips: [
      'Combine multiple causes: "Sleep + Exercise → Mood"',
      'Look for interactions: does exercise only help with good sleep?',
      'These questions need more data but yield deeper insights',
      'This is advanced causal thinking!'
    ]
  },
  {
    day: 42,
    phase: 'mastery',
    title: 'Six Week Milestone',
    description: 'Six weeks! You\'ve come so far. Comprehensive review time.',
    goal: 'Complete comprehensive review',
    tips: [
      'Review your graph - what\'s your causal network?',
      'What insights have changed your behavior?',
      'What questions remain?',
      'How has this practice helped you?'
    ],
    checkIn: true
  },

  // Week 7: Optimization
  {
    day: 43,
    phase: 'mastery',
    title: 'Optimizing Your Practice',
    description: 'Make your tracking more efficient while maintaining quality.',
    goal: 'Streamline your tracking workflow',
    tips: [
      'Pin your most-logged events for quick access',
      'Set up reminders for important events',
      'Use shortcuts and patterns',
      'Efficiency helps long-term consistency'
    ]
  },
  {
    day: 44,
    phase: 'mastery',
    title: 'Threshold Tuning',
    description: 'The graph edge threshold controls what patterns are shown. Today, experiment with this setting.',
    goal: 'Find your ideal threshold setting',
    tips: [
      'Lower threshold = more patterns shown (might include noise)',
      'Higher threshold = only strongest patterns (might miss real effects)',
      'Adjust in Settings → Graph Edge Threshold',
      'Find the balance that works for you'
    ],
    featureIntro: 'The edge threshold setting filters which correlations appear in your graph. Tune it to your preference.'
  },
  {
    day: 45,
    phase: 'mastery',
    title: 'Long-Term Patterns',
    description: 'Some effects take days or weeks to manifest. Today, look for long-term patterns.',
    goal: 'Identify slow-acting causal relationships',
    tips: [
      'Does consistent exercise improve weekly mood averages?',
      'Do sleep patterns affect energy over days?',
      'Look at trends, not just individual instances',
      'These patterns require patient observation'
    ]
  },
  {
    day: 46,
    phase: 'mastery',
    title: 'Teaching Moment',
    description: 'The best way to master something is to teach it. Today, explain causal discovery to someone.',
    goal: 'Explain your practice to a friend',
    tips: [
      'Share what you\'ve learned about yourself',
      'Explain how causal thinking works',
      'Show them your graph',
      'Teaching deepens your own understanding'
    ]
  },
  {
    day: 47,
    phase: 'mastery',
    title: 'Systematic Review',
    description: 'Review every edge in your graph systematically. Which are real? Which might be coincidence?',
    goal: 'Critically evaluate all graph edges',
    tips: [
      'For each edge, ask: "Is this causal or coincidental?"',
      'Consider alternative explanations',
      'Look at the evidence strength',
      'Quality control your insights'
    ]
  },
  {
    day: 48,
    phase: 'mastery',
    title: 'Behavior Change Planning',
    description: 'Use your insights to plan meaningful life changes.',
    goal: 'Create a behavior change plan',
    tips: [
      'What causes do you want to change?',
      'What effects do you want to achieve?',
      'Make a concrete, specific plan',
      'Use your data to guide the plan'
    ]
  },
  {
    day: 49,
    phase: 'mastery',
    title: 'Week 7 Complete',
    description: 'You\'re optimizing and refining. Almost there!',
    goal: 'Reflect on optimization',
    tips: [
      'Is your practice sustainable long-term?',
      'What adjustments have helped most?',
      'You\'re approaching independence',
      'Keep up the excellent work!'
    ],
    checkIn: true
  },

  // Week 8: Independence
  {
    day: 50,
    phase: 'mastery',
    title: 'Approaching Independence',
    description: 'You\'re almost ready to fly solo. Today, practice self-directed investigation.',
    goal: 'Choose and pursue your own question',
    tips: [
      'Pick a question that excites you',
      'Plan your investigation independently',
      'Use all the tools you\'ve learned',
      'Trust your judgment'
    ]
  },
  {
    day: 51,
    phase: 'mastery',
    title: 'Mindful Tracking',
    description: 'Tracking isn\'t just data collection - it\'s a practice of awareness.',
    goal: 'Practice mindful event logging',
    tips: [
      'Pause and notice when events occur',
      'Observe your experiences fully',
      'Record with intention and care',
      'This practice builds self-awareness'
    ]
  },
  {
    day: 52,
    phase: 'mastery',
    title: 'Meta-Learning',
    description: 'Reflect on what you\'ve learned about learning and discovery.',
    goal: 'Reflect on your learning process',
    tips: [
      'How has your thinking changed?',
      'What surprised you most?',
      'What skills have you developed?',
      'How will you apply this beyond the app?'
    ],
    checkIn: true
  },
  {
    day: 53,
    phase: 'mastery',
    title: 'Habit Formation',
    description: 'This practice should be habitual now. Assess your habit strength.',
    goal: 'Evaluate habit formation',
    tips: [
      'Is logging automatic now?',
      'Do you think causally in daily life?',
      'What helped the habit stick?',
      'How will you maintain it?'
    ]
  },
  {
    day: 54,
    phase: 'mastery',
    title: 'Advanced Experimentation',
    description: 'Design a sophisticated multi-week experiment.',
    goal: 'Plan an advanced experiment',
    tips: [
      'Test multiple interventions sequentially',
      'Use your baseline data for comparison',
      'Plan how you\'ll measure success',
      'This is real science!'
    ]
  },
  {
    day: 55,
    phase: 'mastery',
    title: 'Community & Sharing',
    description: 'Consider how you might share insights or help others discover causality.',
    goal: 'Think about knowledge sharing',
    tips: [
      'What would you tell someone starting out?',
      'What insights could help others?',
      'How can you support others\' learning?',
      'Teaching reinforces your mastery'
    ]
  },
  {
    day: 56,
    phase: 'mastery',
    title: 'Week 8 Reflection',
    description: 'One week to go! You\'re nearly ready for complete independence.',
    goal: 'Reflect on readiness',
    tips: [
      'Do you feel confident in your practice?',
      'What questions still interest you?',
      'You\'re ready to continue independently',
      'This is just the beginning!'
    ],
    checkIn: true
  },

  // Week 9: Transition & Completion
  {
    day: 57,
    phase: 'mastery',
    title: 'Designing Your Future Practice',
    description: 'Plan how you\'ll use CueGraph going forward.',
    goal: 'Create your ongoing practice plan',
    tips: [
      'How often will you log?',
      'How often will you review insights?',
      'What questions will you pursue?',
      'Make it sustainable and meaningful'
    ]
  },
  {
    day: 58,
    phase: 'mastery',
    title: 'Advanced Mode Preview',
    description: 'Soon you\'ll transition to advanced mode - full access, minimal guidance.',
    goal: 'Prepare for advanced mode',
    tips: [
      'Advanced mode removes training wheels',
      'All features fully accessible',
      'You drive your own investigation',
      'You\'re ready for this!'
    ]
  },
  {
    day: 59,
    phase: 'mastery',
    title: 'Celebration & Gratitude',
    description: 'You\'ve come so far! Take time to appreciate your journey.',
    goal: 'Celebrate your achievement',
    tips: [
      'Review your entire journey',
      'Appreciate your consistency',
      'Notice how you\'ve grown',
      'Be proud of what you\'ve built'
    ],
    checkIn: true
  },
  {
    day: 60,
    phase: 'mastery',
    title: 'Graduation Day! 🎓',
    description: 'You\'ve completed the 60-day guided journey. You\'re now a causal discovery expert!',
    goal: 'Graduate to advanced mode',
    tips: [
      'You\'ve built incredible skills',
      'You understand causal thinking deeply',
      'You have the habits to continue',
      'The real journey continues - keep discovering!',
      'Welcome to advanced mode!'
    ],
    checkIn: true
  }
];

// Helper functions

export function getDayContent(day: number): OnboardingDay | undefined {
  return ONBOARDING_CURRICULUM.find(d => d.day === day);
}

export function getPhaseForDay(day: number): OnboardingPhase {
  if (day <= 14) return 'foundation';
  if (day <= 35) return 'evidence-building';
  if (day <= 60) return 'mastery';
  return 'completed';
}

export function getDaysInPhase(phase: OnboardingPhase): number[] {
  return ONBOARDING_CURRICULUM
    .filter(d => d.phase === phase)
    .map(d => d.day);
}

export function getCheckInDays(): number[] {
  return ONBOARDING_CURRICULUM
    .filter(d => d.checkIn)
    .map(d => d.day);
}

export function getPhaseDescription(phase: OnboardingPhase): string {
  switch (phase) {
    case 'foundation':
      return 'Building the basics of event tracking and causal thinking';
    case 'evidence-building':
      return 'Gathering evidence and discovering patterns in your data';
    case 'mastery':
      return 'Refining your practice and achieving independent expertise';
    case 'completed':
      return 'Guided onboarding complete - you\'re an expert!';
  }
}
