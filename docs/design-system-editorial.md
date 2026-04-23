# Design System — Couche Éditoriale (patch v3)

> Ce fichier surcharge des valeurs spécifiques de v3 pour corriger l'effet "trop UI / trop engineered".
> À appliquer par-dessus v3. En cas de conflit, ce fichier a la priorité.
>
> Principe directeur : un bon site d'affiliation doit paraître **écrit**, pas **conçu**.
> Le design doit être invisible. La crédibilité passe par l'imperfection contrôlée.

---

## 01 · Typographie — désactiver le mode UI

### Problème v3
`letter-spacing: 0.08em` + labels uppercase + tout en même taille = effet dashboard SaaS.

### Correction

```css
/* v3 avait 0.08em partout — trop rigide */

/* Labels de navigation, breadcrumb, catégories */
.label-ui {
  letter-spacing: 0.05em;  /* était 0.08em */
  text-transform: uppercase;
  font-size: 11px;
  font-weight: 600;
}

/* Labels de section éditoriale — PAS uppercase */
.label-editorial {
  letter-spacing: 0;
  text-transform: none;
  font-size: 12px;
  font-weight: 600;
  color: var(--color-primary-500);
}
```

**Règle :** uppercase + letter-spacing élevé = uniquement pour la navigation et les étiquettes UI (breadcrumb, catégorie produit). Dans le contenu éditorial (pros/cons title, section headers dans l'article), pas d'uppercase.

### Tailles de texte — relâcher certains blocs

```css
/* v3 : pros/cons à 14px — trop petit, effet liste de features SaaS */
.pros-cons-item {
  font-size: 15px;   /* était 14px */
  line-height: 1.55; /* était 1.45 — plus aéré */
}

/* v3 : criteria labels à 13px — trop petit, effet dashboard */
.criteria-label {
  font-size: 14px;   /* était 13px */
  font-weight: 500;  /* était 600 — moins mécanique */
}

.criteria-score {
  font-size: 14px;   /* était 13px */
}
```

---

## 02 · Couleurs — adapter aux émotions de la niche

### Problème v3
Les cons sont toujours orange et les pros toujours vert. Sur une niche déco ou luxe, ces couleurs "alertes" cassent l'ambiance soignée.

### Correction — tokens émotionnels par niche

```css
:root {
  /* Couleurs pros/cons — valeurs par défaut (niches tech/électro) */
  --color-pro-bg:    var(--color-accent-50);
  --color-pro-border: var(--color-accent-200);
  --color-pro-title: var(--color-accent-700);
  --color-pro-text:  var(--color-accent-800);
  --color-pro-icon:  var(--color-accent-500);

  --color-con-bg:    hsl(25, 90%, 97%);
  --color-con-border: hsl(25, 80%, 85%);
  --color-con-title: hsl(25, 80%, 35%);
  --color-con-text:  hsl(25, 70%, 30%);
  --color-con-icon:  hsl(25, 80%, 55%);
}

/* Déco / luxe — tons plus neutres, moins "alerte" */
[data-site="deco"],
[data-site="luxe"] {
  --color-pro-bg:    hsl(155, 20%, 96%);
  --color-pro-border: hsl(155, 20%, 82%);
  --color-pro-title: hsl(155, 30%, 30%);
  --color-pro-text:  hsl(155, 25%, 25%);
  --color-pro-icon:  hsl(155, 35%, 40%);

  --color-con-bg:    hsl(35, 20%, 96%);
  --color-con-border: hsl(35, 20%, 82%);
  --color-con-title: hsl(35, 30%, 32%);
  --color-con-text:  hsl(35, 25%, 28%);
  --color-con-icon:  hsl(35, 35%, 45%);
}

/* Bébé / puériculture — ultra doux, zéro alarme */
[data-site="bebe"] {
  --color-pro-bg:    hsl(200, 40%, 96%);
  --color-pro-border: hsl(200, 30%, 82%);
  --color-pro-title: hsl(200, 50%, 32%);
  --color-pro-text:  hsl(200, 40%, 28%);
  --color-pro-icon:  hsl(200, 55%, 45%);

  --color-con-bg:    hsl(350, 30%, 97%);
  --color-con-border: hsl(350, 25%, 85%);
  --color-con-title: hsl(350, 35%, 38%);
  --color-con-text:  hsl(350, 30%, 33%);
  --color-con-icon:  hsl(350, 40%, 52%);
}
```

**Mettre à jour les composants pros/cons pour utiliser ces tokens :**
```css
.pros-block {
  background: var(--color-pro-bg);
  border: 1px solid var(--color-pro-border);
}
.pros-block .pros-cons-title { color: var(--color-pro-title); }
.pros-block .pros-cons-item  { color: var(--color-pro-text); }
.pros-block .pros-cons-icon  { background: var(--color-pro-icon); color: white; }

.cons-block {
  background: var(--color-con-bg);
  border: 1px solid var(--color-con-border);
}
.cons-block .pros-cons-title { color: var(--color-con-title); }
.cons-block .pros-cons-item  { color: var(--color-con-text); }
.cons-block .pros-cons-icon  { background: var(--color-con-icon); color: white; }
```

### Verdict block — réduire la saturation

```css
/* v3 : fond primary-900 trop saturé sur certaines niches */
.verdict-block {
  /* Remplacer background: var(--color-primary-900) par : */
  background: hsl(
    var(--color-primary-h),
    calc(var(--color-primary-s) * 0.6),  /* saturation réduite à 60% */
    14%
  );
}

/* Accent line — moins vif */
.verdict-block::before {
  opacity: 0.7;  /* était 1 — légèrement adouci */
}

/* Texte principal — légèrement plus doux */
.verdict-text {
  color: rgba(255, 255, 255, 0.75);  /* était 0.80 */
}
```

---

## 03 · Critères — sortir du mode dashboard

### Problème v3
Barres parfaitement alignées + labels en grid strict = ressemble à un panel analytics, pas à un avis produit.

### Correction

```css
/* Ajouter un léger décalage à la barre de track */
.criteria-bar-track {
  height: 7px;   /* était 8px — micro-variation */
  background: var(--color-neutral-100);   /* était neutral-200 — plus doux */
  border-radius: var(--radius-full);
}

/* Retirer le fond gris du panel */
.scoring-panel {
  background: transparent;    /* était neutral-50 */
  border: none;               /* était border-default */
  padding: var(--space-5) 0;  /* garder l'espacement vertical */
  border-top: 1px solid var(--color-neutral-200);
  border-bottom: 1px solid var(--color-neutral-200);
}
```

**Le scoring panel sur fond blanc sans boîte → paraît moins "outil", plus "contenu".**

---

## 04 · Système de sections — 3 registres visuels

### Le vrai problème
En v3, presque tous les blocs ont un fond + une bordure. Le résultat : la page ressemble à un ensemble de cartes empilées — effet UI kit évident.

### Solution : 3 registres de section

```css
/* ─────────────────────────────────────
   REGISTRE 1 : Structuré (UI)
   Utiliser pour : scoring panel, sticky bar, product info panel
   ───────────────────────────────────── */
.section-structured {
  background: var(--color-neutral-50);
  border: 1px solid var(--color-neutral-200);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
}

/* ─────────────────────────────────────
   REGISTRE 2 : Semi-structuré
   Utiliser pour : pros/cons, trust block, tableau comparatif
   ───────────────────────────────────── */
.section-semi {
  border-top: 1px solid var(--color-neutral-200);
  padding: var(--space-8) 0;
  /* PAS de fond, PAS de border-radius, PAS de border sur les côtés */
}

/* ─────────────────────────────────────
   REGISTRE 3 : Éditorial (nu)
   Utiliser pour : contenu article long, FAQ, biographie auteur
   ───────────────────────────────────── */
.section-editorial {
  padding: var(--space-6) 0;
  /* Zéro chrome — que du texte et de l'espace */
}
```

**Règle de distribution sur la page produit :**

| Bloc | Registre |
|---|---|
| Hero (galerie + info panel) | Structuré |
| "Notre avis en 30 secondes" | Semi-structuré |
| Scoring panel | Semi-structuré (pas de boîte) |
| Pros / Cons | Semi-structuré |
| Contenu éditorial | **Éditorial** |
| Tableau caractéristiques | Semi-structuré |
| Tableau comparatif | Structuré |
| Verdict final | Exception (fond sombre) |
| Produits similaires | Structuré |
| FAQ | **Éditorial** |
| Bloc confiance | Semi-structuré |

**Résultat attendu** : la page respire. L'alternance structuré / nu / semi crée un rythme organique — l'œil ne perçoit plus un empilement de cartes.

---

## 05 · Rythme des espacements — introduire la variation

### Problème v3
`margin-bottom: var(--space-12)` partout = espacement robotique.

### Correction — rythme éditorial

```css
/* Sections rapprochées — pensée comme un même bloc */
.rhythm-tight   { margin-bottom: var(--space-8);  }  /* 32px */

/* Sections standard */
.rhythm-default { margin-bottom: var(--space-12); }  /* 48px */

/* Sections qui marquent une rupture thématique */
.rhythm-wide    { margin-bottom: var(--space-16); }  /* 64px */
```

**Application sur la page produit :**

| Entre ces deux blocs | Rythme |
|---|---|
| Hero → "Notre avis en 30s" | tight |
| "Notre avis en 30s" → Scoring panel | tight |
| Scoring panel → Pros/Cons | default |
| Pros/Cons → Contenu éditorial | wide |
| Contenu → Verdict final | wide |
| Verdict → Produits similaires | default |
| Produits similaires → FAQ | default |

---

## 06 · Micro-règles éditoriales

Ces règles ne modifient pas les composants mais régissent leur usage dans le contenu.

### Retirer les bordures superflues dans le contenu long

Dans `.section-editorial`, supprimer toutes les bordures des blocs enfants :
```css
.section-editorial .trust-block,
.section-editorial .faq-item:first-child {
  border-top: none;
}
```

### Permettre les sections sans fond

Tout bloc qui existe uniquement pour "contenir" du texte **ne doit pas avoir de fond**. Le fond neutre-50 est réservé aux blocs qui présentent des données structurées (tableaux, scoring).

### Taille de texte dans les blocs éditoriaux

Dans `.section-editorial`, le corps de texte remonte légèrement :
```css
.section-editorial p,
.section-editorial li {
  font-size: 16px;  /* était 15px — plus "article" */
  line-height: 1.75; /* plus aéré */
  color: var(--color-neutral-700);
}
```

### Supprimer les borders des FAQ items dans le contenu

```css
/* En contexte éditorial, les FAQ ont juste l'espace — pas de ligne */
.section-editorial .faq-item {
  border-bottom: none;
  padding: var(--space-3) 0;
}
.section-editorial .faq-question {
  font-size: 17px;
}
```

---

## 07 · Résumé des overrides — cheatsheet pour Cursor

Liste des valeurs qui changent entre v3 et ce patch :

| Propriété | v3 | Patch éditorial |
|---|---|---|
| Label `letter-spacing` | `0.08em` | `0.05em` (UI) / `0` (éditorial) |
| `pros-cons-item` font-size | `14px` | `15px` |
| `pros-cons-item` line-height | `1.45` | `1.55` |
| `criteria-label` font-size | `13px` | `14px` |
| `criteria-label` font-weight | `600` | `500` |
| `criteria-bar-track` height | `8px` | `7px` |
| `criteria-bar-track` background | `neutral-200` | `neutral-100` |
| `scoring-panel` background | `neutral-50` | `transparent` |
| `scoring-panel` border | `border-default` | `none` |
| `verdict-block` saturation | `100%` | `60%` |
| `verdict-text` opacity | `0.80` | `0.75` |
| Body text in editorial | `15px / 1.65` | `16px / 1.75` |
| Pros/cons colors | Fixes (orange/vert) | Via tokens niche |
| Section backgrounds | Presque toutes | Registre 1/2/3 |
| Spacing entre sections | Uniforme | tight / default / wide |
