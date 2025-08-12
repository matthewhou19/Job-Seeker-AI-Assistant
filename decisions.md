# 🧠 Development Decision Log

A running log of key technical decisions made during this project — what we chose, why, and under what conditions we'd revisit the choice.

---

## 📅 [YYYY-MM-DD] Decision: [Short Title]

**Context:**
What problem or situation prompted this decision?

**Options Considered:**

- Option A – brief note
- Option B – brief note
- (optional) Option C – brief note

**Rationale (Why This One):**
What constraints, trade-offs, or team context led to this choice?

**Review Trigger:**
When will this decision be reconsidered? (e.g., if performance drops, scale exceeds X, a new library matures)

---

## 📅 2025-07-15 Decision: Use RunPod as GPU Backend with Open Source Model

**Context:**
We needed to reduce costs associated with LLM model usage for both production testing and development. Using a self-hosted open source model would provide significant cost savings compared to commercial APIs.

**Options Considered:**

- **OpenAI API** – High cost for testing and development, not sustainable for high user request volumes
- **RunPod with Open Source Model** – Cost-effective monthly pricing with GPU acceleration

**Rationale (Why This One):**
The monthly expense is predictable and manageable, allowing us to scale without prohibitive costs while maintaining performance through GPU acceleration.

**Review Trigger:**
If we find alternative approaches that can further reduce expenses or significantly improve user experience, we will reconsider this decision.

---

📅 **2025-08-11** Decision: **Use AWS Backend for Production, Connect to OpenAI & Gemini APIs, Use RunPod for Integrated Testing**

**Context:**

We needed a scalable, reliable backend for the production environment that can handle traffic consistently while allowing flexibility in AI model sourcing. The project requires low-latency inference in production, seamless switching between OpenAI and Google Gemini APIs for different workloads, and a cost-effective way to perform high-load or compatibility tests without impacting production stability.

**Options Considered:**

- **Option A – AWS backend + OpenAI API only:**

  Simple to implement but locks us into one vendor, potentially increasing costs and reducing flexibility for different AI tasks.

- **Option B – AWS backend + Gemini API only:**

  Cheaper token cost in some scenarios, but limited by Gemini's current ecosystem and potential compatibility gaps with existing OpenAI prompts.

- **Option C – AWS backend + OpenAI & Gemini APIs + RunPod for integrated testing:**

  Provides flexibility to route requests to the optimal API per use case and offload heavy testing to temporary GPU instances.

**Rationale (Why This One):**

AWS offers the scalability, uptime, and managed services we need for production, with predictable operational overhead. Integrating both OpenAI and Gemini APIs allows us to optimize for price-performance per feature (e.g., cheaper summarization on Gemini, complex reasoning on GPT-5). Using RunPod for short-term integrated testing gives us realistic end-to-end tests with self-hosted open-weight models at a fraction of the cost of sustained API usage.

**Review Trigger:**

We will revisit this decision if:

- API pricing or limits change significantly.
- Our monthly token usage passes the break-even point where self-hosting full-time is cheaper than API calls.
- AWS introduces native GPU hosting that matches or beats RunPod pricing for short-term workloads.
