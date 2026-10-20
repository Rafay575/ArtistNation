import Image from 'next/image';
import Link from 'next/link';

export const metadata = {
  title: 'Terms of Use | ArtistNation',
  description: 'ArtistNation Terms of Use',
};

export default function TermsPage() {
  return (
    <>
      <style>{`
        :root {
          --bg: #090b10;
          --surface: #11141c;
          --surface-soft: #171b25;
          --text: #f5f7fb;
          --muted: #aeb6c5;
          --accent: #9b6cff;
          --accent-2: #41d9c7;
          --warning: #ffcf70;
          --border: rgba(255,255,255,.10);
          --shadow: 0 24px 70px rgba(0,0,0,.35);
          --radius: 22px;
          --max-width: 1160px;
        }

        * { box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        body {
          margin: 0;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          color: var(--text);
          background:
            radial-gradient(circle at 10% 0%, rgba(155,108,255,.17), transparent 34%),
            radial-gradient(circle at 90% 15%, rgba(65,217,199,.10), transparent 28%),
            var(--bg);
          line-height: 1.7;
        }

        a { color: #c7b0ff; text-decoration-thickness: 1px; text-underline-offset: 3px; }
        a:hover { color: #fff; }
        :focus-visible { outline: 3px solid var(--accent-2); outline-offset: 4px; border-radius: 4px; }

        .skip-link {
          position: absolute;
          left: 1rem;
          top: -100px;
          z-index: 1000;
          padding: .8rem 1rem;
          color: #08100f;
          background: var(--accent-2);
          border-radius: 10px;
          font-weight: 800;
        }
        .skip-link:focus { top: 1rem; }

        .site-header {
          position: sticky;
          top: 0;
          z-index: 50;
          backdrop-filter: blur(16px);
          background: rgba(9,11,16,.82);
          border-bottom: 1px solid var(--border);
        }

        .nav-wrap {
          width: min(calc(100% - 2rem), var(--max-width));
          margin: auto;
          min-height: 72px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
        }

        .brand {
          display: inline-flex;
          align-items: center;
          gap: .75rem;
          color: var(--text);
          text-decoration: none;
          font-size: 1.08rem;
          font-weight: 850;
          letter-spacing: -.02em;
        }

        .brand-mark {
          display: grid;
          place-items: center;
          width: 38px;
          height: 38px;
          border-radius: 12px;
          background: linear-gradient(135deg, var(--accent), var(--accent-2));
          color: #080a0e;
          box-shadow: 0 10px 30px rgba(155,108,255,.25);
          font-weight: 950;
          overflow: hidden;
        }

        .back-link {
          display: inline-flex;
          align-items: center;
          gap: .45rem;
          padding: .7rem .95rem;
          border: 1px solid var(--border);
          border-radius: 999px;
          color: var(--text);
          text-decoration: none;
          font-size: .92rem;
          font-weight: 700;
        }
        .back-link:hover { background: var(--surface-soft); }

        .hero {
          width: min(calc(100% - 2rem), var(--max-width));
          margin: 0 auto;
          padding: 5.5rem 0 3rem;
        }

        .eyebrow {
          display: inline-flex;
          align-items: center;
          gap: .55rem;
          padding: .45rem .75rem;
          border: 1px solid rgba(155,108,255,.35);
          border-radius: 999px;
          color: #d8c9ff;
          background: rgba(155,108,255,.08);
          font-size: .8rem;
          font-weight: 800;
          letter-spacing: .12em;
          text-transform: uppercase;
        }

        h1 {
          max-width: 820px;
          margin: 1.35rem 0 1rem;
          font-size: clamp(2.5rem, 7vw, 5rem);
          line-height: 1.02;
          letter-spacing: -.055em;
        }

        .hero-copy {
          max-width: 790px;
          color: var(--muted);
          font-size: clamp(1.05rem, 2vw, 1.25rem);
        }

        .meta-row {
          display: flex;
          flex-wrap: wrap;
          gap: .7rem;
          margin-top: 1.6rem;
        }

        .meta-chip {
          padding: .6rem .8rem;
          border: 1px solid var(--border);
          border-radius: 12px;
          background: rgba(255,255,255,.035);
          color: #dbe0ea;
          font-size: .9rem;
        }

        .layout {
          width: min(calc(100% - 2rem), var(--max-width));
          margin: 0 auto 5rem;
          display: grid;
          grid-template-columns: 260px minmax(0, 1fr);
          gap: 2rem;
          align-items: start;
        }

        .toc {
          position: sticky;
          top: 96px;
          max-height: calc(100vh - 120px);
          overflow: auto;
          padding: 1.25rem;
          border: 1px solid var(--border);
          border-radius: var(--radius);
          background: rgba(17,20,28,.82);
          box-shadow: var(--shadow);
        }

        .toc h2 { margin: 0 0 .8rem; font-size: .95rem; }
        .toc ol { margin: 0; padding-left: 1.15rem; }
        .toc li { margin: .42rem 0; color: var(--muted); font-size: .88rem; }
        .toc a { color: inherit; text-decoration: none; }
        .toc a:hover { color: var(--text); }

        .policy {
          padding: clamp(1.35rem, 4vw, 3.2rem);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          background: linear-gradient(180deg, rgba(22,26,36,.96), rgba(14,17,24,.98));
          box-shadow: var(--shadow);
        }

        .notice {
          margin-bottom: 2.4rem;
          padding: 1.1rem 1.2rem;
          border-left: 4px solid var(--accent-2);
          border-radius: 0 14px 14px 0;
          background: rgba(65,217,199,.07);
          color: #d9f8f3;
        }

        .legal-note {
          margin: 1rem 0 2rem;
          padding: 1rem 1.15rem;
          border: 1px solid rgba(255,207,112,.26);
          border-radius: 14px;
          background: rgba(255,207,112,.07);
          color: #ffe9b8;
          font-size: .94rem;
        }

        section { scroll-margin-top: 105px; }
        section + section {
          margin-top: 2.7rem;
          padding-top: 2.5rem;
          border-top: 1px solid var(--border);
        }

        h2 {
          margin: 0 0 .9rem;
          font-size: clamp(1.45rem, 3vw, 2rem);
          letter-spacing: -.025em;
        }

        h3 { margin: 1.5rem 0 .4rem; font-size: 1.05rem; }
        p { margin: .8rem 0; color: #d4d9e3; }
        ul { padding-left: 1.25rem; }
        li { margin: .55rem 0; color: #d4d9e3; }
        strong { color: var(--text); }

        .card-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 1rem;
          margin-top: 1.15rem;
        }

        .info-card {
          padding: 1.1rem;
          border: 1px solid var(--border);
          border-radius: 16px;
          background: rgba(255,255,255,.025);
        }
        .info-card h3 { margin-top: 0; }
        .info-card p { margin-bottom: 0; font-size: .94rem; color: var(--muted); }

        .highlight-box {
          margin-top: 1rem;
          padding: 1.15rem;
          border: 1px solid rgba(155,108,255,.28);
          border-radius: 16px;
          background: rgba(155,108,255,.06);
        }

        .contact-card {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 1.5rem;
          align-items: center;
          margin-top: 1rem;
          padding: 1.3rem;
          border: 1px solid var(--border);
          border-radius: 18px;
          background: rgba(255,255,255,.03);
        }

        .contact-card address { font-style: normal; color: var(--muted); }
        .contact-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 46px;
          padding: .75rem 1rem;
          border-radius: 12px;
          color: #080a0e;
          background: linear-gradient(135deg, var(--accent-2), #8af0e4);
          text-decoration: none;
          font-weight: 850;
          white-space: nowrap;
        }

        footer {
          width: min(calc(100% - 2rem), var(--max-width));
          margin: 0 auto;
          padding: 0 0 3rem;
          color: var(--muted);
          font-size: .9rem;
          text-align: center;
        }

        @media (max-width: 860px) {
          .layout { grid-template-columns: 1fr; }
          .toc { position: static; max-height: none; }
          .card-grid { grid-template-columns: 1fr; }
          .contact-card { grid-template-columns: 1fr; }
          .hero { padding-top: 4rem; }
        }

        @media (max-width: 560px) {
          .back-link span { display: none; }
          .policy { padding: 1.2rem; }
          h1 { font-size: 2.65rem; }
        }

        @media print {
          body { background: #fff; color: #111; }
          .site-header, .toc, .back-link, .contact-button { display: none !important; }
          .hero, .layout, footer { width: 100%; margin: 0; }
          .hero { padding: 1rem 0; }
          .layout { display: block; }
          .policy { border: 0; box-shadow: none; background: #fff; padding: 0; }
          h1, h2, h3, strong { color: #111; }
          p, li, .hero-copy, .meta-chip, footer { color: #333; }
          section { break-inside: avoid; }
        }
      `}</style>

      <a className="skip-link" href="#main-content">Skip to main content</a>

      <header className="site-header" aria-label="Primary header">
        <div className="nav-wrap">
          {/* Logo */}
         <Link href="/" className="brand" aria-label="ArtistNation home">
            
              <Image
                src="/favicon.png"        // replace with your logo file
                alt="ArtistNation"
                width={75}
                height={75}
                priority
                unoptimized
              />
           
          </Link>
          <Link href="/" className="back-link" aria-label="Return to ArtistNation home">
            ← <span>Back to ArtistNation</span>
          </Link>
        </div>
      </header>

      <main id="main-content">
        <div className="hero">
          <span className="eyebrow">Platform Agreement</span>
          <h1>Terms of Use</h1>
          <p className="hero-copy">
            These Terms of Use explain the rules that apply when artists, labels, managers, fans, collaborators, and other users access or use ArtistNation websites, subscriptions, artist pages, content tools, commerce features, and related services.
          </p>
          <div className="meta-row" aria-label="Document details">
            <span className="meta-chip"><strong>Effective:</strong> August 3, 2026</span>
            <span className="meta-chip"><strong>Updated:</strong> August 3, 2026</span>
            <span className="meta-chip"><strong>Applies to:</strong> ArtistNation Platform and Services</span>
          </div>
        </div>

        <div className="layout">
          <aside className="toc" aria-label="Terms of Use table of contents">
            <h2>On this page</h2>
            <ol>
              <li><a href="#acceptance">Acceptance of Terms</a></li>
              <li><a href="#eligibility">Eligibility and Accounts</a></li>
              <li><a href="#services">Platform Services</a></li>
              <li><a href="#subscriptions">Subscriptions and Billing</a></li>
              <li><a href="#content">Your Content and Rights</a></li>
              <li><a href="#licenses">Licenses You Grant</a></li>
              <li><a href="#conduct">Acceptable Use</a></li>
              <li><a href="#music-rights">Music and Intellectual Property</a></li>
              <li><a href="#commerce">Merchandise and Transactions</a></li>
              <li><a href="#third-party">Third-Party Services</a></li>
              <li><a href="#privacy">Privacy</a></li>
              <li><a href="#availability">Availability and Changes</a></li>
              <li><a href="#termination">Suspension and Termination</a></li>
              <li><a href="#disclaimers">Disclaimers</a></li>
              <li><a href="#liability">Limitation of Liability</a></li>
              <li><a href="#indemnity">Indemnification</a></li>
              <li><a href="#disputes">Disputes and Governing Law</a></li>
              <li><a href="#changes">Changes to These Terms</a></li>
              <li><a href="#contact">Contact Us</a></li>
            </ol>
          </aside>

          <article className="policy" aria-labelledby="terms-title">
            <div className="notice">
              <strong>Please read these Terms carefully.</strong> By creating an account, purchasing a subscription, publishing an artist page, uploading content, or otherwise using ArtistNation, you agree to be bound by these Terms and any policies incorporated by reference.
            </div>

            <div className="legal-note">
              This template is provided for general business planning and should be reviewed by qualified legal counsel before launch. Replace all bracketed placeholders and align the document with ArtistNation’s actual billing, copyright, moderation, dispute-resolution, and data practices.
            </div>

            <section id="acceptance">
              <h2>1. Acceptance of Terms</h2>
              <p>
                These Terms of Use (the “Terms”) form a legally binding agreement between you and <strong>ArtistNation [legal entity name]</strong> (“ArtistNation,” “we,” “us,” or “our”). They govern your access to and use of ArtistNation’s websites, applications, artist pages, content-management tools, subscription features, analytics, event tools, music catalog features, merchandise integrations, and related products or services (collectively, the “Services”).
              </p>
              <p>
                If you use the Services on behalf of a company, record label, management firm, band, or other organization, you represent that you have authority to bind that organization to these Terms. In that case, “you” includes both you and the organization.
              </p>
            </section>

            <section id="eligibility">
              <h2>2. Eligibility and Accounts</h2>
              <div className="card-grid">
                <div className="info-card">
                  <h3>Minimum age</h3>
                  <p>You must be at least 18 years old, or the age of legal majority where you live, unless a parent or legal guardian authorizes and supervises your use.</p>
                </div>
                <div className="info-card">
                  <h3>Accurate information</h3>
                  <p>You agree to provide complete, current, and accurate account, billing, and profile information and to keep it updated.</p>
                </div>
                <div className="info-card">
                  <h3>Account security</h3>
                  <p>You are responsible for protecting your password, authentication credentials, and account access and for activity performed through your account.</p>
                </div>
                <div className="info-card">
                  <h3>Authorized users</h3>
                  <p>Team members, managers, and collaborators may only access an account with the account owner’s permission and must follow these Terms.</p>
                </div>
              </div>
              <p>
                Notify us promptly at <a href="mailto:support@artistnation.studio">support@artistnation.studio</a> if you suspect unauthorized use, a security incident, or loss of account credentials.
              </p>
            </section>

            <section id="services">
              <h2>3. ArtistNation Platform Services</h2>
              <p>Depending on your plan and availability, ArtistNation may allow you to:</p>
              <ul>
                <li>Create, customize, host, and publish artist or label websites.</li>
                <li>Upload music, videos, photographs, biographies, news, event details, and promotional materials.</li>
                <li>Manage fan sign-ups, contact forms, mailing-list integrations, and audience engagement.</li>
                <li>Display music catalogs, events, tour dates, merchandise, and external streaming or social links.</li>
                <li>Access dashboards, analytics, content-management tools, and administrative features.</li>
                <li>Connect third-party payment, commerce, media, analytics, email, or social services.</li>
              </ul>
              <p>
                Features may vary by plan, location, device, integration, or release stage. We may add, modify, limit, or discontinue features as described in these Terms.
              </p>
            </section>

            <section id="subscriptions">
              <h2>4. Subscriptions, Trials, Billing, and Taxes</h2>
              <h3>Plans and recurring charges</h3>
              <p>
                Paid plans may renew automatically on a monthly or annual basis until canceled. By starting a paid subscription, you authorize ArtistNation and its payment processor to charge the payment method on file for subscription fees, applicable taxes, usage charges, add-ons, and other disclosed amounts.
              </p>
              <h3>Trials and promotions</h3>
              <p>
                Free trials and promotional offers may be limited to new or eligible users. Unless canceled before the stated trial period ends, a trial may convert to a paid subscription at the price disclosed during sign-up.
              </p>
              <h3>Cancellations and refunds</h3>
              <p>
                You may cancel through your account settings or by contacting support. Cancellation generally prevents future renewal but does not automatically refund amounts already paid. Except where required by law or expressly stated in a written refund policy, subscription fees are non-refundable.
              </p>
              <h3>Price changes</h3>
              <p>
                We may change pricing, plan features, or billing terms. When required, we will provide advance notice before a change applies to your next renewal period.
              </p>
            </section>

            <section id="content">
              <h2>5. Your Content and Ownership</h2>
              <p>
                “User Content” includes music, sound recordings, compositions, lyrics, artwork, photographs, video, logos, biographies, trademarks, events, product information, comments, messages, and other materials you upload, submit, publish, transmit, or make available through the Services.
              </p>
              <p>
                As between you and ArtistNation, you retain ownership of your User Content. You are solely responsible for the content you provide and for obtaining all permissions, licenses, releases, consents, and clearances needed to use, reproduce, distribute, publicly display, publicly perform, stream, promote, or monetize that content.
              </p>
              <div className="highlight-box">
                <strong>You represent and warrant that:</strong>
                <ul>
                  <li>You own your User Content or have sufficient rights to use it through ArtistNation.</li>
                  <li>Your content does not infringe copyrights, trademarks, publicity rights, privacy rights, contractual rights, or other rights.</li>
                  <li>Your uploads do not violate label, distributor, publisher, producer, collaborator, union, sample-clearance, or licensing agreements.</li>
                  <li>Any people shown or heard in your content have provided any required permission or release.</li>
                </ul>
              </div>
            </section>

            <section id="licenses">
              <h2>6. Licenses You Grant to ArtistNation</h2>
              <p>
                You grant ArtistNation a worldwide, non-exclusive, royalty-free, sublicensable, and transferable license to host, store, reproduce, format, adapt for technical purposes, transmit, display, perform, and distribute your User Content solely as reasonably necessary to operate, secure, improve, promote, and provide the Services according to your settings and instructions.
              </p>
              <p>
                This license continues while your content remains on the Services and for a reasonable period afterward for backups, legal compliance, dispute resolution, fraud prevention, and system integrity. ArtistNation does not claim ownership of your music, brand, or creative works merely because you use the Services.
              </p>
              <p>
                You also grant us permission to use your account name, artist name, logo, and public-facing page screenshots to identify you as a customer or demonstrate the Services, unless you opt out by contacting us.
              </p>
            </section>

            <section id="conduct">
              <h2>7. Acceptable Use</h2>
              <p>You may not use the Services to:</p>
              <ul>
                <li>Upload, distribute, or promote unlawful, infringing, fraudulent, deceptive, defamatory, threatening, exploitative, or abusive content.</li>
                <li>Impersonate another person or organization or misrepresent your identity, affiliation, rights, popularity, streams, sales, or engagement.</li>
                <li>Distribute malware, malicious code, spam, phishing messages, unauthorized advertisements, or harmful files.</li>
                <li>Scrape, harvest, crawl, probe, reverse engineer, bypass, disable, overload, or interfere with the Services or security controls.</li>
                <li>Attempt unauthorized access to accounts, systems, data, payment information, or administrative functions.</li>
                <li>Manipulate analytics, fan sign-ups, traffic, reviews, plays, purchases, or platform metrics through bots or deceptive methods.</li>
                <li>Use the Services to violate export controls, sanctions, anti-money-laundering rules, consumer-protection laws, or other applicable laws.</li>
                <li>Resell, sublicense, rent, or provide access to the Services except through an authorized ArtistNation plan or written agreement.</li>
              </ul>
              <p>
                We may investigate suspected violations and may remove content, limit features, preserve evidence, cooperate with lawful requests, or suspend access when reasonably necessary.
              </p>
            </section>

            <section id="music-rights">
              <h2>8. Music Rights, Copyright, and Takedowns</h2>
              <p>
                ArtistNation is a technology platform and does not automatically obtain or administer music publishing, master recording, synchronization, mechanical, public-performance, neighboring, sample, or merchandise rights on your behalf.
              </p>
              <p>
                You are responsible for securing all rights needed for your use of music and related content. If you believe content on ArtistNation infringes your copyright or other intellectual-property rights, submit a written notice to <a href="mailto:legal@artistnation.studio">legal@artistnation.studio</a> containing sufficient information to identify the work, the allegedly infringing material, your contact information, a good-faith statement, and a statement made under penalty of perjury that the notice is accurate and authorized.
              </p>
              <p>
                We may remove or disable access to allegedly infringing material and may terminate repeat infringers where appropriate. A formal copyright agent name and mailing address should be inserted here before public launch if ArtistNation relies on applicable safe-harbor procedures.
              </p>
            </section>

            <section id="commerce">
              <h2>9. Merchandise, Sales, and Fan Transactions</h2>
              <p>
                Artist pages may display merchandise, tickets, subscriptions, donations, or other offers. Unless ArtistNation expressly states that it is the seller of record, transactions may be processed by the artist, label, merchant, payment processor, ticketing provider, or another third party.
              </p>
              <p>
                Artists and merchants are responsible for product descriptions, pricing, inventory, fulfillment, shipping, taxes, refunds, returns, warranties, customer service, and legal compliance related to their offers. ArtistNation is not responsible for disputes between artists, merchants, fans, vendors, or payment providers unless required by law or a separate written agreement.
              </p>
            </section>

            <section id="third-party">
              <h2>10. Third-Party Services and Links</h2>
              <p>
                The Services may connect to streaming platforms, social networks, payment processors, commerce providers, analytics services, email services, hosting providers, ticketing platforms, or other third parties. Your use of third-party services is governed by their own terms and privacy policies.
              </p>
              <p>
                ArtistNation does not control and is not responsible for third-party content, availability, security, transactions, policies, or practices. We may modify or discontinue integrations if a third party changes or withdraws access.
              </p>
            </section>

            <section id="privacy">
              <h2>11. Privacy</h2>
              <p>
                Our collection, use, sharing, and protection of personal information are described in the{' '}
                <Link href="/privacy">ArtistNation Privacy Policy</Link>, which is incorporated into these Terms by reference. By using the Services, you acknowledge that you have reviewed the Privacy Policy.
              </p>
              <p>
                Artists who collect fan information through ArtistNation may have independent privacy obligations. You are responsible for providing any notices, obtaining any consents, honoring opt-outs, and complying with laws that apply to your use of fan or customer data.
              </p>
            </section>

            <section id="availability">
              <h2>12. Service Availability, Updates, and Beta Features</h2>
              <p>
                We strive to keep ArtistNation reliable, but the Services may experience maintenance, outages, errors, capacity limits, security events, or third-party disruptions. We do not guarantee uninterrupted or error-free operation.
              </p>
              <p>
                Beta, preview, early-access, or experimental features may be incomplete, change without notice, and contain defects. You use those features at your own risk and should maintain independent backups of important content and business records.
              </p>
              <p>
                We may update, replace, limit, or discontinue any part of the Services. When practical, we will provide notice of material changes that significantly affect paid users.
              </p>
            </section>

            <section id="termination">
              <h2>13. Suspension, Cancellation, and Termination</h2>
              <p>
                You may stop using the Services at any time. We may suspend, restrict, or terminate access if you violate these Terms, fail to pay amounts due, create security or legal risk, engage in fraudulent or abusive conduct, or if continued service is no longer commercially or technically feasible.
              </p>
              <p>
                Upon termination, your right to access the Services ends. You should export or download your content before cancellation. We may delete or anonymize content and account data after a reasonable retention period, subject to legal, security, backup, dispute, and compliance needs.
              </p>
              <p>
                Provisions that by their nature should survive termination—including ownership, licenses already granted, payment obligations, disclaimers, limitations of liability, indemnification, and dispute terms—will survive.
              </p>
            </section>

            <section id="disclaimers">
              <h2>14. Disclaimers</h2>
              <p>
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, THE SERVICES ARE PROVIDED “AS IS” AND “AS AVAILABLE.” ARTISTNATION DISCLAIMS ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, NON-INFRINGEMENT, AVAILABILITY, ACCURACY, SECURITY, AND QUIET ENJOYMENT.
              </p>
              <p>
                ARTISTNATION DOES NOT GUARANTEE THAT USING THE SERVICES WILL RESULT IN FAN GROWTH, STREAMS, SALES, BOOKINGS, REVENUE, LABEL INTEREST, CAREER OPPORTUNITIES, OR ANY PARTICULAR BUSINESS OR CREATIVE OUTCOME.
              </p>
            </section>

            <section id="liability">
              <h2>15. Limitation of Liability</h2>
              <p>
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, ARTISTNATION AND ITS OWNERS, AFFILIATES, OFFICERS, EMPLOYEES, CONTRACTORS, LICENSORS, AND SERVICE PROVIDERS WILL NOT BE LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, EXEMPLARY, OR PUNITIVE DAMAGES, OR FOR LOSS OF PROFITS, REVENUE, DATA, GOODWILL, AUDIENCE, OPPORTUNITY, OR BUSINESS INTERRUPTION.
              </p>
              <p>
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, ARTISTNATION’S TOTAL LIABILITY ARISING OUT OF OR RELATING TO THE SERVICES OR THESE TERMS WILL NOT EXCEED THE GREATER OF: (A) THE AMOUNT YOU PAID TO ARTISTNATION DURING THE 12 MONTHS BEFORE THE EVENT GIVING RISE TO THE CLAIM; OR (B) USD $100.
              </p>
              <p>
                Some jurisdictions do not allow certain exclusions or limitations. In those jurisdictions, the limitations apply only to the fullest extent permitted by law.
              </p>
            </section>

            <section id="indemnity">
              <h2>16. Indemnification</h2>
              <p>
                To the extent permitted by law, you agree to defend, indemnify, and hold harmless ArtistNation and its affiliates, owners, officers, employees, contractors, licensors, and service providers from claims, damages, liabilities, losses, judgments, costs, and expenses—including reasonable attorneys’ fees—arising from or related to:
              </p>
              <ul>
                <li>Your User Content, products, services, promotions, events, or transactions.</li>
                <li>Your use or misuse of the Services.</li>
                <li>Your violation of these Terms or applicable law.</li>
                <li>Your infringement or violation of another person’s rights.</li>
                <li>Disputes involving your collaborators, fans, customers, labels, publishers, vendors, or contractors.</li>
              </ul>
            </section>

            <section id="disputes">
              <h2>17. Governing Law and Dispute Resolution</h2>
              <p>
                These Terms are governed by the laws of the State of <strong>[Insert State]</strong>, without regard to conflict-of-law principles. Before filing a formal claim, you and ArtistNation agree to attempt in good faith to resolve the dispute by providing written notice and allowing at least 30 days for an informal response.
              </p>
              <p>
                Any arbitration provision, class-action waiver, venue requirement, small-claims procedure, or jury-trial waiver should be inserted only after review by qualified legal counsel and must comply with applicable consumer-protection law.
              </p>
            </section>

            <section id="changes">
              <h2>18. Changes to These Terms</h2>
              <p>
                We may update these Terms to reflect changes in the Services, law, security practices, billing, integrations, or business operations. We will post the revised Terms and update the “Effective” or “Updated” date above. For material changes, we may provide additional notice through email, the Services, or your account dashboard.
              </p>
              <p>
                Continued use of the Services after revised Terms become effective means you accept the updated Terms. If you do not agree, you must stop using the Services and cancel any active subscription.
              </p>
            </section>

            <section id="contact">
              <h2>19. Contact ArtistNation</h2>
              <p>Questions about these Terms, account obligations, billing, content rights, or legal notices may be directed to:</p>
              <div className="contact-card">
                <address>
                  <strong>ArtistNation [Legal Entity Name]</strong><br />
                  Attn: Legal and Terms Support<br />
                  [Street Address]<br />
                  [City, State ZIP, Country]<br />
                  Email: <a href="mailto:legal@artistnation.studio">legal@artistnation.studio</a><br />
                  Support: <a href="mailto:support@artistnation.studio">support@artistnation.studio</a>
                </address>
                <a className="contact-button" href="mailto:legal@artistnation.studio?subject=ArtistNation%20Terms%20of%20Use%20Question">Contact Legal</a>
              </div>
            </section>
          </article>
        </div>
      </main>

      <footer>
        <p>© 2026 ArtistNation. All rights reserved. This page is a general template and is not legal advice.</p>
      </footer>
    </>
  );
}