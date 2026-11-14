import { Category } from './todoLogic';

export interface ThirtyYearVisionItem {
  id: string;
  archetypeTitle: string;
  lifeArea: Category;
  milestone1MonthLabel: string;
  milestone1Text: string;
  milestone2MonthLabel: string;
  milestone2Text: string;
  breakdownNotes: string;
}

export interface LifeGoalsSystemState {
  canPutIntoGoalSystem: 'yes' | 'no' | null;
  visions: ThirtyYearVisionItem[];
}

export const INITIAL_THIRTY_YEAR_VISIONS: ThirtyYearVisionItem[] = [
  {
    id: 'vision-knowledge',
    archetypeTitle: 'The man of knowledge',
    lifeArea: 'Knowledge',
    milestone1MonthLabel: 'Month 1–2 Focus',
    milestone1Text:
      'Synthesize 2 foundational textbooks & build a searchable personal knowledge graph',
    milestone2MonthLabel: 'Month 7–8 Focus',
    milestone2Text:
      'Publish 6 deep-dive technical & philosophical essays from primary sources',
    breakdownNotes: 'Daily 60m uninterrupted reading & synthesis block.',
  },
  {
    id: 'vision-communicator',
    archetypeTitle: 'The man who can communicate with everyone',
    lifeArea: 'Personality',
    milestone1MonthLabel: 'Month 3–4 Focus',
    milestone1Text:
      'Complete 30 days of impromptu vocal storytelling & active listening drills',
    milestone2MonthLabel: 'Month 9 Focus',
    milestone2Text:
      'Host 4 cross-disciplinary salons connecting engineers, founders, and artists',
    breakdownNotes: 'Practice empathy, vocal clarity, and zero-jargon framing.',
  },
  {
    id: 'vision-leader',
    archetypeTitle: 'The man fit to lead our country',
    lifeArea: 'Karma',
    milestone1MonthLabel: 'Month 5–6 Focus',
    milestone1Text:
      'Lead a civic/community infrastructure initiative impacting 100+ citizens',
    milestone2MonthLabel: 'Month 10 Focus',
    milestone2Text:
      'Study national economic policy, constitutional history & crisis governance',
    breakdownNotes: 'Build stamina, moral courage, and public service track record.',
  },
  {
    id: 'vision-structured',
    archetypeTitle: 'The man who is structured',
    lifeArea: 'Aesthetics',
    milestone1MonthLabel: 'Month 1 Focus',
    milestone1Text:
      'Lock in 90% adherence to Hourly Calendar time-blocking & evening tomorrow-list',
    milestone2MonthLabel: 'Month 11 Focus',
    milestone2Text:
      'Automate recurring life logistics & zero-decision morning/evening rituals',
    breakdownNotes: 'Discipline is a form of self-respect in action.',
  },
  {
    id: 'vision-financial',
    archetypeTitle: 'The man who doesn’t need to worry about money',
    lifeArea: 'Portfolio',
    milestone1MonthLabel: 'Month 2–4 Focus',
    milestone1Text:
      'Ship high-leverage flagship product/portfolio assets & grow recurring income streams',
    milestone2MonthLabel: 'Month 12 Focus',
    milestone2Text:
      'Automate treasury allocation, 12-month runway reserve & compounding investments',
    breakdownNotes: 'Focus on asymmetric value creation and low overhead.',
  },
];

export interface CadenceReviewState {
  monthlyUsedMatrix: 'yes' | 'no' | null;
  monthlyFocus: string;
  weeklyTherapeuticTask: string;
  dailyUsedMatrix: 'yes' | 'no' | null;
  dailyPriankaGotTomorrowList: 'yes' | 'no' | null;
  dailyDecisionsCount: number;
  dailySystemsToRemoveDecisions: string;
}

export const INITIAL_CADENCE_REVIEW_STATE: CadenceReviewState = {
  monthlyUsedMatrix: 'yes',
  monthlyFocus:
    'Master deep-focus architecture blocks & eliminate Q4 low-leverage obligations',
  weeklyTherapeuticTask:
    'Long Analog Sketchbook Walk & Unplugged Tea Session in the Park',
  dailyUsedMatrix: 'yes',
  dailyPriankaGotTomorrowList: 'no',
  dailyDecisionsCount: 7,
  dailySystemsToRemoveDecisions:
    'Pre-commit tomorrow’s Hourly Calendar at 8:30 PM and standardize morning fuel + workout uniform.',
};

export interface DailySpecificTaskPromptData {
  needleMoverAction: string;
  executionMode: 'pre-planned' | 'rouge';
  estimatedTime: string;
  canExtendTime: string;
  cognitiveLoad: 'Low' | 'Medium' | 'High' | 'Overloaded';
  whatMadeFocusingHarder: string;
  whatElseInMindAndToolRightNow: string;
  isNoLongerPriority: 'yes' | 'no';
}

export const DEFAULT_DAILY_SPECIFIC_TASK_PROMPT: DailySpecificTaskPromptData = {
  needleMoverAction: '',
  executionMode: 'pre-planned',
  estimatedTime: '45 mins',
  canExtendTime: 'Yes, by +15 mins if in flow state',
  cognitiveLoad: 'Medium',
  whatMadeFocusingHarder: '',
  whatElseInMindAndToolRightNow:
    'Unload stray thoughts into Brain Dump Swiper & start 25m DoteTimer',
  isNoLongerPriority: 'no',
};

export interface GoalMasteryQuestionnaireItem {
  id: string;
  category:
    | 'Mastery & Value'
    | 'Identity & Perception'
    | 'Execution, Time & Checkpoints'
    | 'Sustainability & Accountability';
  question: string;
  placeholder: string;
  hasYesNoToggle?: boolean;
  yesLabel?: string;
  noLabel?: string;
}

export const GOAL_SETTING_MASTERY_QUESTIONS: GoalMasteryQuestionnaireItem[] = [
  {
    id: 'can_master',
    category: 'Mastery & Value',
    question: 'Do I think I can master it?',
    placeholder: 'Why do I believe I can (or cannot) master this?',
    hasYesNoToggle: true,
    yesLabel: 'Yes | why?',
    noLabel: 'No | why?',
  },
  {
    id: 'want_to_master_value',
    category: 'Mastery & Value',
    question: 'Do I want to master it? Why? What value does it fulfil for me?',
    placeholder: 'Core intrinsic value this goal fulfills...',
  },
  {
    id: 'need_to_master',
    category: 'Mastery & Value',
    question: 'Do I need to master it?',
    placeholder: 'Is full mastery required, or is functional competence enough?',
  },
  {
    id: 'when_showcase',
    category: 'Mastery & Value',
    question: 'When will I have the chance to showcase this effort?',
    placeholder: 'Upcoming arena, project launch, or real-world moment...',
  },
  {
    id: 'scenario_fulfilled_value',
    category: 'Mastery & Value',
    question:
      'In what scenario will this make me feel like I have fulfilled my value?',
    placeholder: 'Describe the exact concrete scenario...',
  },
  {
    id: 'change_self_perception',
    category: 'Identity & Perception',
    question: 'How will it change my perception of myself?',
    placeholder: 'Self-respect and internal identity shift...',
  },
  {
    id: 'change_others_perception',
    category: 'Identity & Perception',
    question: 'How will it change others perception of me?',
    placeholder: 'How peers, mentees, and leaders will experience me...',
  },
  {
    id: 'life_without_achieving',
    category: 'Identity & Perception',
    question: 'How will my life look like without ever achieving it?',
    placeholder: 'Cost of inaction over 5–10 years...',
  },
  {
    id: 'what_if_let_go',
    category: 'Identity & Perception',
    question: 'What if I let go of it?',
    placeholder: 'Would letting go bring relief or regret?',
  },
  {
    id: 'focus_only_on_this',
    category: 'Identity & Perception',
    question:
      'If I leave everything else and just focus on this how will it effect everything? What will it change?',
    placeholder: 'Second-order effects of single-minded focus...',
  },
  {
    id: 'visualize_after_completing',
    category: 'Identity & Perception',
    question: 'How do I visualize myself after Completing this goal?',
    placeholder: 'Post-completion visualization...',
  },
  {
    id: 'identity_thoughts',
    category: 'Identity & Perception',
    question: 'What thoughts does the identity of this achievement thinks?',
    placeholder: 'Default mental models of the person who has achieved this...',
  },
  {
    id: 'consistency_needed',
    category: 'Execution, Time & Checkpoints',
    question: 'How much consistency do I need?',
    placeholder: 'e.g. 5 days/week Punch Card streak...',
  },
  {
    id: 'energy_needed',
    category: 'Execution, Time & Checkpoints',
    question: 'How much energy do I need?',
    placeholder: 'High peak-morning cognitive load vs steady effort...',
  },
  {
    id: 'lower_energy_version',
    category: 'Execution, Time & Checkpoints',
    question: 'What is the lower energy version of this same goal?',
    placeholder: '10-minute minimum viable version for low-energy days...',
  },
  {
    id: 'resources_needed',
    category: 'Execution, Time & Checkpoints',
    question: 'What are the resources?',
    placeholder: 'Books, mentors, courses, tools...',
  },
  {
    id: 'tasks_needed',
    category: 'Execution, Time & Checkpoints',
    question: 'What are the tasks?',
    placeholder: 'Concrete repeatable daily/weekly actions...',
  },
  {
    id: 'time_needed',
    category: 'Execution, Time & Checkpoints',
    question: 'How much time do I need?',
    placeholder: 'Total hours & daily block duration...',
  },
  {
    id: 'progress_1_week',
    category: 'Execution, Time & Checkpoints',
    question: 'How much progress will I make in a week?',
    placeholder: '1-week measurable output...',
  },
  {
    id: 'progress_1_month',
    category: 'Execution, Time & Checkpoints',
    question: 'How much progress will I make in a month?',
    placeholder: '1-month measurable milestone...',
  },
  {
    id: 'progress_3_months',
    category: 'Execution, Time & Checkpoints',
    question: 'How much progress will I make in 3 months?',
    placeholder: '3-month compounding transformation...',
  },
  {
    id: 'achieve_before_this',
    category: 'Execution, Time & Checkpoints',
    question: 'What else should I achieve before trying to achieve this?',
    placeholder: 'Prerequisites or foundational habits...',
  },
  {
    id: 'permission_and_audience',
    category: 'Execution, Time & Checkpoints',
    question: 'what kind of permission and audience am I looking for?',
    placeholder: 'Do I need anyone’s permission, or can I begin immediately?',
  },
  {
    id: 'checkpoints',
    category: 'Execution, Time & Checkpoints',
    question: 'What kind of checkpoints does this task have?',
    placeholder: 'Remember: If I can’t reach a checkpoint then that’s a finish line...',
  },
  {
    id: 'finish_line',
    category: 'Execution, Time & Checkpoints',
    question: 'Where is it’s finish line?',
    placeholder: 'Clear definition of Done...',
  },
  {
    id: 'unit_besides_time',
    category: 'Execution, Time & Checkpoints',
    question: 'What is the unit that this can be measured in besides time?',
    placeholder: 'e.g. Pages synthesized, PRs shipped, reps, conversations...',
  },
  {
    id: 'keep_skill_level',
    category: 'Sustainability & Accountability',
    question: 'How can I keep this level of skill after achieving my goal?',
    placeholder: 'Maintenance cadence after mastery...',
  },
  {
    id: 'best_way_to_deload',
    category: 'Sustainability & Accountability',
    question: 'What’s the best way to de-load from this?',
    placeholder: 'Intentional recovery protocol without losing momentum...',
  },
  {
    id: 'make_more_stimulating',
    category: 'Sustainability & Accountability',
    question: 'How can I make it more stimulating?',
    placeholder: 'Gamification, Bingo Punch Card, novel constraints...',
  },
  {
    id: 'batch_with_another_task',
    category: 'Sustainability & Accountability',
    question: 'What another task can I batch this together with?',
    placeholder: 'Habit stacking / task pairing...',
  },
  {
    id: 'skippable_or_unskippable',
    category: 'Sustainability & Accountability',
    question: 'Is this something skippable or unskippable?',
    placeholder: 'Non-negotiable daily anchor vs flexible block...',
  },
  {
    id: 'lowest_day_of_life',
    category: 'Sustainability & Accountability',
    question: 'Can I do it in the lowest day of my life?',
    placeholder: 'Floor version I can execute even on a 1/10 energy day...',
  },
  {
    id: 'accountability_partner',
    category: 'Sustainability & Accountability',
    question: 'How can someone hold me accountable for this?',
    placeholder: 'e.g. Send tomorrow’s list to Prianka or peer check-in...',
  },
  {
    id: 'give_myself_leeway',
    category: 'Sustainability & Accountability',
    question: 'How do I give myself leeway in this?',
    placeholder: 'Compassionate margin so a missed step never breaks the system...',
  },
  {
    id: 'reward_and_punish',
    category: 'Sustainability & Accountability',
    question: 'How can I reward & punish in this journey?',
    placeholder: 'Milestone rewards and honest stakes...',
  },
];

export const CORE_PHILOSOPHY_QUOTES = [
  '“If I can’t reach a checkpoint than that’s a finish line.”',
  '“Do you know how to eat an elephant? One bite at a time.”',
  '“Discipline is a form of self-respect in action”',
] as const;

export interface TaskJournalGuidedPromptItem {
  id: string;
  section:
    | 'Resistance & Perfectionism'
    | 'Story, Visualization & Comfort-Zone Risks'
    | 'Blessings, Gut Intuition, Optimism & Energy';
  question: string;
  placeholder: string;
}

export const TASK_JOURNAL_GUIDED_PROMPTS: TaskJournalGuidedPromptItem[] = [
  {
    id: 'tj_resistance',
    section: 'Resistance & Perfectionism',
    question: 'What kind of resistance am I feeling?',
    placeholder: 'Name the exact friction or hesitation...',
  },
  {
    id: 'tj_priority',
    section: 'Resistance & Perfectionism',
    question: 'Is it because it isn’t a priority?',
    placeholder: 'Check if this still belongs in Q1/Q2...',
  },
  {
    id: 'tj_not_perfect',
    section: 'Resistance & Perfectionism',
    question: 'Is there a problem if I am not perfect in this?',
    placeholder: 'What happens if I ship a B+ draft right now?',
  },
  {
    id: 'tj_frustration_normal',
    section: 'Resistance & Perfectionism',
    question: 'Is the frustration that I felt supposed to be there?',
    placeholder: 'Frustration is the feeling of neuroplasticity at the edge of skill...',
  },
  {
    id: 'tj_did_improve',
    section: 'Resistance & Perfectionism',
    question: 'Did I improve?',
    placeholder: 'Even 1% sharper than yesterday?',
  },
  {
    id: 'tj_let_go_outcome',
    section: 'Resistance & Perfectionism',
    question: 'Have I let go of the outcome?',
    placeholder: 'Focus on the craft and process, release attachment to result...',
  },
  {
    id: 'tj_time_or_speedrun',
    section: 'Resistance & Perfectionism',
    question: 'Did I take my time while completing it? Or did I speedrun it?',
    placeholder: 'Deliberate pacing vs rushed completion...',
  },
  {
    id: 'tj_perfect_vs_challenge',
    section: 'Resistance & Perfectionism',
    question:
      'Was I trying to perfect it or challenge myself for improvement? Why for each?',
    placeholder: 'Defensive perfectionism vs growth-oriented challenge...',
  },
  {
    id: 'tj_not_interesting',
    section: 'Resistance & Perfectionism',
    question: 'What part didn’t feel interesting?',
    placeholder: 'Identify the boring sub-step so I can batch or gamify it...',
  },
  {
    id: 'tj_self_talk',
    section: 'Resistance & Perfectionism',
    question: 'What self-talk was going on in my head?',
    placeholder: 'Observe the internal narrator without judgment...',
  },
  {
    id: 'tj_celebrate_imperfection',
    section: 'Resistance & Perfectionism',
    question: 'What imperfection can I celebrate?',
    placeholder: 'Proof that I took action instead of waiting for perfection...',
  },
  {
    id: 'tj_morning_story',
    section: 'Story, Visualization & Comfort-Zone Risks',
    question: 'What story did I wake telling myself today about myself?',
    placeholder: 'The narrative I woke up with today...',
  },
  {
    id: 'tj_visualize_today',
    section: 'Story, Visualization & Comfort-Zone Risks',
    question: 'How did I visualize myself today?',
    placeholder: 'How I saw myself showing up...',
  },
  {
    id: 'tj_risks_found',
    section: 'Story, Visualization & Comfort-Zone Risks',
    question: 'Where did I find risks today? (going out of my comfort zone)',
    placeholder: 'Moment I stepped outside comfort today...',
  },
  {
    id: 'tj_risk_impact',
    section: 'Story, Visualization & Comfort-Zone Risks',
    question: 'What was the impact of that risk?',
    placeholder: 'What shifted after taking the risk?',
  },
  {
    id: 'tj_risk_negative',
    section: 'Story, Visualization & Comfort-Zone Risks',
    question: 'What negative could have happened due to the risk?',
    placeholder: 'Worst-case scenario vs reality...',
  },
  {
    id: 'tj_risk_positive',
    section: 'Story, Visualization & Comfort-Zone Risks',
    question: 'What positive has happened due to the risk?',
    placeholder: 'Growth, courage, or unexpected opening gained...',
  },
  {
    id: 'tj_blessings_response',
    section: 'Blessings, Gut Intuition, Optimism & Energy',
    question: 'How did I respond to the blessings around me today?',
    placeholder: 'Gratitude in action and awareness...',
  },
  {
    id: 'tj_gut_hints',
    section: 'Blessings, Gut Intuition, Optimism & Energy',
    question: 'Did my gut give any hints about anything today?',
    placeholder: 'Subtle intuitive signals I noticed...',
  },
  {
    id: 'tj_how_optimistic',
    section: 'Blessings, Gut Intuition, Optimism & Energy',
    question: 'How was I optimistic today?',
    placeholder: 'Where I chose constructive hope...',
  },
  {
    id: 'tj_new_pattern',
    section: 'Blessings, Gut Intuition, Optimism & Energy',
    question: 'What new pattern did I notice today?',
    placeholder: 'Behavioral or emotional loop observed...',
  },
  {
    id: 'tj_burnt_out',
    section: 'Blessings, Gut Intuition, Optimism & Energy',
    question: 'When did I feel burnt out today?',
    placeholder: 'Time / trigger of energy depletion...',
  },
  {
    id: 'tj_overstimulated',
    section: 'Blessings, Gut Intuition, Optimism & Energy',
    question: 'When did I feel overstimulated today?',
    placeholder: 'Sensory or digital overload trigger...',
  },
];

export const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const;

export type DayOfWeekName = (typeof DAYS_OF_WEEK)[number];
