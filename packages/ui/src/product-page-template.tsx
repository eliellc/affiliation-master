"use client";

import { useMemo, useState } from "react";
import { RemoteProductImage } from "./remote-product-image";
import styles from "./product-page-template.module.css";

type BreadcrumbItem = { label: string; href: string };
type Criterion = { label: string; score: number; outOf?: number };
type ProsCons = { pros: string[]; cons: string[] };
type SpecGroup = { title: string; items: Array<{ label: string; value: string }> };
type VerdictAudience = { label: string; recommended: boolean };
type Verdict = { score: number; outOf?: number; text?: string; audiences?: VerdictAudience[] };
type FaqItem = { question: string; answer: string };

export type ProductPageTemplateProps = {
  title: string;
  brand?: string | null;
  description?: string | null;
  price?: number | null;
  currency?: string | null;
  rating?: number | null;
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

export function ProductPageTemplate(props: ProductPageTemplateProps) {
  const {
    title,
    brand,
    description,
    price,
    currency,
    rating,
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
    faqTitle = "FAQ",
    disclaimer = "",
  } = props;

  const safeImages = useMemo(() => images.filter(Boolean), [images]);
  const [selectedImage, setSelectedImage] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const mainImage = safeImages[selectedImage] ?? safeImages[0] ?? "";
  const displayCurrency = currency || "EUR";

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
          {safeImages.length > 1 ? <p className={styles.galCaption}>Retrouvez plus de photos chez le marchand</p> : null}
        </div>

        <div className={styles.info}>
          <div>
            <div className={styles.badge}>
              <span className={styles.badgeStar}>★</span> TEST & AVIS
            </div>
            <h1 className={styles.productTitle}>{title}</h1>
            {brand ? (
              <p className={styles.productBrand}>
                Par <strong>{brand}</strong>
              </p>
            ) : null}
          </div>

          <div className={styles.psc}>
            {price != null ? <div className={styles.pscPrice}>{formatPrice(price, displayCurrency)}</div> : null}
            {price != null && rating != null ? <div className={styles.pscSep} /> : null}
            {rating != null ? (
              <div className={styles.pscScore}>
                <div className={styles.pscScoreLbl}>Note globale</div>
                <div className={styles.pscScoreVal}>{rating.toFixed(1)}</div>
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

          {criteria.length > 0 ? (
            <div className={styles.critGrid}>
              {criteria.map((item) => {
                const outOf = item.outOf ?? 10;
                return (
                  <div key={item.label} className={styles.critCard}>
                    <div className={styles.critTop}>
                      <span className={styles.critLbl}>{item.label}</span>
                      <span className={styles.critScore}>
                        {item.score}
                        <em>/{outOf}</em>
                      </span>
                    </div>
                    <div className={styles.critTrack}>
                      <div className={styles.critFill} style={{ width: `${clampPercent(item.score, outOf)}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}

          {description ? <p>{description}</p> : null}
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
              <article className={styles.pc}>
                <h2 className={styles.pcHd}>Points forts</h2>
                <ul className={styles.pcList}>
                  {prosCons.pros.map((item, idx) => (
                    <li key={`pro-${idx}-${item}`} className={styles.pcItem}>
                      {item}
                    </li>
                  ))}
                </ul>
              </article>
            ) : null}
            {prosCons.cons.length > 0 ? (
              <article className={styles.pc}>
                <h2 className={styles.pcHd}>Points faibles</h2>
                <ul className={styles.pcList}>
                  {prosCons.cons.map((item, idx) => (
                    <li key={`con-${idx}-${item}`} className={styles.pcItem}>
                      {item}
                    </li>
                  ))}
                </ul>
              </article>
            ) : null}
          </section>
        ) : null}

        {richContentHtml ? <section className={styles.ed} dangerouslySetInnerHTML={{ __html: richContentHtml }} /> : null}

        {specs.length > 0 ? (
          <section className={styles.specGrid}>
            {specs.map((group) => (
              <article key={group.title} className={styles.specCard}>
                <h2 className={styles.specHd}>{group.title}</h2>
                {group.items.map((item) => (
                  <div key={`${group.title}-${item.label}`} className={styles.specRow}>
                    <span className={styles.specLbl}>{item.label}</span>
                    <span className={styles.specVal}>{item.value}</span>
                  </div>
                ))}
              </article>
            ))}
          </section>
        ) : null}

        {verdict ? (
          <section className={styles.verdict}>
            <div className={styles.verdictEy}>Notre verdict</div>
            <div className={styles.verdictSc}>
              {verdict.score}
              <em>/{verdict.outOf ?? 10}</em>
            </div>
            {verdict.text ? <p className={styles.verdictTxt}>{verdict.text}</p> : null}
            {verdict.audiences && verdict.audiences.length > 0 ? (
              <div className={styles.vpList}>
                {verdict.audiences.map((item, idx) => (
                  <div key={`${item.label}-${idx}`} className={`${styles.vp} ${item.recommended ? styles.vpEx : styles.vpOk}`}>
                    {item.label}
                  </div>
                ))}
              </div>
            ) : null}
          </section>
        ) : null}

        {faq.length > 0 ? (
          <section className={styles.faq}>
            <h2 className={styles.faqTitle}>{faqTitle}</h2>
            {faq.map((item, idx) => {
              const open = openFaq === idx;
              return (
                <article key={`${item.question}-${idx}`} className={styles.faqItem}>
                  <button type="button" className={styles.faqQ} onClick={() => setOpenFaq(open ? null : idx)}>
                    <span>{item.question}</span>
                    <span>{open ? "−" : "+"}</span>
                  </button>
                  {open ? <div className={styles.faqA}>{item.answer}</div> : null}
                </article>
              );
            })}
          </section>
        ) : null}
      </div>
    </article>
  );
}
