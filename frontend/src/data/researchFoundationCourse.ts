// frontend/src/data/researchFoundationCourse.ts
//
// Static content for /research-foundation-course-2026/course-module.
// Dates, speakers and topics live here only, so the page itself never
// needs to be touched when the schedule changes.

export const COURSE_BASE_PATH = '/research-foundation-course-2026';

export interface Speaker {
  name: string;
  role: string;
}

export interface SessionDate {
  day: string;
  month: string;
  weekday: string;
}

export interface CourseSession {
  number: number;
  date: SessionDate;
  title: string;
  tag: string;
  topics: string[];
  activity: string;
  keynote: Speaker;
  guest: Speaker;
}

export const COURSE = {
  name: 'Research Foundation Course-2026',
  batch: 'Batch-01',
  summary:
    'A comprehensive introductory program for undergraduate and master’s students who are passionate about research but unsure where to begin.',
  description:
    'This course provides a structured roadmap to develop a strong research foundation by covering essential topics, including research fundamentals, literature review, research methodology, scientific writing and publication strategies. By the end of the program, participants will gain the knowledge, confidence and direction needed to take their first step toward becoming independent researchers and contributing to high-quality scientific research.',
  audience: 'Undergraduate and MSc students',
  audienceFocus: [
    'Higher Study Plan',
    'BSc & MSc Thesis Project',
    'Area Focused',
  ],
  medium:
    'Live sessions on Zoom. Session links are shared in a dedicated WhatsApp group.',
} as const;

export const COURSE_FACTS = [
  { label: 'Total Sessions', value: '05', note: 'Live classes' },
  { label: 'Session Pattern', value: '1 / week', note: 'One session each week' },
  { label: 'Duration', value: '1.30–2.00 H', note: 'Per session' },
  { label: 'Medium', value: 'Zoom', note: 'Live + WhatsApp Group' },
  { label: 'Session Time', value: 'TBA', note: 'To be announced' },
  { label: 'Course Fee', value: '৳499', note: 'Early Bird · Regular ৳999' },
] as const;

export const COURSE_AWARDS = [
  {
    title: 'Certificate of Completion',
    description: 'Awarded to all participants who complete the course.',
  },
  {
    title: 'Outstanding Research Learner Award',
    description: 'Top 2 participants: the most attentive and dedicated learners.',
  },
] as const;

export const COURSE_SESSIONS: CourseSession[] = [
  {
    number: 1,
    date: { day: '15', month: 'AUG', weekday: 'Saturday' },
    title: 'Research Mindset and the Complete Research Journey',
    tag: 'Research Overview',
    topics: [
      'What is Research?',
      'Why Research Matters in Academic and Professional Life',
      'Basic Types of Research',
      'Characteristics of High-Quality Research',
      'Understanding the Complete Research Workflow',
      'Research Ethics and Academic Integrity',
      'Common Challenges and Mistakes of Beginner Researchers',
      'Research Opportunities for Undergraduate and Master’s Students',
      'Building a Personal Research Career Roadmap',
    ],
    activity: 'Mapping Your Research Goals',
    keynote: { name: 'Anichur Rahman', role: 'CEO, RU (USA)' },
    guest: { name: 'Dr. Abu Saleh Musa Miah', role: 'Advisor, RU (Japan)' },
  },
  {
    number: 2,
    date: { day: '22', month: 'AUG', weekday: 'Saturday' },
    title: 'Finding a Research Topic and Conducting a Meaningful Literature Review',
    tag: 'Topic Selection & LR',
    topics: [
      'Identifying a Broad Research Area',
      'Converting an Area of Interest into a Researchable Problem',
      'Selecting a Relevant and Feasible Research Topic',
      'Understanding Novelty and Research Gaps',
      'Developing Research Questions and Objectives',
      'Introduction to Hypothesis Development',
      'Effective Literature Searching Using Academic Databases',
      'Introduction to Google Scholar, Scopus, PubMed and Other Databases',
      'Using Keywords and Search Strings Effectively',
      'How to Read a Research Paper Using the Three-Pass Method',
      'Evaluating the Quality and Relevance of Research Articles',
      'Organizing and Synthesizing Previous Studies',
      'Avoiding Summary-Only Literature Reviews',
    ],
    activity: 'Identify a Research Gap from Selected Papers',
    keynote: { name: 'Dipanjali Kundu', role: 'Advisor, RU' },
    guest: { name: 'Md. Jahidul Islam', role: 'Advisor, RU (USA)' },
  },
  {
    number: 3,
    date: { day: '29', month: 'AUG', weekday: 'Saturday' },
    title: 'Designing a Research Methodology and Developing a Thesis Proposal',
    tag: 'Methodology Design & Proposal',
    topics: [
      'Understanding Research Methodology',
      'Qualitative, Quantitative and Mixed-Methods Research',
      'Exploratory, Descriptive, Experimental and Case Study Designs',
      'Selecting an Appropriate Research Design',
      'Identifying the Study Population and Sample',
      'Basic Sampling Methods and Sample Selection',
      'Data Collection Methods: Surveys, Interviews, Observations, Experiments and Secondary Data',
      'Designing Research Instruments and Questionnaires',
      'Understanding Variables and Basic Hypothesis Testing Concepts',
      'Validity, Reliability and Research Bias',
      'Ethical Considerations in Data Collection',
      'Developing a Research Methodology Workflow',
      'Structure of a Research or Thesis Proposal',
      'Writing the Background, Problem Statement, Objectives and Methodology',
      'Preparing a Basic Research Timeline',
      'Common Mistakes in Research Methodology and Proposal Writing',
    ],
    activity: 'Design a Methodology for a Sample Research Problem',
    keynote: { name: 'Dr. Abu Saleh Musa Miah', role: 'Advisor, RU (Japan)' },
    guest: { name: 'Mr. NHM Arafat', role: 'Mentor, RU (USA)' },
  },
  {
    number: 4,
    date: { day: '05', month: 'SEP', weekday: 'Saturday' },
    title:
      'Introducing AI/ML, Data Science, Data Analytics using Python: Experimental Design',
    tag: 'AI, ML & Experimental Research',
    topics: [
      'Introduction to Artificial Intelligence AI, ML and DL',
      'Overview of Cybersecurity and Its Research Opportunities',
      'Introduction to Data Analysis using Python',
      'Understanding Datasets and Data Preprocessing',
      'Experimental Design in Research',
      'Features, Labels, Training, Validation & Testing Concepts',
      'Model Evaluation: Accuracy, Precision, Recall & F1-Score (Basic Idea)',
      'Real-World Research Case Studies in AI and Cybersecurity',
      'Live Demonstration: A Simple Python-based Data Analysis Workflow',
      'Research Opportunities in AI, ML, Cybersecurity & Data Science',
    ],
    activity:
      'Participants will explore a sample dataset and understand a complete research workflow from dataset to experimental evaluation.',
    keynote: { name: 'Mr. Mahir and Tashrif', role: 'Team Lead, RU' },
    guest: { name: 'Anichur Rahman', role: 'CEO, RU (USA)' },
  },
  {
    number: 5,
    date: { day: '12', month: 'SEP', weekday: 'Saturday' },
    title:
      'How to Use Technological Tools and Live Prompt Engineering for Researchers (AI & Relevant Tools)',
    tag: 'AI-Powered Research Workflow',
    topics: [
      'Responsible Use of AI in Research',
      'ChatGPT, Gemini & Claude for Research',
      'Perplexity AI for Literature Search',
      'NotebookLM for Paper Understanding',
      'Elicit & Consensus for Evidence Discovery',
      'ResearchRabbit & Connected Papers',
      'Grammarly & QuillBot (Ethical Usage)',
      'Overleaf for Academic Writing',
      'ORCID, Google Scholar & ResearchGate Profile Setup',
      'Research Workflow using AI Tools',
    ],
    activity:
      'Live demonstration of an AI-assisted research workflow from idea to literature review.',
    keynote: { name: 'Md. Jahidul Islam', role: 'Advisor, RU (USA)' },
    guest: { name: 'Saikat Islam Khan Bappi', role: 'Advisor, RU (USA)' },
  },
];

export const LEARNING_OUTCOMES: string[] = [
  'Understand the complete research workflow.',
  'Read and analyze scientific research papers efficiently.',
  'Identify research gaps and formulate research problems.',
  'Design a basic research methodology.',
  'Write the core sections of a research paper.',
  'Understand the publication process and journal selection.',
  'Build a roadmap for starting an independent research career.',
];
