# Kortex v2

AI Agent Workflow Management System — Milowda/Antigravity framework'unun web uygulamasi.

## Tech Stack

- **Frontend:** Next.js 16, React 19, Tailwind CSS v4, @dnd-kit
- **Backend:** Next.js App Router API Routes, SSE (Server-Sent Events)
- **Database:** SQLite + better-sqlite3 + Drizzle ORM
- **AI:** Claude (@anthropic-ai/sdk), OpenAI, Google Gemini (@google/genai)
- **CLI:** commander.js + chalk

## Kurulum

```bash
# Bagimliliklari yukle
npm install

# Veritabanini olustur ve seed data ekle
npm run db:generate
npm run db:migrate
npm run seed

# Gelistirme sunucusunu baslat
npm run dev
```

Uygulama `http://localhost:3000` adresinde calisir.

## CLI

```bash
cd cli
npm install
npx tsx src/index.ts --help
```

### CLI Komutlari

```
kortex config set-url <url>     API URL ayarla
kortex config set-persona <id>  Varsayilan persona ayarla
kortex config show              Konfigurasyonu goster

kortex task list                Gorevleri listele
kortex task get <id>            Gorev detayi
kortex task create -t "Baslik"  Yeni gorev olustur
kortex task move <id> <status>  Gorev durumunu degistir
kortex task assign <id> <pid>   Gorevi persona'ya ata
kortex task comment <id> "msg"  Yorum ekle

kortex board                    Kanban panosu ozeti
kortex handoff create           Devir teslim olustur
kortex memory list              Hafiza notlarini listele
kortex review <docId>           Dokuman incele
kortex cmd <command>            Framework komutu calistir
kortex activity                 Aktivite akisi
```

## Ozellikler

### Kanban Board (Pano)
Surukle-birak gorev yonetimi. SSE ile gercek zamanli guncellemeler. Durum gecisleri: backlog -> todo -> in_progress -> test -> review -> done.

### Kickoff Pipeline (Baslangic)
DAG tabanli 15 adimlik analiz pipeline'i. Her adim bir persona tarafindan yurutulur. Cipher model secimi ile otomatik AI provider atamasi.

### Backlog Refinement
4 adimli pipeline: iskelet -> kalite -> bagimlilik -> konsolidasyon. Duzenleme ekrani ile gorevleri board'a aktarma.

### Dokuman Yonetimi
Split-view dokuman goruntuleme. Inline review sistemi. Kategorilere gore filtreleme.

### Hafiza Sistemi
5 kategorili not sistemi: aktif baglam, devir teslim, kararlar, ogrenilenler, kod parcalari.

### Persona Yonetimi
21 AI persona hiyerarsik agac gorunumu. Tier bazli yetkilendirme (lead/senior/mid/junior).

### AI Orchestration
Cipher model secim motoru. Karmasiklik puani -> model kategorisi eslestirmesi. Claude, OpenAI, Gemini provider desteegi.

### SSE Real-time
Canli guncellemeler. Board, pipeline, aktivite olaylari aninda yansir.

## Proje Yapisi

```
src/
  app/
    (dashboard)/          # Tum sayfalar
      board/              # Kanban panosu
      kickoff/            # Pipeline gorunumu
      backlog/            # Backlog duzenleme
      documents/          # Dokuman listesi + detay
      memory/             # Hafiza notlari
      personas/           # Persona agaci
      projects/           # Proje yonetimi
      settings/           # Provider ayarlari
      activity/           # Aktivite akisi
      task/[id]/          # Gorev detayi
    api/v1/               # REST API
  components/
    ui/                   # Button, Badge, Input, Modal, etc.
    layout/               # Sidebar, ProjectSwitcher
    board/                # KanbanBoard, TaskCard, KanbanColumn
    kickoff/              # DAGView, StepNode, StepDetailPanel
    backlog/              # BacklogEditor
    persona/              # PersonaTree
  db/
    schema.ts             # 21 Drizzle tablo tanimi
    index.ts              # SQLite baglantisi
    seed.ts               # Persona + dokuman tip seed
  lib/
    ai/                   # Provider abstraction + Cipher
    engine/               # Transition, Pipeline, Permission, Command
    sse-manager.ts        # SSE broadcast singleton
  hooks/                  # useBoard, useProjects, useSSE

cli/                      # Standalone CLI paketi
  src/
    commands/             # task, handoff, memory, review, cmd, board, activity
    client.ts             # HTTP client
    config.ts             # ~/.kortexrc
```

## API Endpoints

| Method | Path | Aciklama |
|--------|------|----------|
| GET/POST | `/api/v1/projects` | Proje CRUD |
| GET/PATCH | `/api/v1/projects/[id]` | Proje detay |
| GET | `/api/v1/projects/[id]/stream` | SSE stream |
| GET/POST | `/api/v1/tasks` | Gorev CRUD |
| POST | `/api/v1/tasks/[id]/transition` | Durum gecisi |
| PATCH | `/api/v1/tasks/[id]/reorder` | Siralama |
| GET/POST | `/api/v1/tasks/[id]/comments` | Yorumlar |
| GET/POST | `/api/v1/documents` | Dokuman CRUD |
| GET/POST | `/api/v1/documents/[id]/reviews` | Review |
| GET/POST | `/api/v1/memory` | Hafiza CRUD |
| GET/PATCH/DELETE | `/api/v1/memory/[id]` | Hafiza detay |
| GET/POST | `/api/v1/commands` | Komut calistirma |
| GET/POST | `/api/v1/pipeline` | Pipeline yonetimi |
| PATCH | `/api/v1/pipeline/[stepId]` | Adim onayla/revize |
| GET/POST | `/api/v1/handoffs` | Devir teslim |
| GET | `/api/v1/handoffs/pending` | Bekleyen devirler |
| GET | `/api/v1/activity` | Aktivite akisi |
| GET | `/api/v1/personas` | Persona listesi |
| GET/PATCH | `/api/v1/providers` | AI provider ayarlari |

## Lisans

MIT
