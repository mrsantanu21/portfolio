/**
 * Centralized, strongly-typed portfolio data and configuration.
 * Single source of truth for personal information, social links,
 * contact details, and project case studies.
 */

export interface ProjectMetric {
  value: string;
  label: string;
  howMeasured?: string;
}

export interface ProjectDetail {
  id: string;
  number: string;
  title: string;
  subtitle: string;
  category: string;
  overview: string;
  highlights: string[];
  stack: string[];
  github: string;
  isDirectRepo: boolean;
  metrics: ProjectMetric[];
}

export interface SiteConfig {
  owner: {
    name: string;
    monogram: string;
    role: string;
    heroRole: string;
    heroTitle: string;
    email: string;
    phone: string;
    formattedPhone: string;
    location: string;
    country: string;
    state: string;
    availability: string;
    availabilityShort: string;
    education: {
      degree: string;
      institution: string;
      field: string;
    };
  };
  social: {
    github: string;
    linkedin: string;
    whatsapp: string;
    facebook: string;
    instagram: string;
  };
  resume: {
    url: string;
    downloadName: string;
  };
  projects: Record<string, ProjectDetail>;
}

export const siteConfig: SiteConfig = {
  owner: {
    name: 'Santanu Dey',
    monogram: 'SD',
    role: 'Software Engineer',
    heroRole: 'FULL-STACK & AI SYSTEMS ENGINEER',
    heroTitle: 'Engineering scalable web platforms & autonomous AI architectures.',
    email: 'mrsantanudey459@gmail.com',
    phone: '+919144246356',
    formattedPhone: '+91 9144246356',
    location: 'West Bengal, India · Open to Remote & On-Site',
    country: 'India',
    state: 'West Bengal',
    availability: 'Available for Full-Time Roles & High-Impact Engineering',
    availabilityShort: 'Open to work',
    education: {
      degree: 'B.Tech in Computer Science & Engineering',
      institution: 'Swami Vivekananda Institute of Science and Technology',
      field: 'Computer Science and Engineering',
    },
  },
  social: {
    github: 'https://github.com/mrsantanu21',
    linkedin: 'https://linkedin.com/in/santanudey04/',
    whatsapp: 'https://wa.me/919144246356',
    facebook: 'https://www.facebook.com/santanu.dey.11',
    instagram: 'https://www.instagram.com/theskyarc_/',
  },
  resume: {
    url: '/resume.pdf',
    downloadName: 'Santanu_Dey_Resume.pdf',
  },
  projects: {
    rea: {
      id: 'rea',
      number: '01',
      title: 'Reverse Engineering Anything (REA)',
      subtitle: 'AI-Assisted Binary Analysis & Decompilation Workbench',
      category: 'AI · Software Analysis · Systems',
      overview:
        'A full-stack reverse-engineering workbench engineered to help software engineers and security researchers understand binary behavior and complex source trees through evidence-driven visual analysis, call flows, and automated reconstruction.\n\nIntegrates local offline LLM assistance to synthesize high-level architectural models and functional invariants from raw decompiled ASTs, running completely on-device with zero proprietary code leakage.',
      highlights: [
        'Evidence-Driven Triage: Implemented investigation workflows with immutable audit trails, content-addressed artifacts, and provenance tracking.',
        'Interactive Reasoning Graphs: Developed multi-hop call graphs, AST traversal visualizers, and decompilation analysis pipelines.',
        'Local Model Synthesis: Integrated offline LLMs to extract behavioral invariants and architectural summaries directly from raw assembly ASTs.',
      ],
      stack: ['TypeScript', 'React', 'Node.js', 'SQLite', 'AI / LLM', 'AST Analysis', 'Git', 'GitHub'],
      github: 'https://github.com/mrsantanu21',
      isDirectRepo: false,
      metrics: [
        {
          value: '<150ms',
          label: 'AST parsing time across 10,000+ code nodes',
          howMeasured: 'Local AST parsing benchmark on synthetic code sample',
        },
        {
          value: '100%',
          label: 'On-device local LLM execution with zero external network leakage',
          howMeasured: 'Network isolation and local runtime architecture',
        },
        {
          value: 'Multi-Hop',
          label: 'Call-graph & control-flow traversal across decompiled source trees',
          howMeasured: 'Graph traversal depth verification',
        },
      ],
    },
    railflow: {
      id: 'railflow',
      number: '02',
      title: 'Full-Stack Railway Reservation System',
      subtitle: 'Production Multi-Tier Architecture & Automated Deployment Pipeline',
      category: 'Full-Stack · Cloud Architecture · Multi-Tier CI/CD',
      overview:
        'A robust railway reservation platform featuring multi-tier cloud deployment originating from protected GitHub branches, containerized API services on Render, a React + Vite frontend on Vercel, and a managed MongoDB Atlas cluster with live connection pooling.\n\nEngineered to handle high-concurrency booking bursts with zero lock contention, deterministic seat availability caching, and end-to-end type safety across the entire client-server boundary.',
      highlights: [
        'Multi-Tier CI/CD Pipeline: Automated builds triggered on push to GitHub main with active branch protection rules; static output on Vercel and containerized services on Render.',
        'Standardized Build Tooling: Deterministic Vite build pipeline with zero manual overrides, fine-grained chunk splitting, and isolated environment variables.',
        'Cross-Origin Security: Production CORS policy governing secure API communication between Vercel frontend and Render backend endpoints.',
        'Data Tier Resilience: MongoDB Atlas cloud cluster configured with live connection pooling, compound indexing, and zero-downtime failover.',
      ],
      stack: ['React', 'TypeScript', 'Vite', 'Node.js', 'Python', 'MongoDB Atlas', 'Render', 'Vercel', 'CI/CD'],
      github: 'https://github.com/mrsantanu21/RailFlow',
      isDirectRepo: true,
      metrics: [
        {
          value: '<45ms',
          label: 'Edge-cached static asset delivery on Vercel Global CDN',
          howMeasured: 'Vercel Edge network response timing',
        },
        {
          value: '3-Tier',
          label: 'Decoupled architecture: Vite on Vercel, container on Render, MongoDB Atlas',
          howMeasured: 'Production deployment configuration',
        },
        {
          value: 'Automated',
          label: 'Branch-protected CI/CD pipeline triggered on main push',
          howMeasured: 'GitHub Actions workflow configuration',
        },
      ],
    },
    santa: {
      id: 'santa',
      number: '03',
      title: 'SANTA — AI Personal Assistant',
      subtitle: 'Voice & Message Based Autonomous AI Agent',
      category: 'AI Agent · Voice Processing · LLMs',
      overview:
        'An autonomous, voice-first personal assistant agent featuring offline-capable local model inference, multi-turn vector memory, and an extensible tool-calling backend for local system automation.\n\nCombines low-latency speech recognition and synthesis pipelines with stateful agent reasoning loops, allowing deterministic multi-hop task execution without context drift.',
      highlights: [
        'State Machine Architecture: Engineered LangGraph cyclic state machines that enforce deterministic state transitions across multi-turn sessions.',
        'Low-Latency Audio Pipeline: Integrated local Whisper STT with streaming speech synthesis for responsive, sub-second conversational voice interactions.',
        'Vector Memory Retrieval: Built ChromaDB semantic memory indexing maintaining conversational context with sub-200ms query latency in local benchmarks.',
      ],
      stack: ['Python', 'AI / LLM', 'Ollama', 'APIs', 'Voice Processing', 'Agent Architecture', 'Git'],
      github: 'https://github.com/mrsantanu21',
      isDirectRepo: false,
      metrics: [
        {
          value: '<200ms',
          label: 'Vector memory retrieval latency across ChromaDB collection',
          howMeasured: 'Local ChromaDB similarity search benchmark',
        },
        {
          value: 'Sub-Sec',
          label: 'Voice-to-text response using local Whisper STT streaming pipeline',
          howMeasured: 'Local audio transcription benchmark',
        },
        {
          value: 'Cyclic',
          label: 'LangGraph state machines enforcing structured tool calling',
          howMeasured: 'State transition architecture design',
        },
      ],
    },
  },
};
