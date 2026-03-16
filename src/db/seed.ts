import { db } from "./index";
import {
  personas,
  personaHierarchy,
  documentTypes,
  providers,
  models,
} from "./schema";

export function seed() {
  console.log("🌱 Seeding database...");

  // ── Personas (21 roles from framework) ───────────────

  const personaData = [
    { id: "prime", name: "Prime", title: "Project Owner", tier: "prime", decisionLevel: "strategic", parentId: null, emoji: "👑", description: "İnsan kullanıcı. Tüm kararların nihai onay makamı." },
    { id: "operation-manager", name: "Operation Manager", title: "Operasyon Müdürü", tier: "lead", decisionLevel: "strategic", parentId: "prime", emoji: "🎯", description: "Proje akışlarını orkestre eder, kickoff sürecini yönetir." },
    { id: "engineering-manager", name: "Engineering Manager", title: "Mühendislik Müdürü", tier: "lead", decisionLevel: "tactical", parentId: "operation-manager", emoji: "⚙️", description: "Teknik ekibi yönetir, teknik kararları koordine eder." },
    { id: "delivery-manager", name: "Delivery Manager", title: "Teslimat Müdürü", tier: "lead", decisionLevel: "tactical", parentId: "operation-manager", emoji: "📦", description: "Release sürecini ve teslimat takvimini yönetir." },
    { id: "project-manager", name: "Project Manager", title: "Proje Yöneticisi", tier: "lead", decisionLevel: "tactical", parentId: "operation-manager", emoji: "📋", description: "Backlog yönetimi, görev planlaması, bağımlılık takibi." },
    { id: "product-manager", name: "Product Manager", title: "Ürün Yöneticisi", tier: "lead", decisionLevel: "tactical", parentId: "operation-manager", emoji: "💡", description: "Ürün gereksinimlerini analiz eder, PRD oluşturur." },
    { id: "architect", name: "Architect", title: "Yazılım Mimarı", tier: "senior", decisionLevel: "tactical", parentId: "engineering-manager", emoji: "🏗️", description: "Teknoloji yığını, sistem mimarisi, kodlama standartları." },
    { id: "frontend-developer", name: "Frontend Developer", title: "Frontend Geliştirici", tier: "member", decisionLevel: "operational", parentId: "engineering-manager", emoji: "🎨", description: "UI bileşenleri, sayfa geliştirme, responsive tasarım." },
    { id: "backend-developer", name: "Backend Developer", title: "Backend Geliştirici", tier: "member", decisionLevel: "operational", parentId: "engineering-manager", emoji: "🔧", description: "API geliştirme, veritabanı işlemleri, entegrasyonlar." },
    { id: "designer", name: "Designer", title: "UI/UX Tasarımcı", tier: "member", decisionLevel: "operational", parentId: "product-manager", emoji: "🎭", description: "Tasarım sistemi, renk paleti, tipografi, UI kuralları." },
    { id: "qa-engineer", name: "QA Engineer", title: "Kalite Mühendisi", tier: "senior", decisionLevel: "operational", parentId: "engineering-manager", emoji: "🧪", description: "Test stratejisi, kabul kriterleri, smoke test, E2E." },
    { id: "security-engineer", name: "Security Engineer", title: "Güvenlik Mühendisi", tier: "senior", decisionLevel: "operational", parentId: "engineering-manager", emoji: "🛡️", description: "Güvenlik analizi, pen-test, OWASP kontrolleri." },
    { id: "devops-engineer", name: "DevOps Engineer", title: "DevOps Mühendisi", tier: "member", decisionLevel: "operational", parentId: "engineering-manager", emoji: "🚀", description: "CI/CD, deployment, monitoring, Docker." },
    { id: "db-admin", name: "DB Admin", title: "Veritabanı Yöneticisi", tier: "member", decisionLevel: "operational", parentId: "engineering-manager", emoji: "🗄️", description: "Veritabanı şema tasarımı, migration, optimizasyon." },
    { id: "code-reviewer", name: "Code Reviewer", title: "Kod İnceleyici", tier: "senior", decisionLevel: "operational", parentId: "engineering-manager", emoji: "🔍", description: "Kod kalitesi, standartlara uygunluk, best practices." },
    { id: "git-expert", name: "Git Expert", title: "Git Uzmanı", tier: "member", decisionLevel: "operational", parentId: "engineering-manager", emoji: "🌿", description: "Git flow, branch stratejisi, merge yönetimi." },
    { id: "docs-author", name: "Docs Author", title: "Dokümantasyon Uzmanı", tier: "member", decisionLevel: "operational", parentId: "engineering-manager", emoji: "📝", description: "API referans, teknik dokümantasyon." },
    { id: "compliance-expert", name: "Compliance Expert", title: "Uyum Uzmanı", tier: "member", decisionLevel: "operational", parentId: "operation-manager", emoji: "⚖️", description: "KVKK, GDPR, yasal uyumluluk denetimi." },
    { id: "growth-expert", name: "Growth Expert", title: "Büyüme Uzmanı", tier: "member", decisionLevel: "operational", parentId: "product-manager", emoji: "📈", description: "SEO, analytics, büyüme stratejisi." },
    { id: "copywriter", name: "Copywriter", title: "İçerik Yazarı", tier: "member", decisionLevel: "operational", parentId: "product-manager", emoji: "✍️", description: "İçerik stratejisi, UX yazarlığı, metin üretimi." },
    { id: "performance-engineer", name: "Performance Engineer", title: "Performans Mühendisi", tier: "member", decisionLevel: "operational", parentId: "engineering-manager", emoji: "⚡", description: "Performans analizi, optimizasyon, yük testi." },
  ];

  for (const p of personaData) {
    db.insert(personas).values(p).onConflictDoNothing().run();
  }
  console.log(`  ✓ ${personaData.length} personas seeded`);

  // ── Persona Hierarchy ────────────────────────────────

  const hierarchyData = [
    { personaId: "prime", managerId: null, escalationChain: "[]", canDelegateToIds: '["operation-manager"]' },
    { personaId: "operation-manager", managerId: "prime", escalationChain: '["prime"]', canDelegateToIds: '["engineering-manager","delivery-manager","project-manager","product-manager"]' },
    { personaId: "engineering-manager", managerId: "operation-manager", escalationChain: '["operation-manager","prime"]', canDelegateToIds: '["architect","frontend-developer","backend-developer","qa-engineer","security-engineer","devops-engineer","db-admin","code-reviewer","git-expert","docs-author","performance-engineer"]' },
    { personaId: "delivery-manager", managerId: "operation-manager", escalationChain: '["operation-manager","prime"]', canDelegateToIds: "[]" },
    { personaId: "project-manager", managerId: "operation-manager", escalationChain: '["operation-manager","prime"]', canDelegateToIds: "[]" },
    { personaId: "product-manager", managerId: "operation-manager", escalationChain: '["operation-manager","prime"]', canDelegateToIds: '["designer","growth-expert","copywriter"]' },
    { personaId: "architect", managerId: "engineering-manager", escalationChain: '["engineering-manager","operation-manager","prime"]', canDelegateToIds: "[]" },
    { personaId: "frontend-developer", managerId: "engineering-manager", escalationChain: '["engineering-manager","operation-manager","prime"]', canDelegateToIds: "[]" },
    { personaId: "backend-developer", managerId: "engineering-manager", escalationChain: '["engineering-manager","operation-manager","prime"]', canDelegateToIds: "[]" },
    { personaId: "designer", managerId: "product-manager", escalationChain: '["product-manager","operation-manager","prime"]', canDelegateToIds: "[]" },
    { personaId: "qa-engineer", managerId: "engineering-manager", escalationChain: '["engineering-manager","operation-manager","prime"]', canDelegateToIds: "[]" },
    { personaId: "security-engineer", managerId: "engineering-manager", escalationChain: '["engineering-manager","operation-manager","prime"]', canDelegateToIds: "[]" },
    { personaId: "devops-engineer", managerId: "engineering-manager", escalationChain: '["engineering-manager","operation-manager","prime"]', canDelegateToIds: "[]" },
    { personaId: "db-admin", managerId: "engineering-manager", escalationChain: '["engineering-manager","operation-manager","prime"]', canDelegateToIds: "[]" },
    { personaId: "code-reviewer", managerId: "engineering-manager", escalationChain: '["engineering-manager","operation-manager","prime"]', canDelegateToIds: "[]" },
    { personaId: "git-expert", managerId: "engineering-manager", escalationChain: '["engineering-manager","operation-manager","prime"]', canDelegateToIds: "[]" },
    { personaId: "docs-author", managerId: "engineering-manager", escalationChain: '["engineering-manager","operation-manager","prime"]', canDelegateToIds: "[]" },
    { personaId: "compliance-expert", managerId: "operation-manager", escalationChain: '["operation-manager","prime"]', canDelegateToIds: "[]" },
    { personaId: "growth-expert", managerId: "product-manager", escalationChain: '["product-manager","operation-manager","prime"]', canDelegateToIds: "[]" },
    { personaId: "copywriter", managerId: "product-manager", escalationChain: '["product-manager","operation-manager","prime"]', canDelegateToIds: "[]" },
    { personaId: "performance-engineer", managerId: "engineering-manager", escalationChain: '["engineering-manager","operation-manager","prime"]', canDelegateToIds: "[]" },
  ];

  for (const h of hierarchyData) {
    db.insert(personaHierarchy).values(h).onConflictDoNothing().run();
  }
  console.log(`  ✓ ${hierarchyData.length} hierarchy entries seeded`);

  // ── Document Types (20 from spec §3.2) ───────────────

  const docTypeData = [
    { id: "product-roadmap", category: "reference", title: "Product Roadmap", ownerPersonaId: "prime", reviewerPersonaId: null, approverPersonaId: null },
    { id: "legal-reports", category: "report", title: "Yasal Uyum Raporu", ownerPersonaId: "compliance-expert", reviewerPersonaId: null, approverPersonaId: "prime" },
    { id: "growth-strategy", category: "reference", title: "Büyüme Stratejisi", ownerPersonaId: "growth-expert", reviewerPersonaId: null, approverPersonaId: "prime" },
    { id: "product-requirements", category: "report", title: "Ürün Gereksinimleri (PRD)", ownerPersonaId: "product-manager", reviewerPersonaId: null, approverPersonaId: "prime" },
    { id: "content-strategy", category: "reference", title: "İçerik Stratejisi", ownerPersonaId: "copywriter", reviewerPersonaId: null, approverPersonaId: "prime" },
    { id: "tech-stack", category: "reference", title: "Teknoloji Yığını", ownerPersonaId: "architect", reviewerPersonaId: null, approverPersonaId: null },
    { id: "security-reports", category: "report", title: "Güvenlik Raporu", ownerPersonaId: "security-engineer", reviewerPersonaId: "architect", approverPersonaId: null },
    { id: "dictionary", category: "reference", title: "Kodlama Standartları", ownerPersonaId: "architect", reviewerPersonaId: null, approverPersonaId: null },
    { id: "file-system", category: "reference", title: "Dosya Yapısı", ownerPersonaId: "architect", reviewerPersonaId: null, approverPersonaId: null },
    { id: "design-system", category: "reference", title: "Tasarım Sistemi", ownerPersonaId: "designer", reviewerPersonaId: "frontend-developer", approverPersonaId: "prime" },
    { id: "db-schema", category: "reference", title: "Veritabanı Şeması", ownerPersonaId: "db-admin", reviewerPersonaId: null, approverPersonaId: null },
    { id: "api-reference", category: "reference", title: "API Referansı", ownerPersonaId: "docs-author", reviewerPersonaId: "backend-developer", approverPersonaId: null },
    { id: "tech-requirements", category: "report", title: "Teknik Gereksinimler", ownerPersonaId: "engineering-manager", reviewerPersonaId: null, approverPersonaId: null },
    { id: "test-strategy", category: "reference", title: "Test Stratejisi", ownerPersonaId: "qa-engineer", reviewerPersonaId: null, approverPersonaId: null },
    { id: "kickoff-reports", category: "report", title: "Kickoff Raporu", ownerPersonaId: "operation-manager", reviewerPersonaId: null, approverPersonaId: "prime" },
    { id: "active-context", category: "memory", title: "Aktif Bağlam", ownerPersonaId: "operation-manager", reviewerPersonaId: null, approverPersonaId: null },
    { id: "handover", category: "memory", title: "Devir Notları", ownerPersonaId: "operation-manager", reviewerPersonaId: null, approverPersonaId: null },
    { id: "decisions", category: "memory", title: "Kararlar", ownerPersonaId: "operation-manager", reviewerPersonaId: null, approverPersonaId: null },
    { id: "learned", category: "memory", title: "Öğrenilen Dersler", ownerPersonaId: "operation-manager", reviewerPersonaId: null, approverPersonaId: null },
    { id: "snippets", category: "memory", title: "Kod Parçacıkları", ownerPersonaId: "operation-manager", reviewerPersonaId: null, approverPersonaId: null },
  ];

  for (const dt of docTypeData) {
    db.insert(documentTypes).values(dt).onConflictDoNothing().run();
  }
  console.log(`  ✓ ${docTypeData.length} document types seeded`);

  // ── Providers ────────────────────────────────────────

  const providerData = [
    { id: "claude", name: "Claude (Anthropic)", authType: "api_key", isConnected: false },
    { id: "openai", name: "OpenAI", authType: "api_key", isConnected: false },
    { id: "gemini", name: "Gemini (Google)", authType: "api_key", isConnected: false },
  ];

  for (const p of providerData) {
    db.insert(providers).values(p).onConflictDoNothing().run();
  }
  console.log(`  ✓ ${providerData.length} providers seeded`);

  // ── Models ───────────────────────────────────────────

  const modelData = [
    { id: "claude-opus-4", providerId: "claude", name: "Claude Opus 4", category: "powerful", costTier: "high", contextWindow: 200000, isAvailable: true },
    { id: "claude-sonnet-4", providerId: "claude", name: "Claude Sonnet 4", category: "balanced", costTier: "medium", contextWindow: 200000, isAvailable: true },
    { id: "claude-haiku-3.5", providerId: "claude", name: "Claude Haiku 3.5", category: "fast", costTier: "low", contextWindow: 200000, isAvailable: true },
    { id: "gpt-4o", providerId: "openai", name: "GPT-4o", category: "powerful", costTier: "high", contextWindow: 128000, isAvailable: true },
    { id: "gpt-4o-mini", providerId: "openai", name: "GPT-4o Mini", category: "balanced", costTier: "medium", contextWindow: 128000, isAvailable: true },
    { id: "gpt-3.5-turbo", providerId: "openai", name: "GPT-3.5 Turbo", category: "fast", costTier: "low", contextWindow: 16385, isAvailable: true },
    { id: "gemini-2.5-pro", providerId: "gemini", name: "Gemini 2.5 Pro", category: "powerful", costTier: "high", contextWindow: 1000000, isAvailable: true },
    { id: "gemini-2.5-flash", providerId: "gemini", name: "Gemini 2.5 Flash", category: "balanced", costTier: "medium", contextWindow: 1000000, isAvailable: true },
    { id: "gemini-2.0-flash-lite", providerId: "gemini", name: "Gemini 2.0 Flash Lite", category: "fast", costTier: "low", contextWindow: 1000000, isAvailable: true },
  ];

  for (const m of modelData) {
    db.insert(models).values(m).onConflictDoNothing().run();
  }
  console.log(`  ✓ ${modelData.length} models seeded`);

  console.log("✅ Seed complete!");
}
