"use client";

import { useMemo, useState } from "react";
import { RemoteProductImage } from "./remote-product-image.js";
import styles from "./product-page-template.module.css";

type BreadcrumbItem = { label: string; href: string };
type Criterion = { label: string; score: number; outOf?: number };
type ProsCons = { pros: string[]; cons: string[] };
type SpecGroup = { title: string; items: Array<{ label: string; value: string }> };
type VerdictAudience = { label: string; recommended: boolean };
type Verdict = { score: number; outOf?: number; text?: string; audiences?: VerdictAudience[] };
type FaqItem = { question: string; answer: string };
type TrustSignals = {
  authorName?: string;
  authorRole?: string;
  updatedAt?: string;
  editorialBadge?: string;
  comparedCount?: number;
};
type ProfileItem = {
  label: string;
  description?: string;
  relevance?: "excellent" | "good" | "maybe";
  icon?: string;
};

export type ProductPageTemplateProps = {
  title: string;
  brand?: string | null;
  description?: string | null;
  price?: number | null;
  currency?: string | null;
  rating?: number | null;
  priceCheckedAt?: string;
  images: string[];
  ctaHref: string;
  ctaLabel?: string;
  breadcrumb?: BreadcrumbItem[];
  richContentHtml?: string;
  shortReview?: string;
  criteria?: Criterion[];
  prosCons?: ProsCons;
  specs?: SpecGroup[];
  verdict?: Verdict;
  faq?: FaqItem[];
  faqTitle?: string;
  disclaimer?: string;
  trustSignals?: TrustSignals;
  profiles?: ProfileItem[];
};

function formatPrice(price: number, currency: string) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(price);
}

function clampPercent(score: number, outOf: number) {
  return Math.max(0, Math.min(100, (score / outOf) * 100));
}

function getScoreTone(score: number, outOf: number) {
  const ratio = score / outOf;
  if (ratio >= 0.8) return "good";
  if (ratio >= 0.6) return "warn";
  return "bad";
}

function splitProsConsItem(item: string) {
  const separators = [" — ", ": "];
  for (const separator of separators) {
    const parts = item.split(separator);
    if (parts.length > 1) {
      return { lead: parts[0], rest: parts.slice(1).join(separator), separator };
    }
  }
  return { lead: item, rest: "", separator: "" };
}

export function ProductPageTemplate(props: ProductPageTemplateProps) {
  const {
    title,
    description,
    price,
    currency,
    rating,
    priceCheckedAt,
    images,
    ctaHref,
    ctaLabel = "Voir l'offre",
    breadcrumb = [],
    richContentHtml,
    shortReview,
    criteria = [],
    prosCons,
    specs = [],
    verdict,
    faq = [],
    faqTitle = "Ce qu'on nous demande souvent",
    disclaimer = "",
    trustSignals,
    profiles = [],
  } = props;

  const safeImages = useMemo(() => images.filter(Boolean), [images]);
  const [selectedImage, setSelectedImage] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(faq.length > 0 ? 0 : null);
  const mainImage = safeImages[selectedImage] ?? safeImages[0] ?? "";
  const displayCurrency = currency || "EUR";
  const displayRating = rating ?? verdict?.score ?? null;
  const profileCards: ProfileItem[] =
    profiles.length > 0
      ? profiles
      : (verdict?.audiences ?? []).map((item) => ({
          label: item.label,
          description: undefined,
          relevance: item.recommended ? "excellent" : "good",
          icon: item.recommended ? "🎯" : "🧩",
        }));

  return (
    <article className={styles.page}>
      {breadcrumb.length > 0 ? (
        <nav className={styles.bcBar} aria-label="Fil d'Ariane">
          <ol className={styles.bc}>
            <li>
              <a href="/">Accueil</a>
            </li>
            {breadcrumb.map((item) => (
              <li key={`${item.href}-${item.label}`}>
                <a href={item.href}>{item.label}</a>
              </li>
            ))}
            <li>{title}</li>
          </ol>
        </nav>
      ) : null}

      <div className={styles.hero}>
        <div className={styles.gal}>
          {mainImage ? (
            <div className={styles.galMain}>
              <RemoteProductImage src={mainImage} alt={title} width={820} height={620} priority />
            </div>
          ) : null}
          {safeImages.length > 1 ? (
            <div className={styles.galThumbs}>
              {safeImages.slice(0, 5).map((img, idx) => (
                <button
                  key={`${img}-${idx}`}
                  type="button"
                  className={`${styles.galThumb} ${idx === selectedImage ? styles.galThumbOn : ""}`}
                  onClick={() => setSelectedImage(idx)}
                  aria-label={`Image ${idx + 1}`}
                >
                  <RemoteProductImage src={img} alt={`${title} ${idx + 1}`} width={160} height={160} />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className={styles.info}>
          <div className={styles.infoTop}>
            <div className={styles.badge}>
              <span className={styles.badgeStar}>★</span> TEST & AVIS
            </div>
            <h1 className={styles.productTitle}>{title}</h1>
            {(trustSignals?.authorName || trustSignals?.updatedAt) && (
              <p className={styles.productMeta}>
                {trustSignals?.authorName ? `Par ${trustSignals.authorName}` : null}
                {trustSignals?.authorRole ? `, ${trustSignals.authorRole}` : null}
                {trustSignals?.updatedAt ? ` · Mis a jour le ${trustSignals.updatedAt}` : null}
              </p>
            )}
            {description ? <p className={styles.productLead}>{description}</p> : null}
          </div>

          <div className={styles.decision}>
            {price != null ? (
              <div className={styles.priceBlock}>
                <div className={styles.pscPrice}>{formatPrice(price, displayCurrency)}</div>
                <div className={styles.priceMeta}>
                  Prix constate
                  {priceCheckedAt ? ` · verifie le ${priceCheckedAt}` : ""}
                </div>
              </div>
            ) : null}

            {displayRating != null ? (
              <div className={styles.pscScore}>
                <div className={styles.pscScoreLbl}>Note globale</div>
                <div className={styles.pscScoreVal}>
                  {displayRating.toFixed(1)}
                  <em>/10</em>
                </div>
              </div>
            ) : null}

            {criteria.length > 0 ? (
              <div className={styles.critGrid}>
                {criteria.map((item) => {
                  const outOf = item.outOf ?? 10;
                  const tone = getScoreTone(item.score, outOf);
                  return (
                    <div key={item.label} className={styles.critCard}>
                      <div className={styles.critTop}>
                        <span className={styles.critLbl}>{item.label}</span>
                        <span className={styles.critScore}>
                          {item.score.toFixed(1)}
                          <em>/{outOf}</em>
                        </span>
                      </div>
                      <div className={styles.critTrack}>
                        <div
                          className={`${styles.critFill} ${
                            tone === "good" ? styles.critFillGood : tone === "warn" ? styles.critFillWarn : styles.critFillBad
                          }`}
                          style={{ width: `${clampPercent(item.score, outOf)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null}

            <div className={styles.pscCta}>
              <a
                href={ctaHref}
                rel="nofollow sponsored"
                target="_blank"
                referrerPolicy="no-referrer-when-downgrade"
                className={styles.btn}
              >
                {ctaLabel} <span>→</span>
              </a>
            </div>
          </div>

          <p className={styles.disclaimer}>{disclaimer}</p>
        </div>
      </div>

      <div className={styles.stack}>
        {shortReview ? (
          <section className={styles.avis}>
            <div className={styles.avisLbl}>Notre avis en 30 secondes</div>
            <p className={styles.avisText}>{shortReview}</p>
          </section>
        ) : null}

        {prosCons && (prosCons.pros.length > 0 || prosCons.cons.length > 0) ? (
          <section className={styles.pcGrid}>
            {prosCons.pros.length > 0 ? (
              <article className={`${styles.pc} ${styles.pcGood}`}>
                <h2 className={styles.pcHd}>
                  <span className={`${styles.pcIcon} ${styles.pcIconGood}`} aria-hidden="true">
                    <svg viewBox="0 0 16 16" focusable="false">
                      <path d="M6.4 11.2 3.3 8.1l-1.1 1.1 4.2 4.2L13.8 6l-1.1-1.1z" fill="currentColor" />
                    </svg>
                  </span>
                  Points forts
                </h2>
                <ul className={styles.pcList}>
                  {prosCons.pros.map((item, idx) => {
                    const split = splitProsConsItem(item);
                    return (
                      <li key={`pro-${idx}-${item}`} className={styles.pcItem}>
                        <span className={`${styles.pcBullet} ${styles.pcBulletGood}`} aria-hidden="true">
                          <svg viewBox="0 0 16 16" focusable="false">
                            <path d="M6.4 11.2 3.3 8.1l-1.1 1.1 4.2 4.2L13.8 6l-1.1-1.1z" fill="currentColor" />
                          </svg>
                        </span>
                        <span>
                          <strong>{split.lead}</strong>
                          {split.rest ? `${split.separator}${split.rest}` : ""}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </article>
            ) : null}
            {prosCons.cons.length > 0 ? (
              <article className={`${styles.pc} ${styles.pcBad}`}>
                <h2 className={styles.pcHd}>
                  <span className={`${styles.pcIcon} ${styles.pcIconBad}`} aria-hidden="true">
                    <svg viewBox="0 0 16 16" focusable="false">
                      <path
                        d="M4.2 3.1 3.1 4.2 6.9 8l-3.8 3.8 1.1 1.1L8 9.1l3.8 3.8 1.1-1.1L9.1 8l3.8-3.8-1.1-1.1L8 6.9z"
                        fill="currentColor"
                      />
                    </svg>
                  </span>
                  Points faibles
                </h2>
                <ul className={styles.pcList}>
                  {prosCons.cons.map((item, idx) => {
                    const split = splitProsConsItem(item);
                    return (
                      <li key={`con-${idx}-${item}`} className={styles.pcItem}>
                        <span className={`${styles.pcBullet} ${styles.pcBulletBad}`} aria-hidden="true">
                          <svg viewBox="0 0 16 16" focusable="false">
                            <path
                              d="M4.2 3.1 3.1 4.2 6.9 8l-3.8 3.8 1.1 1.1L8 9.1l3.8 3.8 1.1-1.1L9.1 8l3.8-3.8-1.1-1.1L8 6.9z"
                              fill="currentColor"
                            />
                          </svg>
                        </span>
                        <span>
                          <strong>{split.lead}</strong>
                          {split.rest ? `${split.separator}${split.rest}` : ""}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </article>
            ) : null}
          </section>
        ) : null}

        {richContentHtml ? <section className={styles.ed} dangerouslySetInnerHTML={{ __html: richContentHtml }} /> : null}

        {specs.length > 0 ? (
          <section className={styles.specWrap}>
            <h2 className={styles.specTitle}>Fiche produit</h2>
            <div className={styles.specGrid}>
              {specs.map((group) => (
                <article key={group.title} className={styles.specCard}>
                  <h3 className={styles.specHd}>{group.title}</h3>
                  {group.items.map((item) => (
                    <div key={`${group.title}-${item.label}`} className={styles.specRow}>
                      <span className={styles.specLbl}>{item.label}</span>
                      <span className={styles.specVal}>{item.value}</span>
                    </div>
                  ))}
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {verdict ? (
          <section className={styles.verdict}>
            <div className={styles.verdictEy}>Note finale</div>
            <div className={styles.verdictSc}>
              {verdict.score}
              <em>/{verdict.outOf ?? 10}</em>
            </div>
            {verdict.text ? <p className={styles.verdictTxt}>{verdict.text}</p> : null}
            <div className={styles.verdictCta}>
              <a
                href={ctaHref}
                rel="nofollow sponsored"
                target="_blank"
                referrerPolicy="no-referrer-when-downgrade"
                className={styles.btn}
              >
                {ctaLabel} <span>→</span>
              </a>
            </div>
          </section>
        ) : null}

        {profileCards.length > 0 ? (
          <section className={styles.profileSection}>
            <h2 className={styles.profileTitle}>Pour qui ce produit est le plus adapte</h2>
            <div className={styles.profileGrid}>
              {profileCards.map((item, idx) => (
                <article key={`${item.label}-${idx}`} className={styles.profileCard}>
                  <div className={styles.profileTop}>
                    <span className={styles.profileIcon}>{item.icon ?? "🧠"}</span>
                    <span className={styles.profileLabel}>{item.label}</span>
                  </div>
                  {item.description ? <p className={styles.profileText}>{item.description}</p> : null}
                  <span
                    className={`${styles.profileBadge} ${
                      item.relevance === "excellent"
                        ? styles.profileBadgeExcellent
                        : item.relevance === "maybe"
                          ? styles.profileBadgeMaybe
                          : styles.profileBadgeGood
                    }`}
                  >
                    {item.relevance === "excellent"
                      ? "Excellent choix"
                      : item.relevance === "maybe"
                        ? "Choix limite"
                        : "Bon choix"}
                  </span>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {faq.length > 0 ? (
          <section className={styles.faq}>
            <h2 className={styles.faqTitle}>{faqTitle}</h2>
            {faq.map((item, idx) => {
              const open = openFaq === idx;
              return (
                <article key={`${item.question}-${idx}`} className={`${styles.faqItem} ${open ? styles.faqItemOpen : ""}`}>
                  <button type="button" className={styles.faqQ} onClick={() => setOpenFaq(open ? null : idx)}>
                    <span>{item.question}</span>
                    <span className={`${styles.faqChev} ${open ? styles.faqChevOpen : ""}`} aria-hidden="true">
                      ▾
                    </span>
                  </button>
                  {open ? <div className={styles.faqA}>{item.answer}</div> : null}
                </article>
              );
            })}
          </section>
        ) : null}
      </div>

      <div className={styles.mobileCtaWrap}>
        <a
          href={ctaHref}
          rel="nofollow sponsored"
          target="_blank"
          referrerPolicy="no-referrer-when-downgrade"
          className={styles.mobileCta}
        >
          {ctaLabel} <span>→</span>
        </a>
      </div>
      <div className={styles.mobileSpacer} />
    </article>
  );
}
