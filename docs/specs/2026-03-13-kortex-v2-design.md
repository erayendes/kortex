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
- **Persona = AI Agent:** 21 persona gerçek AI model çağrılarıyla çalışır
- **Prime = İnsan:** +prime her zaman insan kullanıcı, asla AI
- **Türkçe UI / İngilizce API:** Kullanıcı arayüzü Türkçe, tüm API ve kod İngilizce
- **Multi-Model:** Claude, OpenAI, Gemini aynı anda kullanılabilir

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
| status | enum | running, paused, error, blocked |
| logs | text | Canlı log stream |
| tokenUsage | text (JSON) | {input, output, cost} |
| startedAt | timestamp | |
| completedAt | timestamp? | |

### 3.2 Mevcut Tablolardan Değişenler

#### personas (global, değişmez)
21 persona tüm projelerde aynı. Mevcut yapı korunur.

#### tasks (genişler)
| Eklenen Kolon | Tip | Açıklama |
|---------------|-----|----------|
| projectId | text FK | → projects.id |
| labels | text (JSON) | ["needs-qa", "needs-security"] |
| testSteps | text (JSON) | Sıralı test adımları ["code_review", "qa", "security"] |
| currentTestStep | text? | Şu an hangi test adımında |

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

Framework'teki `workflows/kickoff.md`'deki 6 faz DAG olarak modellenir:

```
Faz 1: Oryantasyon
  └─ +operation-manager: Proje analizi

Faz 2: Ürün Analizi (paralel)
  ├─ +product-manager: PRD
  ├─ +compliance-expert: KVKK/GDPR
  └─ +growth-expert: Büyüme stratejisi

Faz 3: Teknik Mimari (paralel, Faz 2'ye bağımlı)
  ├─ +architect: Tech stack + mimari kararlar
  ├─ +designer: Design system
  ├─ +security-engineer: Güvenlik analizi
  └─ +db-admin: DB schema tasarımı

Faz 4: İnceleme Zinciri
  ├─ +frontend-developer: Design system incelemesi
  ├─ +backend-developer: API reference incelemesi
  └─ +code-reviewer: Genel kod standartları

Faz 5: Konsolidasyon
  └─ +operation-manager: Kickoff raporu + prime soruları

Faz 6: Prime Onay
  └─ +prime: Inline review + soru yanıtları
```

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

## 11. Backlog'dan Board'a Geçiş

### 11.1 Akış

1. Kickoff + prime onayı tamamlanır
2. `+project-manager` backlog'u oluşturur (dokümanlardan görevleri çıkarır)
3. **Düzenleme ekranı** açılır:
   - Tüm görevler liste halinde
   - Sürükle-bırak ile sıralama
   - Her görevde: başlık, tip, öncelik, atanan persona, test adımları (labels)
   - Görev ekleme/çıkarma
   - Epic gruplama
4. "Board'a Aktar" butonuna basılınca:
   - Görevler `tasks` tablosuna yazılır
   - Board görünümüne geçilir
   - Proje statüsü `development`'a geçer

---

## 12. Güvenlik & Veri

### 12.1 Credential Encryption

Provider API key'leri SQLite'ta `aes-256-gcm` ile encrypt edilir. Key, environment variable'dan alınır (`KORTEX_ENCRYPTION_KEY`). Yoksa ilk başlatmada otomatik üretilir ve `~/.kortexrc`'ye yazılır.

### 12.2 Erişim Kontrolü

Lokal uygulama — tek kullanıcı (prime). Authentication yok. Sunucu modunda session-based auth eklenebilir (gelecek).

### 12.3 Git Sync Güvenliği

`.agent/` dizinine yazılan dosyalarda asla credential bulunmaz. `references/access.md` git sync dışında tutulur.
