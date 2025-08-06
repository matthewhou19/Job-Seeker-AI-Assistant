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
