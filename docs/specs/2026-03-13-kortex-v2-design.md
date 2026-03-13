# Kortex v2 — Tasarım Dokümanı

> AI Agent Framework Orkestrasyon Platformu
> Tarih: 2026-03-13

---

## 1. Genel Bakış

Kortex v2, Milowda/Antigravity AI Agent Framework'ünün markdown tabanlı simülasyonunu gerçek bir çalışan platforma dönüştürür. Platform iki temel fazı yönetir:

1. **Kickoff/Analiz Fazı** — Proje oluşturma, roadmap girişi, otomatik analiz süreci (persona'lar doküman üretir, prime onaylar)
2. **Development Fazı** — Kanban board üzerinde görev yönetimi, AI agent'ların gerçek kod yazması

### Temel Prensipler

- **Framework = Sistem:** ai-agent-framework'ün `.agent/` dizin yapısı, kuralları ve akışları Kortex'in iç mantığını oluşturur
- **Persona = AI Agent:** 20 AI persona + 1 insan (prime) = 21 rol. AI persona'lar gerçek model çağrılarıyla çalışır
- **Prime = İnsan:** +prime her zaman insan kullanıcı, asla AI
- **Türkçe UI / İngilizce API:** Kullanıcı arayüzü Türkçe, tüm API ve kod İngilizce. Status enum değerleri İngilizce, UI'da Türkçe label mapping kullanılır
- **Multi-Model:** Claude, OpenAI, Gemini aynı anda kullanılabilir
- **3 Deneme Kuralı:** Herhangi bir AI çağrısı 3 başarısız denemeden sonra escalation zincirini tetikler (persona → manager → prime)

---

## 2. Mimari

### 2.1 Execution Modeli: Hibrit

```
┌─────────────────────────────────────────────────┐
│                    Kortex Web UI                 │
│         (Next.js 15 App Router + SSE)            │
└────────────────────┬────────────────────────────┘
                     │
          ┌──────────┴──────────┐
          │                     │
    ┌─────┴─────┐        ┌─────┴──────┐
    │  Backend   │        │    CLI     │
    │Orchestrator│        │  Agents    │
    └─────┬─────┘        └─────┬──────┘
          │                     │
    Kickoff Fazı          Development Fazı
    (Doküman üretimi)     (Kod yazma, test, git)
          │                     │
    ┌─────┴─────┐        ┌─────┴──────┐
    │ AI Provider│        │ AI Provider│
    │   APIs     │        │   APIs     │
    └───────────┘        └────────────┘
```

**Kickoff/Analiz Fazı (Backend Orchestrator):**
- Kullanıcı web UI'da butona basar
- Next.js API route'ları AI provider API'lerini çağırır
- Persona context'i (role definition + skills + project info) prompt'a enjekte edilir
- Üretilen dokümanlar DB'ye kaydedilir
- SSE ile UI'a ilerleme bildirilir

**Development Fazı (CLI Agents):**
- Board'dan görev alınır
- CLI agent gerçek projede çalışır (dosya sistemi, git, terminal)
- Agent sonuçları API üzerinden Kortex'e bildirilir
- Board real-time güncellenir

### 2.2 Tech Stack

| Katman | Teknoloji |
|--------|-----------|
| Frontend | Next.js 15 (App Router), React 19, Tailwind CSS v4 |
| Backend | Next.js API Routes (REST) |
| Database | SQLite + better-sqlite3 + Drizzle ORM |
| Real-time | Server-Sent Events (SSE) |
| AI Providers | Anthropic SDK, OpenAI SDK, Google GenAI SDK |
| CLI | commander.js, chalk, cli-table3 |
| Validation | Zod |
| ID Generation | nanoid |
| DnD | @dnd-kit |
| Font | Geist (Sans + Mono) |

### 2.3 Dizin Yapısı

```
kortex/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (dashboard)/        # Ana layout grubu
│   │   │   ├── board/          # Kanban board
│   │   │   ├── projects/       # Proje listesi + oluşturma
│   │   │   ├── kickoff/        # Kickoff DAG akışı
│   │   │   ├── documents/      # Doküman merkezi
│   │   │   ├── task/[id]/      # Görev detay
│   │   │   ├── personas/       # Persona yönetimi
│   │   │   ├── activity/       # Aktivite akışı
│   │   │   ├── settings/       # Ayarlar + Providers
│   │   │   └── layout.tsx      # Sidebar + proje switcher
│   │   ├── api/v1/             # REST API
│   │   └── layout.tsx          # Root layout
│   ├── db/
│   │   ├── schema.ts           # Drizzle schema
│   │   └── index.ts            # DB connection
│   ├── lib/
│   │   ├── ai/                 # AI provider abstraction
│   │   │   ├── providers/      # Claude, OpenAI, Gemini adapters
│   │   │   ├── cipher.ts       # Model selection engine
│   │   │   └── prompt-builder.ts  # Persona context builder
│   │   ├── engine/
│   │   │   ├── pipeline.ts     # Kickoff pipeline engine
│   │   │   ├── transition.ts   # Board transition engine
│   │   │   └── agent-runner.ts # CLI agent execution
│   │   ├── validators.ts       # Zod schemas
│   │   ├── errors.ts           # Error classes
│   │   ├── id.ts               # nanoid generator
│   │   └── sse-manager.ts      # SSE broadcast
│   ├── components/
│   │   ├── ui/                 # Base UI components
│   │   ├── board/              # Kanban board components
│   │   ├── kickoff/            # DAG + pipeline components
│   │   ├── documents/          # Document viewer + review
│   │   └── layout/             # Sidebar, navigation
│   └── types/
│       └── index.ts            # TypeScript types
├── cli/                        # CLI client (ayrı package)
├── data/                       # SQLite DB dosyası
├── drizzle/                    # Migration dosyaları
└── docs/specs/                 # Tasarım dokümanları
```

---

## 3. Veri Modeli

### 3.1 Yeni Tablolar

#### projects
Birden fazla projeyi yönetir. Her proje bir yazılım projesi (web, mobile, API vs.).

| Kolon | Tip | Açıklama |
|-------|-----|----------|
| id | text PK | "milowda-mobile" |
| name | text | "Milowda Mobile App" |
| platform | enum | web, mobile, api, fullstack |
| status | enum | setup, kickoff, development, completed |
| repoUrl | text? | GitHub/GitLab repo URL |
| defaultBranch | text | "main" |
| gitSyncEnabled | boolean | .agent/ dizinine senkron |
| roadmap | text? | Product roadmap (markdown) |
| createdAt | timestamp | |
| updatedAt | timestamp | |

#### providers
Global AI sağlayıcı tanımları ve credentials.

| Kolon | Tip | Açıklama |
|-------|-----|----------|
| id | text PK | "claude", "openai", "gemini" |
| name | text | "Claude (Anthropic)" |
| authType | enum | api_key, oauth |
| credentials | text | Encrypted JSON |
| isConnected | boolean | |
| connectedAt | timestamp? | |

#### models
Her provider'ın kullanılabilir modelleri.

| Kolon | Tip | Açıklama |
|-------|-----|----------|
| id | text PK | "claude-opus-4", "gemini-2.5-flash" |
| providerId | text FK | → providers.id |
| name | text | "Claude Opus 4" |
| category | enum | powerful, balanced, fast |
| costTier | enum | high, medium, low |
| contextWindow | integer | Token limiti |
| isAvailable | boolean | Provider bağlıysa true |

#### projectProviders
Proje bazlı aktif provider'lar ve default model seçimi.

| Kolon | Tip | Açıklama |
|-------|-----|----------|
| id | text PK | |
| projectId | text FK | → projects.id |
| providerId | text FK | → providers.id |
| isDefault | boolean | Varsayılan provider mı |

#### projectModelConfig
Proje bazlı persona-model override matrisi.

| Kolon | Tip | Açıklama |
|-------|-----|----------|
| id | text PK | |
| projectId | text FK | → projects.id |
| personaId | text FK | → personas.id |
| modelId | text FK | → models.id |

#### documents
Tüm üretilen dokümanlar (references, reports, memory).

| Kolon | Tip | Açıklama |
|-------|-----|----------|
| id | text PK | |
| projectId | text FK | → projects.id |
| category | enum | reference, report, memory |
| type | text | "design-system", "kickoff-report" vs. |
| title | text | |
| content | text | Markdown içerik |
| status | enum | draft, in_review, approved, archived |
| createdByPersonaId | text FK | Üreten persona |
| approverPersonaId | text FK? | Onaylayacak persona |
| version | integer | 1'den başlar |
| createdAt | timestamp | |
| updatedAt | timestamp | |
| approvedAt | timestamp? | |

#### documentReviews
Doküman inline review kayıtları.

| Kolon | Tip | Açıklama |
|-------|-----|----------|
| id | text PK | |
| documentId | text FK | → documents.id |
| reviewerPersonaId | text FK | Reviewer (prime veya persona) |
| status | enum | pending, approved, revision_requested |
| comments | text (JSON) | Inline review notları [{line, text}] |
| createdAt | timestamp | |

#### pipelineSteps
Kickoff akışının her adımı (DAG node'ları).

| Kolon | Tip | Açıklama |
|-------|-----|----------|
| id | text PK | |
| projectId | text FK | → projects.id |
| workflowType | enum | kickoff, refinement, deployment |
| stepOrder | integer | Sıra numarası |
| personaId | text FK | Çalışacak persona |
| title | text | "Design System Oluştur" |
| description | text | Adım açıklaması |
| status | enum | pending, running, awaiting_review, approved, failed |
| dependsOn | text (JSON) | Bağımlı adım ID'leri |
| inputDocumentIds | text (JSON) | Girdi doküman ID'leri |
| outputDocumentId | text FK? | Üretilen doküman |
| modelId | text FK? | Cipher seçimi veya prime override |
| startedAt | timestamp? | |
| completedAt | timestamp? | |
| error | text? | Hata mesajı |

#### agentExecutions
AI agent çalışma kayıtları (hem kickoff hem development).

| Kolon | Tip | Açıklama |
|-------|-----|----------|
| id | text PK | |
| taskId | text FK? | Development fazında → tasks.id |
| pipelineStepId | text FK? | Kickoff fazında → pipelineSteps.id |
| personaId | text FK | Çalışan persona |
| modelId | text FK | Kullanılan model |
| status | enum | running, paused, error, blocked, completed |
| logs | text | Canlı log stream |
| tokenUsage | text (JSON) | {input, output, cost} |
| startedAt | timestamp | |
| completedAt | timestamp? | |

### 3.2 Mevcut Tablolardan Değişenler

#### documentTypes (seed data)
Doküman tip kayıt defteri — her framework dokümanının kim üretir, kim inceler, kim onaylar bilgisi.

| Kolon | Tip | Açıklama |
|-------|-----|----------|
| id | text PK | "design-system", "kickoff-report" vs. |
| category | enum | reference, report, memory |
| title | text | "Design System" |
| ownerPersonaId | text FK | Üreten persona |
| reviewerPersonaId | text FK? | İnceleyen persona |
| approverPersonaId | text FK? | Onaylayan persona (null = prime) |
| template | text? | Markdown şablon içeriği |

Seed data (framework'ten):

| type | category | owner | reviewer | approver |
|------|----------|-------|----------|----------|
| product-roadmap | reference | prime | — | — |
| legal-reports | report | compliance-expert | — | prime |
| growth-strategy | reference | growth-expert | — | prime |
| product-requirements | report | product-manager | — | prime |
| content-strategy | reference | copywriter | — | prime |
| tech-stack | reference | architect | — | — |
| security-reports | report | security-engineer | architect | — |
| dictionary | reference | architect | — | — |
| file-system | reference | architect | — | — |
| design-system | reference | designer | frontend-developer | prime |
| db-schema | reference | db-admin | — | — |
| api-reference | reference | docs-author | backend-developer | — |
| tech-requirements | report | engineering-manager | — | — |
| test-strategy | reference | qa-engineer | — | — |
| kickoff-reports | report | operation-manager | — | prime |
| active-context | memory | operation-manager | — | — |
| handover | memory | (any persona) | — | — |
| decisions | memory | (any persona) | — | — |
| learned | memory | (any persona) | — | — |
| snippets | memory | (any persona) | — | — |

#### personaHierarchy (seed data / constant)
Persona hiyerarşisi ve escalation zinciri. `personas` tablosunda `parentId` ve `tier` zaten var, ek olarak:

| Kolon | Tip | Açıklama |
|-------|-----|----------|
| personaId | text FK | → personas.id |
| managerId | text FK? | Doğrudan yöneticisi |
| escalationChain | text (JSON) | ["engineering-manager", "operation-manager", "prime"] |
| canDelegateToIds | text (JSON) | Görev verebileceği persona'lar |

#### accessConfig
Proje bazlı credential ve konfigürasyon yönetimi (framework'teki `references/access.md` karşılığı).

| Kolon | Tip | Açıklama |
|-------|-----|----------|
| id | text PK | |
| projectId | text FK | → projects.id |
| serviceName | text | "Firebase", "AWS S3", "GitHub" vs. |
| serviceCategory | enum | hosting, database, auth, storage, ci_cd, analytics, other |
| configData | text | Non-secret JSON (URLs, project IDs) |
| secretKeys | text | Encrypted JSON (API keys, tokens) |
| isProvisioned | boolean | Prime tarafından sağlandı mı |
| requiredByPersonaId | text FK? | Hangi persona talep etti |
| notes | text? | Kurulum notları |
| createdAt | timestamp | |
| updatedAt | timestamp | |

#### personas (global, değişmez)
20 AI persona + 1 insan (prime) tüm projelerde aynı. Mevcut yapı korunur.

#### tasks (genişler)
| Eklenen Kolon | Tip | Açıklama |
|---------------|-----|----------|
| projectId | text FK | → projects.id |
| reporterPersonaId | text FK? | Görevi açan persona (transition'da reviewer olabilir) |
| labels | text (JSON) | ["needs-qa", "needs-security"] |
| testSteps | text (JSON) | Sıralı test adımları ["code_review", "qa", "security"] |
| currentTestStep | text? | Şu an hangi test adımında |
| dependencies | text (JSON) | {blocks: ["KTX-3"], blockedBy: ["KTX-2"], related: ["KTX-5"]} |
| acceptanceCriteria | text? | Markdown — kabul kriterleri |
| version | text? | "v0.1", "v1.0" — hangi release'e ait |

Status enum genişler:
`backlog | todo | in_progress | test_code_review | test_qa | test_security | review | done`

#### epics (genişler)
| Eklenen Kolon | Tip | Açıklama |
|---------------|-----|----------|
| projectId | text FK | → projects.id |

#### Diğer tablolar
`handoffs`, `commands`, `activityLog`, `comments`, `taskReviewers` → hepsine `projectId` eklenir.

---

## 4. Kickoff Pipeline Motoru

### 4.1 Akış Yapısı

Framework'teki `workflows/kickoff.md` birebir DAG olarak modellenir. Her adımın girdi bağımlılıkları ve çıktı dokümanı bellidir:

```
Faz 1: Süreç Başlangıcı
  └─ +prime: product-roadmap.md girer, !start komutu verir

Faz 2: Ürün Analizi (paralel, Faz 1'e bağımlı)
  ├─ +compliance-expert: KVKK/GDPR analizi
  │    Girdi: product-roadmap.md
  │    Çıktı: legal-reports.md → Approver: +prime
  ├─ +growth-expert: Büyüme stratejisi
  │    Girdi: product-roadmap.md
  │    Çıktı: growth-strategy.md → Approver: +prime
  ├─ +product-manager: PRD
  │    Girdi: product-roadmap.md, legal-reports.md, growth-strategy.md
  │    Çıktı: product-requirements.md → Approver: +prime
  └─ +copywriter: İçerik stratejisi
       Girdi: product-requirements.md, legal-reports.md, growth-strategy.md
       Çıktı: content-strategy.md → Approver: +prime

Faz 3: Teknik Analiz (paralel, Faz 2'ye bağımlı)
  ├─ +architect: Tech stack belirleme + MCP/araç tanımlama
  │    Girdi: product-requirements.md
  │    Çıktı: tech-stack.md
  ├─ +security-engineer: Güvenlik analizi
  │    Girdi: tech-stack.md
  │    Çıktı: security-reports.md → Reviewer: +architect
  ├─ +architect: Kodlama standartları + dosya yapısı
  │    Girdi: security-reports.md, tech-stack.md
  │    Çıktı: dictionary.md, file-system.md
  ├─ +designer: Design system
  │    Girdi: product-requirements.md, tech-stack.md, content-strategy.md
  │    Çıktı: design-system.md → Reviewer: +frontend-developer, Approver: +prime
  ├─ +db-admin: DB schema tasarımı
  │    Girdi: product-requirements.md, security-reports.md, dictionary.md, tech-stack.md
  │    Çıktı: db-schema.md
  ├─ +docs-author: API referans
  │    Girdi: product-requirements.md, db-schema.md, file-system.md, tech-stack.md
  │    Çıktı: api-reference.md → Reviewer: +backend-developer
  ├─ +engineering-manager: Teknik gereksinimler raporu
  │    Girdi: (tüm teknik artifact'lar)
  │    Çıktı: tech-requirements.md
  └─ +qa-engineer: Test stratejisi
       Girdi: product-requirements.md, tech-requirements.md
       Çıktı: test-strategy.md

Faz 4: Konsolidasyon
  └─ +operation-manager: Kickoff raporu + prime soruları
       Girdi: product-requirements.md, tech-requirements.md, test-strategy.md
       Çıktı: kickoff-reports.md → Approver: +prime

Faz 5: Prime Onay
  └─ +prime: Inline review ile tüm dokümanları inceler, soruları yanıtlar

Faz 6: Backlog Refinement (!refinement)
  └─ +project-manager: Backlog oluşturma (Bkz. Bölüm 11)
```

**Not:** Faz içindeki bazı adımlar sıralıdır (bağımlılık var), bazıları paraleldir. Pipeline engine `dependsOn` alanına bakarak hangi adımların paralel çalışabileceğini otomatik belirler.

### 4.2 DAG Görünümü (UI)

- Yatay akış haritası — paralel adımlar yan yana, bağımlılıklar oklarla bağlı
- Her node: persona avatar, başlık, durum (bekliyor/çalışıyor/review bekliyor/onaylandı/hata)
- Node'a tıklayınca sağda detay paneli açılır:
  - Üretilen doküman (markdown render)
  - Inline review arayüzü (satır seçerek yorum)
  - Onay/Revize butonları
  - Agent log'u (çalışırken)

### 4.3 Execution Flow

1. Kullanıcı "Analiz Başlat" butonuna basar
2. Pipeline engine Faz 1'i başlatır
3. Her adım için:
   a. Cipher complexity analizi yapar → model seçer
   b. Persona context'i oluşturulur (role def + skills + proje bilgisi + önceki dokümanlar)
   c. AI provider API çağrısı yapılır
   d. Sonuç `documents` tablosuna kaydedilir
   e. SSE ile UI güncellenir
   f. Adımın review gerekliliği varsa `awaiting_review` statüsüne geçer
   g. Onay gelince sonraki bağımlı adımlar tetiklenir
4. Tüm adımlar bitince "Prime Kararları" ekranı açılır
5. Prime inline review ile soruları yanıtlar, dokümanları onaylar
6. Kickoff tamamlanır → backlog oluşturulur

---

## 5. AI Provider Sistemi

### 5.1 Provider Abstraction

```typescript
interface AIProvider {
  id: string;
  generateText(prompt: string, options: GenerateOptions): Promise<GenerateResult>;
  streamText(prompt: string, options: GenerateOptions): AsyncIterable<string>;
}

interface GenerateOptions {
  model: string;
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
}

interface GenerateResult {
  text: string;
  usage: { inputTokens: number; outputTokens: number; cost: number };
}
```

Her provider (Claude, OpenAI, Gemini) bu interface'i implement eder. Cipher hangi provider/model'i seçerse, aynı interface üzerinden çağrılır.

### 5.2 Cipher — Model Seçim Motoru

Cipher her görev/pipeline adımı için:

1. Görevin açıklaması, acceptance criteria, ilgili skill'lerin complexity'sini analiz eder
2. Bir **complexity skoru** (1-10) verir
3. Skora göre model kategorisi seçer:
   - 8-10: powerful (Opus, GPT-4o, Gemini Pro)
   - 4-7: balanced (Sonnet, GPT-4o-mini, Gemini Flash)
   - 1-3: fast (Haiku, GPT-3.5, Gemini Flash-Lite)
4. Proje'deki aktif provider'lardan uygun modeli seçer
5. `projectModelConfig`'te override varsa onu kullanır

Prime istediği zaman model atamasını değiştirebilir (görev kartında veya pipeline adımında).

### 5.3 Prompt Builder

Her AI çağrısı için context oluşturur:

```
System Prompt:
  - Persona role definition (roles/[persona].md)
  - Davranış kuralları (rules/behavior.md - özet)
  - Proje bilgisi (platform, tech stack, repo)
  - İlgili skill'ler (skills/[persona]/[skill]/SKILL.md)

User Prompt:
  - Görev açıklaması
  - Önceki dokümanlar (bağımlılıklar)
  - Acceptance criteria
  - Çıktı formatı beklentisi
```

### 5.4 Provider Bağlantı UX

Settings > Providers sayfasında:

- **Claude:** "Bağlan" → Anthropic Console linki açılır → API key yapıştır → encrypted kaydedilir
- **OpenAI:** "Bağlan" → OpenAI Platform linki açılır → API key yapıştır → encrypted kaydedilir
- **Gemini:** "Google ile Bağlan" → OAuth flow → token otomatik alınır

Bağlantı durumu badge ile gösterilir. Bağlı olmayan provider'ın modelleri seçilemez.

---

## 6. Board & Transition Engine

### 6.1 Sütunlar ve Statüler

| Sütun | Statü | Açıklama |
|-------|-------|----------|
| Backlog | backlog | Bekleyen işler, pipeline'a girmemiş |
| Yapılacak | todo | Pipeline'da, sırada |
| Devam Eden | in_progress | Üzerinde çalışılıyor |
| Test: Code Review | test_code_review | +code-reviewer inceliyor |
| Test: QA | test_qa | +qa-engineer test ediyor |
| Test: Security | test_security | +security-engineer tarıyor |
| İnceleme | review | Onay bekliyor (prime veya atanan persona) |
| Tamamlandı | done | Onaylanmış, kapanmış |

### 6.2 Dinamik Test Adımları

Her görevin `testSteps` alanı, o görevin hangi test adımlarından geçeceğini belirler. Backlog oluştururken Cipher (veya prime) labels ile atar:

- `needs-qa` → test_qa adımı eklenir
- `needs-security` → test_security adımı eklenir
- `needs-code-review` → test_code_review adımı eklenir (çoğu görevde varsayılan)

Test adımları **sıralı** çalışır. Örnek:
```
code_review → qa → security
```
Her adım tamamlanınca bir sonrakine geçer.

Bazı görevler test adımı gerektirmez (örn: "Firebase hesabı aç", "MCP kur"). Bu görevler `in_progress`'ten doğrudan `review`'e geçer.

### 6.3 Kart Üzerinde Agent Görünürlüğü

Bir agent görev üzerinde çalışırken kart şu bilgileri gösterir:

```
┌─────────────────────────────┐
│ KTX-42  Auth Sistemi        │
│ 🤖 +backend-developer       │
│ ● Çalışıyor                 │
│ 🔨 3 dosya yazıldı          │
│ ✅ Unit testler geçti        │
└─────────────────────────────┘
```

Agent statüleri: `Çalışıyor` | `Durdu` | `Hata` | `Bloklandı`
(Tamamlandı yok — bitince kart sonraki sütuna geçer)

Tıklayınca canlı terminal log'u açılır (B seçeneği).

### 6.4 Transition Kuralları

```
backlog → todo                    : prime, project-manager
todo → in_progress                : atanan persona
in_progress → test_[first_step]   : atanan persona (iş bitince)
in_progress → review              : atanan persona (test adımı yoksa)
test_X → test_Y                   : ilgili test persona'sı (onaylarsa sıradaki)
test_X → in_progress              : ilgili test persona'sı (reddederse geri)
test_[last_step] → review         : son test persona'sı (onaylarsa)
review → done                     : prime veya atanan reviewer
review → in_progress              : prime veya reviewer (reddederse geri)
any → backlog                     : prime, managers (sıfırlama)
```

---

## 7. Proje Oluşturma Akışı

### 7.1 Tek Sayfa Form

Yeni Proje sayfası — tek form, tüm alanlar:

```
┌──────────────────────────────────────────┐
│  Yeni Proje Oluştur                      │
│                                          │
│  Proje Adı     [________________________]│
│  Proje ID      [________________________]│
│  Platform      (●) Web  ( ) Mobile       │
│                ( ) API  ( ) Full-stack    │
│                                          │
│  ── Repo (Opsiyonel) ──                  │
│  Repo URL      [________________________]│
│  Default Branch [_main_________________] │
│  Git Sync      [✓] .agent/ senkronla     │
│                                          │
│  ── AI Ayarları ──                       │
│  Default Provider  [Claude ▼]            │
│  Model Profili     [Otomatik (Cipher) ▼] │
│                                          │
│          [Oluştur ve Devam Et →]         │
└──────────────────────────────────────────┘
```

### 7.2 Oluşturma Sonrası

Proje oluşturulunca → Product Roadmap giriş ekranı:
- Büyük bir markdown editör alanı
- Framework'teki `references/product-roadmap.md` şablonu pre-filled
- Kullanıcı doldurur → "Analiz Başlat" butonu → Kickoff pipeline tetiklenir

---

## 8. Doküman Yönetimi

### 8.1 Merkezi Dokümanlar Sayfası

Sidebar'da "Dokümanlar" linki. Sayfa:
- Kategorilere göre filtreleme: References | Reports | Memory
- Tipe göre filtreleme: design-system, tech-stack, kickoff-report vs.
- Durum badge'leri: Taslak | İncelemede | Onaylandı
- Arama
- Tıklayınca doküman görüntüleyici açılır

### 8.2 Doküman Görüntüleyici

Split-view layout:
- **Sol panel:** Markdown içerik render edilmiş
- **Sağ panel:** Review alanı — yorumlar, inline notlar

### 8.3 Inline Review

Antigravity'deki review UX'i:
1. Dokümanın herhangi bir satırını/bölümünü seç
2. O bölüme inline yorum yaz
3. Birden fazla inline yorum biriktir
4. "Revize Gönder" ile hepsini tek seferde gönder
5. Veya global bir not yaz
6. Veya direkt "Onayla" butonuna bas

### 8.4 Kontekstüel Erişim

Dokümanlar sadece merkezi sayfada değil, ilgili yerlerde de erişilebilir:
- Kickoff DAG'da: node'a tıklayınca üretilen doküman
- Görev detayında: ilgili memory/handoff dokümanları
- Epic detayında: epic'e bağlı tüm dokümanlar

---

## 9. UI/UX Tasarım Yönü

### 9.1 Görsel Kimlik: Modern SaaS / Linear

- **Font:** Geist Sans (UI) + Geist Mono (code/ID'ler)
- **Renk paleti:** Koyu slate taban (#0c0c14), mor aksan (#7c5cfc)
- **Stil:** Minimal, temiz çizgiler, ince border'lar, subtle glow efektleri
- **İkonlar:** Lucide icons (outline stil)
- **Spacing:** Geniş padding, nefes alan layout
- **Animasyonlar:** Subtle geçişler, skeleton loading states

### 9.2 Renk Sistemi (CSS Variables)

```css
--bg-primary: #0c0c14;
--bg-secondary: #12121e;
--bg-card: #16162a;
--bg-hover: #1e1e36;
--border: #2a2a4a;
--text-primary: #e4e4ed;
--text-secondary: #8888a4;
--text-muted: #5a5a78;
--accent-primary: #7c5cfc;
--accent-hover: #9478ff;
--success: #22c55e;
--warning: #eab308;
--error: #ef4444;
--info: #3b82f6;
```

### 9.3 Navigasyon

**Sidebar (sol):**
- Üstte: Proje switcher dropdown
- Menü: Pano (Board), Kickoff, Dokümanlar, Personalar, Aktivite, Ayarlar
- Altta: +prime kullanıcı bilgisi

**Kontekstüel:** Sidebar menüsü proje statüsüne göre değişir:
- `setup` durumunda: Sadece Proje Ayarları
- `kickoff` durumunda: Kickoff akışı ön planda
- `development` durumunda: Board ön planda

---

## 10. Kickoff Soruları (Prime Kararları)

### 10.1 Akış

1. Kickoff pipeline'ın tüm adımları tamamlanır
2. `+operation-manager` soruları konsolide eder
3. "Prime Kararları" ekranı açılır
4. Tüm sorular tek sayfada, inline review formatında
5. Prime soruları yanıtlar, dokümanları inceler
6. "Onayla ve Devam Et" → Backlog oluşturma tetiklenir

### 10.2 Soru Formatı

Her soru bir "karar noktası":
- Soruyu soran persona
- Soru metni
- Bağlam (hangi dokümanla ilgili)
- Yanıt alanı (metin girişi)
- Opsiyonel seçenekler (çoktan seçmeli olabilir)

---

## 11. Backlog Refinement & Board'a Geçiş

Framework'teki `workflows/backlog-refinements.md` akışının dijital karşılığı. Tetikleyici: Kickoff onayı sonrası otomatik veya `!refinement` komutu.

### 11.1 Backlog Oluşturma (4 Adımlı Pipeline)

**Adım 1 — İskelet (+project-manager):**
- Kickoff dokümanlarından (product-requirements, tech-requirements, kickoff-reports) görevleri çıkarır
- Epic'leri oluşturur
- Story ve Task'ları tanımlar
- Prime'a ait görevleri belirler (domain satın alma, hesap açma vs.) ve `assignee: prime` olarak işaretler

**Adım 2 — Kalite & Etiketleme (+qa-engineer, +security-engineer):**
- `+qa-engineer`: Her göreve acceptance criteria yazar, test gerektirenlere `needs-qa` etiketi ekler
- `+security-engineer`: Güvenlik taraması gerekenlere `needs-security` etiketi ekler
- Muğlak görevler `+project-manager`'a geri gönderilir

**Adım 3 — Bağımlılık & Önceliklendirme (+project-manager):**
- Blocks / Blocked By ilişkileri kurulur
- Öncelikler atanır: Blocker (prime işleri) > High (MVP) > Medium > Low
- Versiyon ataması: hangi epic hangi release'e ait (v0.1, v1.0 vs.)
- Her görev bir epic'e bağlanır

**Adım 4 — Konsolidasyon & Onay:**
- `+project-manager` backlog dokümanını oluşturur (`product-backlog` tipinde document)
- Approver: `+prime`

### 11.2 Backlog Düzenleme Ekranı

Prime onay verdikten sonra düzenleme ekranı açılır:

- Tüm görevler tablo/liste halinde
- Sürükle-bırak ile sıralama
- Her görevde düzenlenebilir alanlar:
  - Başlık, tip (Epic/Story/Task/Bug), öncelik
  - Atanan persona, reporter persona
  - Test adımları (labels: needs-qa, needs-security, needs-code-review)
  - Acceptance criteria
  - Bağımlılıklar (blocks / blocked by)
  - Versiyon
- Görev ekleme / çıkarma
- Epic gruplama

### 11.3 Board'a Aktarım

"Board'a Aktar" butonuna basılınca:
- Görevler `tasks` tablosuna yazılır
- Bağımlılıklar `dependencies` JSON alanına kaydedilir
- Test adımları `testSteps` JSON alanına kaydedilir
- Board görünümüne geçilir
- Proje statüsü `development`'a geçer

---

## 12. Güvenlik & Veri

### 12.1 Credential Encryption

Provider API key'leri SQLite'ta `aes-256-gcm` ile encrypt edilir. Key, environment variable'dan alınır (`KORTEX_ENCRYPTION_KEY`). Yoksa ilk başlatmada otomatik üretilir ve `~/.kortexrc`'ye yazılır.

### 12.2 Erişim Kontrolü

Lokal uygulama — tek kullanıcı (prime). Authentication yok. Sunucu modunda session-based auth eklenebilir (gelecek).

### 12.3 Git Sync Güvenliği

`.agent/` dizinine yazılan dosyalarda asla credential bulunmaz. `accessConfig` tablosu (access.md karşılığı) git sync dışında tutulur.

### 12.4 Proje Credential Yönetimi

Framework'teki `workflows/credential-setup.md` ve `references/access.md` karşılığı:

1. Kickoff'ta `+architect` ve `+devops-engineer` gerekli servisleri belirler (Firebase, AWS, Vercel vs.)
2. Her servis `accessConfig` tablosuna yazılır: servis adı, kategori, gerekli key'ler
3. Prime'a "Bekleyen Credentials" ekranı gösterilir
4. Prime key'leri girer → encrypted olarak saklanır
5. `isProvisioned: true` olunca bağımlı görevler devam edebilir

---

## 13. Deployment Cycle

Framework'teki `workflows/deployment-cycle.md` karşılığı. Tetikleyici: `!deploy` komutu veya UI'da "Deploy" butonu.

### 13.1 Pre-Deployment Checklist

`+devops-engineer` otomatik kontrol:
- [ ] Tüm testler geçti mi (test pipeline)
- [ ] Code review ve security onayları alınmış mı
- [ ] DB migration'lar hazır mı
- [ ] .env değişkenleri doğru mu (accessConfig'ten)
- [ ] Rollback planı var mı

### 13.2 Staging Deploy

- `development` branch'ine merge → otomatik staging deploy
- `+qa-engineer` smoke test + E2E çalıştırır
- Sonuçlar `agentExecutions` + `activityLog`'a yazılır

### 13.3 Production Deploy

- Sadece `main` branch + tag ile tetiklenir
- **+prime onayı zorunlu**
- Post-deploy: smoke test (+qa-engineer), monitoring (+devops-engineer), SEO (+growth-expert)
- `+delivery-manager` release notes yazar
- `+devops-engineer` delivery report yazar

### 13.4 Rollback

- Hata oranı eşiği geçerse otomatik veya `!rollback` ile manuel
- Git revert (asla reset)
- `+engineering-manager` ve `+prime` bilgilendirilir
- Root cause → `memory/learned` dokümanına kaydedilir

---

## 14. Hata Yönetimi & Escalation

Framework'teki `rules/emergency.md` ve `rules/behavior.md` §3 (loop protection) karşılığı.

### 14.1 AI Çağrı Hataları

| Deneme | Aksiyon |
|--------|---------|
| 1. başarısız | Otomatik retry (exponential backoff) |
| 2. başarısız | Farklı model/provider dene (Cipher fallback) |
| 3. başarısız | Escalation: pipeline adımı `failed` statüsüne geçer |

Fail sonrası:
- Pipeline'da: DAG node kırmızıya döner, prime'a bildirim
- Board'da: Kart `Hata` statüsüne geçer, persona + hata mesajı görünür

### 14.2 Escalation Zinciri

```
Persona (hata) → Manager (bilgilendir) → Prime (karar ver)
```

Örnek: `+backend-developer` auth sistemi yazamadı →
1. `+engineering-manager`'a escalate
2. `+engineering-manager` görevi yeniden atar veya modeli değiştirir
3. 3 manager denemesi de başarısız → `+prime`'a yükseltilir

### 14.3 Agent Timeout

- Kickoff adımları: 5 dakika timeout (doküman üretimi)
- Development görevleri: 30 dakika timeout (kod yazımı)
- Timeout → `agentExecutions.status = error`, karta hata bildirilir

### 14.4 UI'da Hata Gösterimi

- **DAG'da:** Node kırmızı border + hata ikonu, tıklayınca hata detayı + retry butonu
- **Board'da:** Kart üzerinde `⚠ Hata` badge, tıklayınca log + hata mesajı + retry/reassign butonları
- **Sidebar:** Kırmızı bildirim badge'i — kaç hata aktif

---

## 15. Komut-UI Eşlemesi

Framework komutlarının UI karşılıkları:

| Komut | UI Aksiyonu | Konum |
|-------|-------------|-------|
| `!start` | "Analiz Başlat" butonu | Roadmap giriş ekranı |
| `!refinement` | Otomatik (kickoff sonrası) veya "Backlog Refinement" butonu | Kickoff tamamlandı ekranı |
| `!start-dev` | "Board'a Aktar" butonu | Backlog düzenleme ekranı |
| `!deploy` | "Deploy" butonu | Board header veya sidebar |
| `!approve` | "Onayla" butonu | Doküman review, görev review |
| `!reject` | "Revize" butonu | Doküman review, görev review |
| `!rollback` | "Rollback" butonu | Deploy ekranı |
| `!export-backlog` | Gelecek sürüm — GitHub Projects entegrasyonu |
| `!sync-backlog` | Gelecek sürüm — GitHub Projects entegrasyonu |
| `!sync-skills` | Gelecek sürüm — harici skill repo entegrasyonu |

---

## 16. SSE Event Tipleri

Real-time güncellemeler için SSE event formatı:

```typescript
interface SSEEvent {
  type: SSEEventType;
  projectId: string;
  payload: Record<string, unknown>;
  timestamp: number;
}

type SSEEventType =
  // Pipeline events
  | "pipeline:step_started"
  | "pipeline:step_completed"
  | "pipeline:step_failed"
  | "pipeline:step_awaiting_review"
  // Board events
  | "task:created"
  | "task:moved"
  | "task:assigned"
  | "task:updated"
  // Agent events
  | "agent:started"
  | "agent:log"        // Canlı log satırı
  | "agent:progress"   // Özet mesaj (3 dosya yazıldı vs.)
  | "agent:completed"
  | "agent:error"
  // Document events
  | "document:created"
  | "document:updated"
  | "document:approved"
  // Review events
  | "review:submitted"
  | "review:approved"
  | "review:revision_requested"
  // System events
  | "notification:error"
  | "notification:info";
```

SSE endpoint: `GET /api/v1/projects/:projectId/stream`
Heartbeat: 30 saniyede bir `:keepalive` mesajı.

---

## 17. Activity Log

### 17.1 Veri Modeli

| Kolon | Tip | Açıklama |
|-------|-----|----------|
| id | text PK | |
| projectId | text FK | → projects.id |
| eventType | text | SSE event type ile aynı |
| actorPersonaId | text FK? | Aksiyonu yapan persona |
| targetType | enum | task, document, pipeline_step, epic, agent_execution |
| targetId | text | İlgili kaydın ID'si |
| description | text | İnsan okunur açıklama (Türkçe) |
| metadata | text (JSON) | Ek bilgi (eski/yeni statü vs.) |
| createdAt | timestamp | |

### 17.2 Kaydedilen Olaylar

- Persona aksiyonları: görev oluşturma, statü değişikliği, atama
- Doküman olayları: oluşturma, review, onay, revize
- Pipeline olayları: adım başlama, tamamlanma, hata
- Agent olayları: başlama, tamamlanma, hata
- Prime kararları: onay, red, override

### 17.3 UI

Sidebar'da "Aktivite" sayfası:
- Kronolojik event listesi (en yeni üstte)
- Event tipi ikonu + renk badge'i
- Filtreleme: event tipi, persona, tarih aralığı
- SSE ile canlı güncelleme — yeni event'ler üstten eklenir

---

## 18. CLI Agent Protokolü

### 18.1 Authentication

CLI agent Kortex API'ye bağlanırken:
- `~/.kortexrc` dosyasından `apiUrl` ve `persona` okur
- Her request'te `X-Persona-Id` ve `X-Project-Id` header'ları gönderir
- Lokal modda auth yok, sunucu modunda API token gerekir (gelecek)

### 18.2 Agent Lifecycle

```
1. Agent başlar → POST /api/v1/agent-executions
   { taskId, personaId, modelId }
   → status: running

2. Agent çalışırken → PATCH /api/v1/agent-executions/:id/log
   { log: "Branch açılıyor..." }
   → SSE broadcast: agent:log

3. Agent ilerleme bildirimi → PATCH /api/v1/agent-executions/:id/progress
   { summary: "3 dosya yazıldı" }
   → SSE broadcast: agent:progress

4. Agent bitirir → PATCH /api/v1/agent-executions/:id/complete
   { status: completed, tokenUsage: {...} }
   → Otomatik task transition tetiklenir

5. Agent hata → PATCH /api/v1/agent-executions/:id/error
   { error: "Test failed: 3/12", status: error }
   → SSE broadcast: agent:error
```

### 18.3 CLI Komutları

```bash
kortex agent run --task KTX-42          # Görevi al ve çalıştır
kortex agent status --task KTX-42       # Agent durumu
kortex agent logs --task KTX-42         # Canlı loglar
kortex task list --status in_progress   # Aktif görevler
kortex task move KTX-42 test            # Statü değişikliği
kortex handoff create --from backend-developer --to qa-engineer --task KTX-42
kortex memory create --category decisions --content "JWT yerine session kullanıldı"
```

---

## 19. Gelecek Sürüm (Deferred)

Şu an kapsam dışı, ileride eklenecek özellikler:

- **GitHub Projects entegrasyonu:** `!export-backlog`, `!sync-backlog` komutları
- **Skill sync:** `!sync-skills` ile harici repo'lardan skill çekme
- **Sunucu modu:** Multi-user auth, session management
- **CI/CD entegrasyonu:** GitHub Actions trigger'ları
- **Deployment UI:** Staging/production deploy ekranı (Bölüm 13 temel yapı, detaylı UI gelecek)
- **i18n altyapısı:** String catalog, çoklu dil desteği
