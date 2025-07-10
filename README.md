# Job-Seeker-AI-Assistant

An AI-powered job analysis system that extracts key information from job postings using advanced language models and structured data extraction. **Currently in development phase** - we've built four core extraction chains and are testing their performance for future job filtering applications.

## 🎯 Problem Statement

Job seekers waste countless hours reading through lengthy job descriptions on platforms like Indeed, LinkedIn, and Glassdoor. Current job filtering systems are inadequate - they don't effectively match candidates with roles based on skills, experience level, and domain requirements. **Our solution**: Use AI to automatically extract and analyze key job information, enabling intelligent job matching and filtering.

## 🚀 Current Status

### ✅ What We've Built

- **Four Core Extraction Chains**: Skills, Level, Domain, and Years of Experience extraction
- **Performance-Optimized**: High-speed validation and processing systems
- **Comprehensive Testing**: Real job posting data validation and performance monitoring
- **Dual LLM Architecture**: Reliable extraction with Ollama (local) + Gemini (fallback)

### 🔄 What's Next

- **Data Import Pipeline**: Integration with job posting APIs (JSearch, etc.)
- **Job Matching Engine**: AI-powered job-candidate matching
- **Chrome Extension**: Real-time job analysis on LinkedIn, Indeed, etc.
- **User Interface**: Web dashboard for job seekers

## 🚀 Features

### Core Extraction Capabilities

- **Skills Extraction**: Identifies technical skills, programming languages, frameworks, and tools
- **Level Classification**: Determines seniority level (Intern, Entry, Junior, Mid, Senior, Lead, Manager, Director, Executive)
- **Domain Classification**: Categorizes jobs into technical domains (Backend, Frontend, Full Stack, Mobile, DevOps, etc.)
- **Years of Experience**: Extracts required years of experience from job descriptions
- **Smart Level Detection**: Uses both explicit mentions and inference for accurate level classification

### Technical Features

- **Dual LLM Architecture**: Ollama (local) + Gemini (fallback) for reliability
- **Performance Monitoring**: Real-time chain performance tracking and metrics
- **Validation System**: Comprehensive test validation with flexible matching
- **Optimized Processing**: High-performance validation and caching systems

## 🎯 Future Vision

### Direction 1: Data Import & Job Matching

```
Job Posting APIs (JSearch, etc.) → AI Extraction Chains → Job Database → Matching Engine → Filtered Results
```

**Features:**

- **Bulk Job Analysis**: Process thousands of job postings automatically
- **Intelligent Filtering**: Match jobs based on skills, experience, and domain preferences
- **Personalized Recommendations**: AI-powered job suggestions for candidates

### Direction 2: Chrome Extension

```
Job Platform (LinkedIn/Indeed) → Chrome Extension → AI Analysis → Key Info Display
```

**Features:**

- **Real-time Analysis**: Instant job information extraction
- **Key Info Display**: Skills, level, domain, and years shown at a glance
- **Quick Filtering**: Skip irrelevant jobs without reading descriptions
- **Save Time**: Reduce job search time by 80-90%

## 🏗️ Architecture

```
src/
├── chains/           # LLM chain implementations
├── prompts/          # Prompt templates and few-shot examples
├── schemas/          # Zod schemas for data validation
├── llm/             # LLM client configurations
├── monitor/         # Performance monitoring and validation
└── scripts/         # Execution scripts and utilities
```

### Key Components

#### Chains (`src/chains/`)

- `extractSkills.chain.ts` - Skills extraction with optimized validation
- `extractDomain.chain.ts` - Domain classification (Backend, Frontend, etc.)
- `extractYearsFewShot.chain.ts` - Years of experience extraction
- `smartExtractLevel.chain.ts` - Smart level detection with fallback logic

#### Prompts (`src/prompts/`)

- Few-shot learning examples for accurate extraction
- Optimized prompts for specific extraction tasks
- Clear domain definitions and level criteria

#### Schemas (`src/schemas/`)

- `skills.schema.ts` - Skills array validation
- `level.schema.ts` - Level enum validation
- `domain.schema.ts` - Domain classification validation
- `years.schema.ts` - Years of experience validation

#### Monitoring (`src/monitor/`)

- `ChainPerformanceMonitor.ts` - Performance tracking
- `Validator.ts` - Flexible validation with partial matching

## 🛠️ Installation

### Prerequisites

- Node.js (v16 or higher)
- Ollama (for local LLM processing)
- Gemini CLI (for fallback processing)

### Setup

```bash
# Clone the repository
git clone https://github.com/Do-not-be-afraid-to-be-knonwn/Job-Seeker-AI-Assistant.git
cd Job-Seeker-AI-Assistant

# Install dependencies
npm install

# Install Ollama (if not already installed)
# Visit: https://ollama.ai/

# Install Gemini CLI
npm install -g @google/generative-ai
```

## 📖 Usage

### Current Usage (Testing Phase)

```typescript
import { makeExtractSkillsChain } from "./src/chains/extractSkills.chain";
import { makeExtractDomainChain } from "./src/chains/extractDomain.chain";
import { makeSmartExtractLevelChain } from "./src/chains/smartExtractLevel.chain";

// Extract skills
const skillsChain = await makeExtractSkillsChain();
const skillsResult = await skillsChain({
  text: "Senior Python Developer with React and AWS experience",
});

// Extract domain
const domainChain = await makeExtractDomainChain();
const domainResult = await domainChain({
  text: "Full stack developer needed for web application",
});

// Extract level
const levelChain = await makeSmartExtractLevelChain();
const levelResult = await levelChain({
  text: "Senior Software Engineer position",
});
```

## 🧪 Testing

### Smoke Tests

The project includes comprehensive smoke tests with real job posting data:

```bash
# Run all smoke tests
npm run smoke

# Run local tests only
npm run smoke:local
```

### Test Data

- `test/smoke/smoke.json` - Real job posting data for testing
- Validates extraction accuracy across different job types
- Performance monitoring and validation reporting

## 📊 Performance Monitoring

### Metrics Tracking

- **Chain Performance**: Response times, token usage, success rates
- **Validation Accuracy**: Test result matching and accuracy rates
- **LLM Usage**: Ollama vs Gemini usage statistics

## 🔧 Configuration

### LLM Configuration

- **Primary**: Ollama with Mistral model (local processing)
- **Fallback**: Gemini CLI (cloud processing)
- **Retries**: Built-in retry mechanism with fallback

### Validation System

- **Flexible Matching**: Partial string matching for skills
- **Cached Validators**: Performance-optimized validation
- **Test Support**: Comprehensive test validation framework

## 🚀 Performance Optimizations

### Recent Improvements

- **SkillsValidator**: O(n+m) Set-based lookup vs O(n\*m) nested loops
- **Validator Caching**: Eliminated repeated validator instantiation
- **Flexible Matching**: Partial string matching for better accuracy
- **Optional Validation**: Skip validation when not needed

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Matthew Hou** - [GitHub](https://github.com/Do-not-be-afraid-to-be-knonwn)

## 🐛 Issues

If you encounter any issues, please report them on the [GitHub Issues page](https://github.com/Do-not-be-afraid-to-be-knonwn/Job-Seeker-AI-Assistant/issues).

---

**Built with ❤️ using LangChain, Ollama, and TypeScript**
