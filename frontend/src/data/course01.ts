// frontend/src/data/course01.ts

export const COURSE_SLUG =
  'research-article-writing-academic-publishing-guidelines';

export const COURSE_TITLE =
  'Research Article Writing & Academic Publishing Guidelines';

export const COURSE_SUBTITLE =
  'From Research Fundamentals to Journal Submission';

export const COURSE_INFO = {
  classes: 24,
  modules: 8,
  duration: '8–12 Weeks (Estimated)',
  classDuration: '90–120 Minutes',
  format: 'Live Online Training',
  platform: 'Zoom or Similar Online Platform',
  language: 'Bangla explanations with English academic examples',
  level: 'Beginner-Friendly',
  originalPrice: 5000,
  price: 3000,
  currency: 'BDT',
  approach:
    'Interactive lectures, live demonstrations, guided practice, assignments, and instructor feedback',
  goal:
    'Develop the knowledge, research judgement, and practical skills needed to plan, write, improve, and prepare an original scholarly manuscript for submission.',
};

export interface ClassContent {
  number: number;
  title: string;
  topics: string[];
}

export interface CourseModule {
  id: number;
  title: string;
  subtitle: string;
  classes: ClassContent[];
  practical: string;
}

export const COURSE_MODULES: CourseModule[] = [
  {
    id: 1,
    title: 'Research Foundations & Academic Development',
    subtitle: 'Building a Strong Research Foundation',
    classes: [
      {
        number: 1,
        title: 'Developing a Research-Oriented Mindset',
        topics: [
          'The value and purpose of academic research',
          'Research mindset, critical thinking, and intellectual curiosity',
          'The role of research in higher education and academic careers',
          'Designing a realistic learning roadmap for beginning researchers',
        ],
      },
      {
        number: 2,
        title: 'Understanding the Research Ecosystem',
        topics: [
          'Academic research, scholarly journals, conferences, and proceedings',
          'Differences among research articles, review papers, theses, and technical reports',
          'Peer review, editorial decisions, and the publication workflow',
          'Multidisciplinary and interdisciplinary research approaches',
        ],
      },
      {
        number: 3,
        title: 'Finding Research Problems and Building Research Questions',
        topics: [
          'Recognizing research gaps and unresolved knowledge gaps',
          'Transforming broad interests into focused research problems',
          'Developing objectives, research questions, and hypotheses',
          'Evaluating novelty, significance, feasibility, and scope',
        ],
      },
    ],
    practical:
      'Identify one potential research topic within your discipline and develop three focused research questions.',
  },
  {
    id: 2,
    title: 'Literature Search & Research Gap Identification',
    subtitle: 'Finding and Evaluating Scholarly Evidence',
    classes: [
      {
        number: 4,
        title: 'Smart Literature Search and Academic Database Navigation',
        topics: [
          'Navigating Google Scholar, PubMed, IEEE Xplore, Scopus, and Web of Science',
          'Keyword development, Boolean operators, and advanced search techniques',
          'Discovering open-access articles and obtaining full texts legally',
          'Designing reproducible search strategies and literature tracking systems',
        ],
      },
      {
        number: 5,
        title: 'Critical Reading and Evidence-Based Literature Review',
        topics: [
          'Efficient approaches to reading and understanding research papers',
          'Analyzing abstracts, methodologies, results, and discussions',
          'Distinguishing key findings, limitations, and future research directions',
          'Synthesizing evidence across multiple studies rather than simply summarizing papers',
        ],
      },
      {
        number: 6,
        title: 'Systematic Literature Mapping and Review Design',
        topics: [
          'Understanding narrative, systematic, scoping, and bibliometric reviews',
          'Defining inclusion and exclusion criteria',
          'Introducing the PRISMA framework and transparent review reporting',
          'Developing literature matrices, evidence tables, and research gap maps',
        ],
      },
    ],
    practical:
      'Analyze at least ten relevant scholarly papers, develop a literature matrix, and write an initial research gap statement.',
  },
  {
    id: 3,
    title: 'Research Tools, Referencing & Digital Workflow',
    subtitle: 'Building an Efficient Research Toolkit',
    classes: [
      {
        number: 7,
        title: 'Reference Management and Citation Automation',
        topics: [
          'Introduction to Zotero and Mendeley',
          'Creating and organizing a digital reference library',
          'Inserting citations into Microsoft Word or compatible academic editors',
          'Understanding APA, IEEE, Vancouver, and other citation styles',
        ],
      },
      {
        number: 8,
        title: 'Academic Note-Taking and Research Knowledge Management',
        topics: [
          'Preparing structured literature review notes and research logs',
          'Verifying citation metadata, publication details, and DOIs',
          'Developing research paper comparison matrices',
          'Organizing datasets, documents, figures, and project references',
        ],
      },
      {
        number: 9,
        title: 'Finding, Evaluating and Verifying Scholarly Sources',
        topics: [
          'Evaluating the credibility of academic journals and conferences',
          'Distinguishing peer-reviewed literature from non-peer-reviewed material',
          'Checking publisher pages, DOI records, and indexing information',
          'Recognizing predatory publications, misleading metrics, and fabricated references',
        ],
      },
    ],
    practical:
      'Build a reference library in Zotero or Mendeley and generate an accurately formatted bibliography.',
  },
  {
    id: 4,
    title: 'Research Methodology & Study Design',
    subtitle: 'Designing Rigorous and Feasible Research',
    classes: [
      {
        number: 10,
        title: 'Choosing the Right Research Methodology',
        topics: [
          'Quantitative, qualitative, and mixed-methods approaches',
          'Experimental, observational, and survey-based study designs',
          'Selecting an appropriate research design',
          'Aligning research methods with objectives and research questions',
        ],
      },
      {
        number: 11,
        title: 'Sampling, Measurement and Data Collection',
        topics: [
          'Defining populations, samples, and sampling strategies',
          'Developing questionnaires and selecting measurement scales',
          'Understanding validity, reliability, and pilot testing',
          'Designing data collection protocols and identifying potential bias',
        ],
      },
      {
        number: 12,
        title: 'Research Analysis and Interpretation Fundamentals',
        topics: [
          'Foundations of descriptive and inferential statistics',
          'Introduction to qualitative coding and thematic analysis',
          'Selecting appropriate analytical methods for research questions',
          'Interpreting evidence while distinguishing association from causation',
        ],
      },
    ],
    practical:
      'Develop a preliminary methodology plan and a structured data collection outline for your proposed research.',
  },
  {
    id: 5,
    title: 'Academic Writing and Manuscript Development',
    subtitle: 'Writing a Research Article from Start to Finish',
    classes: [
      {
        number: 13,
        title: 'Structuring a Research Article from Start to Finish',
        topics: [
          'Understanding the IMRaD structure: Introduction, Methods, Results, and Discussion',
          'Developing a clear title, abstract, and keywords',
          'Adapting manuscripts to journal-specific structures and requirements',
          'Creating logical flow, coherence, and organization throughout a paper',
        ],
      },
      {
        number: 14,
        title: 'Writing a Strong Introduction and Literature Review',
        topics: [
          'Moving logically from research background to research gap',
          'Writing persuasive problem statements and research objectives',
          'Synthesizing previous studies into a critical academic argument',
          'Communicating original contributions, significance, and novelty',
        ],
      },
      {
        number: 15,
        title: 'Writing Methods, Results, Discussion and Conclusion',
        topics: [
          'Describing transparent and reproducible research methodologies',
          'Presenting results through effective tables, figures, and explanations',
          'Interpreting findings in relation to previous scholarly work',
          'Writing limitations, implications, conclusions, and future research directions',
        ],
      },
    ],
    practical:
      'Prepare a complete manuscript outline and draft the introduction for your selected research topic.',
  },
  {
    id: 6,
    title: 'Academic Presentation, Technical Writing & Quality Improvement',
    subtitle: 'Improving Clarity, Visual Communication, and Academic Quality',
    classes: [
      {
        number: 16,
        title: 'Scientific Tables, Figures and Research Visualization',
        topics: [
          'Fundamentals of research data visualization',
          'Developing publication-quality charts, tables, and figures',
          'Writing informative captions, legends, and appropriate units',
          'Maintaining data integrity and avoiding misleading visual presentations',
        ],
      },
      {
        number: 17,
        title: 'Academic English, Clarity and Technical Editing',
        topics: [
          'Using precise language and an appropriate academic tone',
          'Improving paragraph structure, cohesion, and logical transitions',
          'Editing grammar, clarity, concision, and sentence construction',
          'Applying discipline-specific academic writing conventions',
        ],
      },
      {
        number: 18,
        title: 'Review Articles, Conference Papers and Research Reports',
        topics: [
          'Understanding review article structures and evidence synthesis',
          'Comparing conference papers with full-length journal articles',
          'Recognizing differences among technical reports, thesis chapters, and journal manuscripts',
          'Choosing the appropriate structure for different scholarly writing formats',
        ],
      },
    ],
    practical:
      'Revise one section of your research manuscript and prepare a publication-style table or figure.',
  },
  {
    id: 7,
    title: 'Research Ethics, AI & Responsible Scholarship',
    subtitle: 'Maintaining Integrity and Accountability in Research',
    classes: [
      {
        number: 19,
        title: 'Research Integrity, Plagiarism and Publication Ethics',
        topics: [
          'Understanding plagiarism, self-plagiarism, and duplicate publication',
          'Identifying fabrication, falsification, and authorship misconduct',
          'Recognizing informed consent, confidentiality, and ethical approval requirements',
          'Maintaining citation integrity and responsible data handling',
        ],
      },
      {
        number: 20,
        title: 'Using AI Tools Responsibly in Academic Research',
        topics: [
          'Appropriate uses of AI-assisted discovery, research support, and academic writing tools',
          'Verifying AI-generated references, interpretations, and factual claims',
          'Managing hallucinations, bias, privacy risks, and data confidentiality',
          'Following journal-specific AI disclosure policies and maintaining human accountability',
        ],
      },
      {
        number: 21,
        title: 'Research Ethics, Authorship and Shariah-Informed Scholarship',
        topics: [
          'Fair authorship, acknowledgement practices, and contributor responsibilities',
          'Preventing research fraud, misleading claims, and predatory publishing',
          'Examining honesty, trustworthiness, fair attribution, and accountability through a Shariah-informed ethical perspective',
          'Protecting research participants, sensitive information, and communities from avoidable harm',
        ],
      },
    ],
    practical:
      'Develop a research ethics checklist and draft an appropriate AI-use disclosure statement for your research.',
  },
  {
    id: 8,
    title: 'Journal Selection, Peer Review & Publication Strategy',
    subtitle: 'Preparing Your Manuscript for Scholarly Submission',
    classes: [
      {
        number: 22,
        title: 'Selecting the Right Journal and Understanding Publishing Models',
        topics: [
          'Evaluating journal aims, scope, audience, and manuscript fit',
          'Checking journal indexing, publisher credibility, and editorial boards',
          'Understanding open-access, subscription, and publication fee models',
          'Interpreting journal metrics appropriately and avoiding predatory outlets',
        ],
      },
      {
        number: 23,
        title: 'Manuscript Submission, Peer Review and Revision',
        topics: [
          'Preparing submission files according to author guidelines',
          'Writing cover letters and completing manuscript metadata',
          'Responding constructively to reviewer comments point by point',
          'Planning revisions, resubmissions, and appropriate appeals',
        ],
      },
      {
        number: 24,
        title: 'Research Presentation, Final Assessment and Publication Roadmap',
        topics: [
          'Presenting a research idea or manuscript clearly and concisely',
          'Receiving and incorporating peer and instructor feedback',
          'Completing the final learning assessment',
          'Creating a personalized roadmap toward submission readiness',
        ],
      },
    ],
    practical:
      'Present your research idea or manuscript and prepare an individualized publication-readiness action plan.',
  },
];

export const COURSE_OUTCOMES = [
  'Identify meaningful research problems and develop focused research questions.',
  'Search, critically evaluate, and synthesize scholarly literature.',
  'Use academic databases and reference management tools effectively.',
  'Design an appropriate research methodology and data collection plan.',
  'Prepare a structured research manuscript using recognized academic writing conventions.',
  'Develop clear research tables, figures, and presentations.',
  'Apply responsible research practices and disclose AI assistance appropriately.',
  'Evaluate suitable journals and prepare for peer review and submission.',
];