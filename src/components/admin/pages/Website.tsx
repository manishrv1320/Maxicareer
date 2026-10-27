import React, { useMemo, useState } from 'react';
import { Plus, Trash2, ArrowUp, ArrowDown, Upload, RotateCcw, Globe, Eye, EyeOff, ExternalLink, Image as ImageIcon, Link2, Instagram, Linkedin, Youtube, Facebook, Twitter, MessageCircle, Send, Mail, Phone, MapPin, Clock } from 'lucide-react';
import { useAdmin, AdminTab } from '../context';
import { PageHeader, Panel, Button, IconButton, Badge, Input, Textarea, Select, Field, Toggle, Segmented, Empty, SaveBar, cx } from '../ui';
import { formatDate, uid, useSharedValue, useDraft } from '../lib';
import { uploadFile, pickFile } from '../../../lib/api';
import { OFFICIAL_EMAIL, OFFICIAL_PHONE, OFFICIAL_PHONE_DIGITS, SECONDARY_EMAIL } from '../../../data/portalData';
import { DEFAULT_POLICIES, POLICY_KEYS, POLICY_PATH, type Policy, type PolicyKey, type PolicySection } from '../../../data/policies';
import { PolicyArticle } from '../../PolicyPage';

/* ------------------------------------------------------------------ */
/* Content model                                                       */
/* ------------------------------------------------------------------ */

interface LinkItem {
  id: string;
  label: string;
  href: string;
  visible: boolean;
}

interface WebsiteContent {
  home: {
    announcementOn: boolean;
    announcement: string;
    announcementHref: string;
    headline: string;
    subheadline: string;
    primaryLabel: string;
    primaryHref: string;
    secondaryLabel: string;
    secondaryHref: string;
    bannerUrl: string;
    trustPills: string;
  };
  navigation: {
    links: LinkItem[];
    buttonLabel: string;
    buttonHref: string;
    showEmail: boolean;
    showWhatsApp: boolean;
    sticky: boolean;
  };
  footer: {
    about: string;
    pillars: string;
    columns: { id: string; title: string; links: LinkItem[] }[];
    copyright: string;
    showPrivacy: boolean;
    showTerms: boolean;
    showAdminLink: boolean;
  };
  contact: {
    heading: string;
    intro: string;
    email: string;
    secondaryEmail: string;
    phone: string;
    whatsapp: string;
    address: string;
    hours: string;
    responseTime: string;
    mapUrl: string;
    topics: string;
    successMessage: string;
    autoReply: boolean;
  };
  ctas: {
    id: string;
    name: string;
    placement: string;
    heading: string;
    body: string;
    buttonLabel: string;
    buttonHref: string;
    style: 'navy' | 'blue' | 'light';
    active: boolean;
  }[];
  articles: {
    id: string;
    title: string;
    slug: string;
    category: string;
    excerpt: string;
    coverUrl: string;
    coverAlt: string;
    focal: 'center' | 'top' | 'bottom';
    overlay: boolean;
    status: 'Draft' | 'Published';
    publishedOn: string;
  }[];
  seo: {
    siteName: string;
    titleTemplate: string;
    defaultTitle: string;
    description: string;
    keywords: string;
    canonical: string;
    ogImage: string;
    twitter: string;
    indexable: boolean;
    sitemap: boolean;
    pages: { id: string; path: string; title: string; description: string; noindex: boolean }[];
  };
  social: { id: string; platform: string; url: string; visible: boolean; inFooter: boolean; inContact: boolean }[];
  /** Privacy policy, terms and refund policy pages. */
  policies: Record<PolicyKey, Policy>;
}

type SectionKey = keyof WebsiteContent;

const L = (label: string, href: string, visible = true): LinkItem => ({ id: uid('lnk'), label, href, visible });

const DEFAULT_CONTENT: WebsiteContent = {
  home: {
    announcementOn: false,
    announcement: 'Admissions open for the October cohort. Book a free 15-minute call.',
    announcementHref: '#contact',
    headline: 'Your Career Journey Starts with the Right Guidance.',
    subheadline: 'Maxicareer helps students and aspiring professionals build clarity, develop the right skills, and move confidently toward their career goals.',
    primaryLabel: 'Book consultation',
    primaryHref: '#contact',
    secondaryLabel: 'Explore services',
    secondaryHref: '#addon-services',
    bannerUrl: '/images/hero-illustration.svg',
    trustPills: '1:1 mentorship, Personalised roadmaps, Placement support',
  },
  navigation: {
    links: [L('Home', '#home'), L('Services', '#addon-services'), L('About', '#about'), L('Offerings', '#services'), L('Why Us', '#why-us'), L('Programs', '#career-programs', false), L('Contact', '#contact')],
    buttonLabel: 'Book Consultation',
    buttonHref: '#contact',
    showEmail: true,
    showWhatsApp: true,
    sticky: true,
  },
  footer: {
    about:
      'Your Career Journey Starts with the Right Guidance. Maxicareer helps students and aspiring professionals build clarity, master in-demand skills, and move confidently toward career fulfillment.',
    pillars: 'Guidance • Skills • Mentorship • Confidence',
    columns: [
      { id: 'col-1', title: 'Quick Navigation', links: [L('Home', '#home'), L('About', '#about'), L('Services', '#services'), L('Why Us', '#why-us'), L('How It Works', '#how-it-works'), L('Contact', '#contact')] },
      { id: 'col-2', title: 'Our Services', links: [L('Career Guidance', '#services'), L('Skill Development', '#services'), L('One-to-One Mentorship', '#services'), L('Interview & Resume Prep', '#services')] },
    ],
    copyright: '© {year} Maxicareer. All rights reserved.',
    showPrivacy: true,
    showTerms: true,
    showAdminLink: true,
  },
  contact: {
    heading: 'Talk to a Maxicareer mentor',
    intro: 'Tell us where you are and where you want to go. A mentor will reply within 24 hours.',
    email: OFFICIAL_EMAIL,
    secondaryEmail: SECONDARY_EMAIL,
    phone: OFFICIAL_PHONE,
    whatsapp: OFFICIAL_PHONE_DIGITS,
    address: 'India (online sessions nationwide)',
    hours: 'Mon–Sat, 10:00 AM – 7:00 PM IST',
    responseTime: 'Prompt reply within 24 hours of inquiry',
    mapUrl: '',
    topics: 'Career Guidance\nSkill Development\nOne-to-One Mentorship\nInterview & Resume Prep\nStudy Abroad',
    successMessage: 'Thank you! Your message has been sent successfully. A Maxicareer mentor will reach out to you within 24 hours.',
    autoReply: true,
  },
  ctas: [
    { id: 'cta-1', name: 'Homepage closing banner', placement: 'Homepage, above footer', heading: 'Ready to Take the Next Step in Your Career?', body: 'Get the guidance, skills, and mentorship you need to move forward with confidence.', buttonLabel: 'Book a free consultation', buttonHref: '#contact', style: 'navy', active: true },
    { id: 'cta-2', name: 'Services section nudge', placement: 'After services list', heading: 'Not sure which program fits?', body: 'A 15-minute call is enough to point you in the right direction.', buttonLabel: 'Chat on WhatsApp', buttonHref: `https://wa.me/${OFFICIAL_PHONE_DIGITS}`, style: 'blue', active: true },
  ],
  articles: [],
  seo: {
    siteName: 'Maxicareer',
    titleTemplate: '%s | Maxicareer',
    defaultTitle: 'Maxicareer | Career Guidance and Mentorship',
    description: 'Maxicareer provides personalized career guidance, mentorship, skill development, and practical support to help students and aspiring professionals achieve their goals.',
    keywords: 'career guidance, career counselling India, mentorship, resume writing, LinkedIn optimisation, placement preparation',
    canonical: 'https://maxicareer.com',
    ogImage: '/images/maxicareer-logo-horizontal.png',
    twitter: '',
    indexable: true,
    sitemap: true,
    pages: [
      { id: 'pg-1', path: '/', title: 'Career Guidance and Mentorship', description: '', noindex: false },
      { id: 'pg-2', path: '/admin', title: 'Admin', description: '', noindex: true },
    ],
  },
  social: [
    { id: 'so-1', platform: 'WhatsApp', url: `https://wa.me/${OFFICIAL_PHONE_DIGITS}`, visible: true, inFooter: true, inContact: true },
    { id: 'so-2', platform: 'Instagram', url: '', visible: false, inFooter: true, inContact: false },
    { id: 'so-3', platform: 'LinkedIn', url: '', visible: false, inFooter: true, inContact: true },
    { id: 'so-4', platform: 'YouTube', url: '', visible: false, inFooter: true, inContact: false },
  ],
  policies: DEFAULT_POLICIES,
};

const SECTION_FOR_TAB: Record<string, { key: SectionKey; title: string; description: string }> = {
  'web-home': { key: 'home', title: 'Homepage', description: 'The first screen visitors see: announcement bar, headline, buttons and banner image.' },
  'web-nav': { key: 'navigation', title: 'Navigation', description: 'Menu links across the top of the site, in the order they appear, plus the main button.' },
  'web-footer': { key: 'footer', title: 'Footer', description: 'The about blurb, link columns and legal line at the bottom of every page.' },
  'web-contact': { key: 'contact', title: 'Contact page', description: 'How people reach you, what they can ask about, and what they see after sending the form.' },
  'web-cta': { key: 'ctas', title: 'Calls to action', description: 'Banners that ask visitors to book, message or sign up. Turn them on or off without touching code.' },
  'web-articles': { key: 'articles', title: 'Article covers', description: 'Cover images and titles for blog posts and guides, checked at every size they are shown.' },
  'web-seo': { key: 'seo', title: 'SEO', description: 'How Maxicareer shows up on Google and when links are shared on WhatsApp, LinkedIn and X.' },
  'web-social': { key: 'social', title: 'Social links', description: 'Profiles shown as icons in the footer and on the contact page.' },
  'web-policies': { key: 'policies', title: 'Policies', description: 'Privacy policy, terms of service and refund and cancellation policy, shown at /privacy, /terms and /refund-policy.' },
};

/** "26 October 2026", the format the policy pages show. */
const todayLabel = () => new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

const SOCIAL_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  Instagram,
  LinkedIn: Linkedin,
  YouTube: Youtube,
  Facebook,
  X: Twitter,
  WhatsApp: MessageCircle,
  Telegram: Send,
};
const SOCIAL_PREFIX: Record<string, string> = {
  Instagram: 'https://instagram.com/',
  LinkedIn: 'https://linkedin.com/company/',
  YouTube: 'https://youtube.com/@',
  Facebook: 'https://facebook.com/',
  X: 'https://x.com/',
  WhatsApp: 'https://wa.me/',
  Telegram: 'https://t.me/',
};

const isUrl = (v: string) => /^https?:\/\/[^\s.]+\.[^\s]+/.test(v);

/* ------------------------------------------------------------------ */
/* Small editors                                                       */
/* ------------------------------------------------------------------ */

const LinkListEditor: React.FC<{ links: LinkItem[]; onChange: (l: LinkItem[]) => void; addLabel?: string }> = ({ links, onChange, addLabel = 'Add link' }) => {
  const upd = (id: string, p: Partial<LinkItem>) => onChange(links.map((l) => (l.id === id ? { ...l, ...p } : l)));
  const move = (i: number, d: -1 | 1) => {
    const n = [...links];
    const j = i + d;
    if (j < 0 || j >= n.length) return;
    [n[i], n[j]] = [n[j], n[i]];
    onChange(n);
  };
  return (
    <div className="space-y-2">
      {links.map((l, i) => (
        <div key={l.id} className={cx('flex flex-col sm:flex-row gap-2 sm:items-center rounded-[11px] border border-[#EAEFF6] bg-[#FBFCFE] p-2', !l.visible && 'opacity-60')}>
          <span className="mc-num hidden sm:block w-5 text-center text-[12px] text-[#8C97AE]">{i + 1}</span>
          <Input value={l.label} onChange={(e) => upd(l.id, { label: e.target.value })} placeholder="Label" className="sm:w-44 h-9" aria-label="Link label" />
          <Input value={l.href} onChange={(e) => upd(l.id, { href: e.target.value })} placeholder="#section or https://" className="flex-1 h-9" aria-label="Link target" />
          <div className="flex items-center gap-0.5">
            <IconButton icon={l.visible ? Eye : EyeOff} label={l.visible ? 'Hide' : 'Show'} onClick={() => upd(l.id, { visible: !l.visible })} />
            <IconButton icon={ArrowUp} label="Move up" onClick={() => move(i, -1)} disabled={i === 0} className="disabled:opacity-30" />
            <IconButton icon={ArrowDown} label="Move down" onClick={() => move(i, 1)} disabled={i === links.length - 1} className="disabled:opacity-30" />
            <IconButton icon={Trash2} tone="danger" label="Remove" onClick={() => onChange(links.filter((x) => x.id !== l.id))} />
          </div>
        </div>
      ))}
      <Button size="sm" icon={Plus} onClick={() => onChange([...links, L('New link', '#')])}>
        {addLabel}
      </Button>
    </div>
  );
};

const Counter: React.FC<{ value: string; min: number; max: number }> = ({ value, min, max }) => {
  const n = value.length;
  const tone = n === 0 ? 'text-[#7A869E]' : n < min ? 'text-[#94570A]' : n > max ? 'text-[#B42F3B]' : 'text-[#0B7A55]';
  return (
    <span className={cx('mc-num', tone)}>
      {n} characters · aim for {min}–{max}
    </span>
  );
};

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export const Website: React.FC<{ tab: AdminTab }> = ({ tab }) => {
  const { addAudit, notify, toast } = useAdmin();
  const meta = SECTION_FOR_TAB[tab];
  const [savedDraft, setSavedDraft] = useSharedValue<WebsiteContent>('website_draft', DEFAULT_CONTENT);
  const [published, setPublished] = useSharedValue<Partial<WebsiteContent>>('website_published', {});
  const [publishedAt, setPublishedAt] = useSharedValue<Partial<Record<SectionKey, string>>>('website_published_at', {});
  const [uploading, setUploading] = useState(false);

  /** Uploads an image to Azure Blob Storage and hands back its URL. */
  const uploadImage = async (onDone: (url: string) => void) => {
    const file = await pickFile('image/png,image/jpeg,image/webp,image/gif,image/svg+xml');
    if (!file) return;
    setUploading(true);
    try {
      const uploaded = await uploadFile(file, 'website');
      onDone(uploaded.url);
      toast('Image uploaded.');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Upload failed.', 'error');
    } finally {
      setUploading(false);
    }
  };
  const [articleFilter, setArticleFilter] = useState<'all' | 'Draft' | 'Published'>('all');
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [policyTab, setPolicyTab] = useState<PolicyKey>('privacy');

  // Older saved drafts may be missing newer sections: fill gaps from defaults.
  const saved: WebsiteContent = useMemo(() => ({ ...DEFAULT_CONTENT, ...savedDraft }), [savedDraft]);
  // Edits stay on this page until "Save draft" (or Publish) stores them.
  const [content, setContent, { dirty: unsaved, reset: undoEdits }] = useDraft(saved);
  const key = meta.key;
  const section = content[key];
  const live = published[key];
  const dirty = JSON.stringify(section) !== JSON.stringify(live ?? null);

  const set = <K extends SectionKey>(k: K, value: WebsiteContent[K]) => setContent({ ...content, [k]: value });

  /** Stores this section's draft, leaving the other sections as saved. */
  const storeSection = (value: WebsiteContent[SectionKey]) => {
    const next = { ...saved, [key]: value };
    setSavedDraft(next);
    setContent(next);
  };

  const saveDraft = () => {
    storeSection(section);
    addAudit('Website', 'Saved draft', meta.title);
    toast(`${meta.title} draft saved. Publish when you're ready for visitors to see it.`);
  };

  const publish = () => {
    storeSection(section);
    setPublished({ ...published, [key]: section });
    const at = new Date().toISOString();
    setPublishedAt({ ...publishedAt, [key]: at });
    addAudit('Website', 'Published', meta.title);
    notify({ title: `${meta.title} published`, body: 'Changes are live for visitors.', category: 'website', link: tab });
    toast(`${meta.title} published.`);
  };

  const discard = () => {
    if (!window.confirm(live ? 'Discard your changes and go back to the live version?' : 'Reset this section to the original website content?')) return;
    storeSection((live ?? DEFAULT_CONTENT[key]) as never);
    addAudit('Website', live ? 'Discarded draft' : 'Reset to defaults', meta.title);
  };

  const status = unsaved ? (
    <Badge tone="rose" dot>
      Not saved yet
    </Badge>
  ) : !publishedAt[key] ? (
    <Badge tone="neutral" dot>
      Not published from admin yet
    </Badge>
  ) : dirty ? (
    <Badge tone="marigold" dot>
      Unpublished changes
    </Badge>
  ) : (
    <Badge tone="mint" dot>
      Live since {formatDate(publishedAt[key], true)}
    </Badge>
  );

  const header = (
    <>
      <PageHeader
        meta={
          <span className="inline-flex items-center gap-2">
            <Globe className="w-3.5 h-3.5" /> Website
          </span>
        }
        title={meta.title}
        description={meta.description}
        actions={
          <>
            {status}
            <Button icon={RotateCcw} onClick={discard} disabled={!!live && !dirty}>
              {live ? 'Discard changes' : 'Reset'}
            </Button>
            <Button onClick={saveDraft} disabled={!unsaved}>
              {unsaved ? 'Save draft' : 'Draft saved'}
            </Button>
            <Button variant="primary" onClick={publish} disabled={!!live && !dirty}>
              Publish
            </Button>
          </>
        }
      />
      <SaveBar show={unsaved} message={`${meta.title}: changes aren't saved yet`} saveLabel="Save draft" onSave={saveDraft} onDiscard={undoEdits} />
    </>
  );

  /* ---------------- Policies ---------------- */
  if (key === 'policies') {
    const all = content.policies;
    const pol = all[policyTab];
    const upPol = (p: Partial<Policy>) => set('policies', { ...all, [policyTab]: { ...pol, ...p } });
    const updSec = (id: string, p: Partial<PolicySection>) => upPol({ sections: pol.sections.map((s) => (s.id === id ? { ...s, ...p } : s)) });
    const moveSec = (i: number, d: -1 | 1) => {
      const next = [...pol.sections];
      const j = i + d;
      if (j < 0 || j >= next.length) return;
      [next[i], next[j]] = [next[j], next[i]];
      upPol({ sections: next });
    };
    return (
      <div className="space-y-5">
        {header}
        <Segmented value={policyTab} onChange={setPolicyTab} options={POLICY_KEYS.map((k) => ({ value: k, label: all[k].title || 'Untitled' }))} />
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_480px] gap-4 items-start">
          <div className="space-y-4">
            <Panel
              title={pol.title || 'Untitled'}
              description={`Shown at ${POLICY_PATH[policyTab]}. Publish to put your changes live.`}
              actions={
                <a href={POLICY_PATH[policyTab]} target="_blank" rel="noopener noreferrer" className="inline-flex h-8 items-center gap-1.5 rounded-[10px] border border-[#D3DBE8] bg-white px-3 text-[12.5px] font-semibold hover:border-[#B7C3D7]">
                  <ExternalLink className="w-3.5 h-3.5" /> Live page
                </a>
              }
            >
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-[1fr_220px] gap-3">
                  <Field label="Title">
                    <Input value={pol.title} onChange={(e) => upPol({ title: e.target.value })} maxLength={120} />
                  </Field>
                  <Field
                    label="Last updated"
                    hint={
                      <button type="button" onClick={() => upPol({ updated: todayLabel() })} className="font-semibold text-[#2563EB] hover:underline">
                        Set to today
                      </button>
                    }
                  >
                    <Input value={pol.updated} onChange={(e) => upPol({ updated: e.target.value })} placeholder={todayLabel()} />
                  </Field>
                </div>
                <Field label="Introduction">
                  <Textarea rows={3} value={pol.intro} onChange={(e) => upPol({ intro: e.target.value })} />
                </Field>
              </div>
            </Panel>
            <Panel title="Sections" description='Plain text. Start a line with "- " for a bullet point, and leave a blank line between paragraphs.'>
              <div className="space-y-3">
                {pol.sections.map((s, i) => (
                  <div key={s.id} className="rounded-[12px] border border-[#EAEFF6] bg-[#FBFCFE] p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="mc-num hidden sm:block w-5 text-center text-[12px] text-[#8C97AE]">{i + 1}</span>
                      <Input value={s.heading} onChange={(e) => updSec(s.id, { heading: e.target.value })} placeholder="Section heading" className="flex-1 h-9 font-semibold" aria-label="Section heading" />
                      <div className="flex items-center gap-0.5">
                        <IconButton icon={ArrowUp} label="Move up" onClick={() => moveSec(i, -1)} disabled={i === 0} className="disabled:opacity-30" />
                        <IconButton icon={ArrowDown} label="Move down" onClick={() => moveSec(i, 1)} disabled={i === pol.sections.length - 1} className="disabled:opacity-30" />
                        <IconButton
                          icon={Trash2}
                          tone="danger"
                          label="Remove section"
                          onClick={() => window.confirm(`Remove "${s.heading || 'this section'}"?`) && upPol({ sections: pol.sections.filter((x) => x.id !== s.id) })}
                        />
                      </div>
                    </div>
                    <Textarea rows={Math.min(14, Math.max(4, s.body.split('\n').length + 1))} value={s.body} onChange={(e) => updSec(s.id, { body: e.target.value })} aria-label={`${s.heading || 'Section'} text`} />
                  </div>
                ))}
                <Button size="sm" icon={Plus} onClick={() => upPol({ sections: [...pol.sections, { id: uid('sec'), heading: 'New section', body: '' }] })}>
                  Add section
                </Button>
              </div>
            </Panel>
          </div>
          <Panel title="Preview" className="xl:sticky xl:top-20" flush>
            <div className="mx-5 mb-5 rounded-[12px] border border-[#DDE4EF] bg-[#F8FAFC] p-5 max-h-[75vh] overflow-y-auto">
              <PolicyArticle policy={pol} />
            </div>
          </Panel>
        </div>
      </div>
    );
  }

  /* ---------------- Homepage ---------------- */
  if (key === 'home') {
    const h = content.home;
    const up = (p: Partial<typeof h>) => set('home', { ...h, ...p });
    return (
      <div className="space-y-5">
        {header}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_440px] gap-4 items-start">
          <div className="space-y-4">
            <Panel title="Announcement bar" description="A thin strip above the menu for time-sensitive news." actions={<Toggle checked={h.announcementOn} onChange={(v) => up({ announcementOn: v })} label="Show announcement" />}>
              <div className={cx('grid grid-cols-1 sm:grid-cols-[1fr_200px] gap-3', !h.announcementOn && 'opacity-50')}>
                <Field label="Text">
                  <Input value={h.announcement} onChange={(e) => up({ announcement: e.target.value })} maxLength={110} />
                </Field>
                <Field label="Links to">
                  <Input value={h.announcementHref} onChange={(e) => up({ announcementHref: e.target.value })} />
                </Field>
              </div>
            </Panel>
            <Panel title="Hero">
              <div className="space-y-4">
                <Field label="Headline" hint={<Counter value={h.headline} min={30} max={70} />}>
                  <Input value={h.headline} onChange={(e) => up({ headline: e.target.value })} />
                </Field>
                <Field label="Supporting line">
                  <Textarea rows={3} value={h.subheadline} onChange={(e) => up({ subheadline: e.target.value })} />
                </Field>
                <Field label="Trust points" hint="Separate with commas. Shown as small pills under the buttons.">
                  <Input value={h.trustPills} onChange={(e) => up({ trustPills: e.target.value })} />
                </Field>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Main button">
                    <Input value={h.primaryLabel} onChange={(e) => up({ primaryLabel: e.target.value })} />
                  </Field>
                  <Field label="Main button links to">
                    <Input value={h.primaryHref} onChange={(e) => up({ primaryHref: e.target.value })} />
                  </Field>
                  <Field label="Second button">
                    <Input value={h.secondaryLabel} onChange={(e) => up({ secondaryLabel: e.target.value })} />
                  </Field>
                  <Field label="Second button links to">
                    <Input value={h.secondaryHref} onChange={(e) => up({ secondaryHref: e.target.value })} />
                  </Field>
                </div>
                <Field label="Banner image" hint="Upload an image, or use a path in /public or a full URL.">
                  <div className="flex gap-2">
                    <Input value={h.bannerUrl} onChange={(e) => up({ bannerUrl: e.target.value })} placeholder="/images/hero-illustration.svg" />
                    <Button icon={Upload} disabled={uploading} onClick={() => uploadImage((url) => up({ bannerUrl: url }))}>
                      {uploading ? 'Uploading…' : 'Upload'}
                    </Button>
                  </div>
                </Field>
              </div>
            </Panel>
          </div>
          <Panel title="Preview" className="xl:sticky xl:top-20" flush>
            <div className="mx-5 mb-5 rounded-[12px] border border-[#DDE4EF] overflow-hidden">
              {h.announcementOn && <div className="bg-[#2563EB] text-white text-[11.5px] text-center px-3 py-1.5">{h.announcement}</div>}
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#EEF2F7]">
                <img src="/images/maxicareer-logo.svg" alt="" className="h-5" onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')} />
                <span className="text-[10px] font-semibold bg-[#2563EB] text-white rounded-full px-2.5 py-1">{content.navigation.buttonLabel}</span>
              </div>
              <div className="px-5 py-6 bg-[#F8FAFC]">
                <div className="text-[22px] font-extrabold leading-tight text-[#0F172A]" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                  {h.headline}
                </div>
                <p className="mt-2 text-[12.5px] text-[#475569] leading-relaxed">{h.subheadline}</p>
                <div className="mt-3 flex gap-2">
                  <span className="text-[11px] font-semibold bg-[#2563EB] text-white rounded-full px-3 py-1.5">{h.primaryLabel}</span>
                  <span className="text-[11px] font-semibold border border-[#CBD5E1] text-[#0F172A] rounded-full px-3 py-1.5">{h.secondaryLabel}</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {h.trustPills
                    .split(',')
                    .map((x) => x.trim())
                    .filter(Boolean)
                    .map((p) => (
                      <span key={p} className="text-[10px] bg-white border border-[#E2E8F0] rounded-full px-2 py-0.5 text-[#475569]">
                        {p}
                      </span>
                    ))}
                </div>
                {h.bannerUrl && <img src={h.bannerUrl} alt="" className="mt-4 w-full max-h-40 object-contain" />}
              </div>
            </div>
          </Panel>
        </div>
      </div>
    );
  }

  /* ---------------- Navigation ---------------- */
  if (key === 'navigation') {
    const n = content.navigation;
    const up = (p: Partial<typeof n>) => set('navigation', { ...n, ...p });
    return (
      <div className="space-y-5">
        {header}
        <Panel title="Preview" flush>
          <div className="mx-5 mb-5 rounded-[12px] border border-[#DDE4EF] bg-white px-4 py-3 flex items-center gap-4 overflow-x-auto">
            <img src="/images/maxicareer-logo.svg" alt="Maxicareer" className="h-6 shrink-0" onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')} />
            <nav className="flex items-center gap-4 flex-1">
              {n.links
                .filter((l) => l.visible)
                .map((l) => (
                  <span key={l.id} className="text-[13px] font-semibold text-[#334155] whitespace-nowrap">
                    {l.label}
                  </span>
                ))}
            </nav>
            {n.showEmail && <Mail className="w-4 h-4 text-[#64748B] shrink-0" />}
            {n.showWhatsApp && <MessageCircle className="w-4 h-4 text-[#16A34A] shrink-0" />}
            <span className="text-[12px] font-semibold bg-[#2563EB] text-white rounded-full px-3 py-1.5 whitespace-nowrap">{n.buttonLabel}</span>
          </div>
        </Panel>
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-4 items-start">
          <Panel title="Menu links" description="Hidden links stay saved so you can bring them back later.">
            <LinkListEditor links={n.links} onChange={(links) => up({ links })} />
          </Panel>
          <Panel title="Right side of the menu">
            <div className="space-y-4">
              <Field label="Button text">
                <Input value={n.buttonLabel} onChange={(e) => up({ buttonLabel: e.target.value })} />
              </Field>
              <Field label="Button links to">
                <Input value={n.buttonHref} onChange={(e) => up({ buttonHref: e.target.value })} />
              </Field>
              {[
                ['showEmail', 'Show email icon'],
                ['showWhatsApp', 'Show WhatsApp icon'],
                ['sticky', 'Keep menu visible while scrolling'],
              ].map(([k, label]) => (
                <div key={k} className="flex items-center justify-between gap-3">
                  <span className="text-[13.5px] text-[#26355A]">{label}</span>
                  <Toggle checked={(n as any)[k]} onChange={(v) => up({ [k]: v } as any)} label={label} />
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    );
  }

  /* ---------------- Footer ---------------- */
  if (key === 'footer') {
    const f = content.footer;
    const up = (p: Partial<typeof f>) => set('footer', { ...f, ...p });
    return (
      <div className="space-y-5">
        {header}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-start">
          <div className="space-y-4">
            <Panel title="About">
              <div className="space-y-4">
                <Field label="Short description">
                  <Textarea rows={4} value={f.about} onChange={(e) => up({ about: e.target.value })} />
                </Field>
                <Field label="Tagline under it">
                  <Input value={f.pillars} onChange={(e) => up({ pillars: e.target.value })} />
                </Field>
              </div>
            </Panel>
            {f.columns.map((col, ci) => (
              <Panel
                key={col.id}
                title={
                  <input
                    value={col.title}
                    onChange={(e) => up({ columns: f.columns.map((c) => (c.id === col.id ? { ...c, title: e.target.value } : c)) })}
                    className="bg-transparent focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 rounded px-1 -mx-1"
                    aria-label="Column title"
                  />
                }
                description={`Column ${ci + 1}`}
                actions={<IconButton icon={Trash2} tone="danger" label="Remove column" onClick={() => window.confirm(`Remove the "${col.title}" column?`) && up({ columns: f.columns.filter((c) => c.id !== col.id) })} />}
              >
                <LinkListEditor links={col.links} onChange={(links) => up({ columns: f.columns.map((c) => (c.id === col.id ? { ...c, links } : c)) })} />
              </Panel>
            ))}
            <Button icon={Plus} onClick={() => up({ columns: [...f.columns, { id: uid('col'), title: 'New column', links: [] }] })} disabled={f.columns.length >= 4}>
              Add column
            </Button>
            <Panel title="Bottom line">
              <div className="space-y-4">
                <Field label="Copyright" hint="{year} is replaced with the current year.">
                  <Input value={f.copyright} onChange={(e) => up({ copyright: e.target.value })} />
                </Field>
                {[
                  ['showPrivacy', 'Privacy policy link'],
                  ['showTerms', 'Terms of service link'],
                  ['showAdminLink', 'Staff login link'],
                ].map(([k, label]) => (
                  <div key={k} className="flex items-center justify-between">
                    <span className="text-[13.5px] text-[#26355A]">{label}</span>
                    <Toggle checked={(f as any)[k]} onChange={(v) => up({ [k]: v } as any)} label={label} />
                  </div>
                ))}
              </div>
            </Panel>
          </div>
          <Panel title="Preview" className="xl:sticky xl:top-20" flush>
            <div className="mx-5 mb-5 rounded-[12px] bg-[#0F172A] text-[#94A3B8] p-5">
              <div className={cx('grid gap-5', f.columns.length >= 2 ? 'sm:grid-cols-3' : 'sm:grid-cols-2')}>
                <div>
                  <img src="/images/maxicareer-logo-white.svg" alt="" className="h-6 mb-2" onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')} />
                  <p className="text-[11.5px] leading-relaxed">{f.about}</p>
                  <p className="text-[10.5px] mt-2 text-[#64748B]">{f.pillars}</p>
                  <div className="flex gap-2 mt-3">
                    {content.social
                      .filter((s) => s.visible && s.inFooter && s.url)
                      .map((s) => {
                        const I = SOCIAL_ICON[s.platform] || Link2;
                        return <I key={s.id} className="w-4 h-4 text-white" />;
                      })}
                  </div>
                </div>
                {f.columns.map((c) => (
                  <div key={c.id}>
                    <div className="text-[11px] font-bold text-white mb-2">{c.title}</div>
                    <ul className="space-y-1 text-[11.5px]">
                      {c.links
                        .filter((l) => l.visible)
                        .map((l) => (
                          <li key={l.id}>{l.label}</li>
                        ))}
                    </ul>
                  </div>
                ))}
              </div>
              <div className="mt-5 pt-3 border-t border-[#1E293B] flex flex-wrap justify-between gap-2 text-[10.5px]">
                <span>{f.copyright.replace('{year}', String(new Date().getFullYear()))}</span>
                <span className="flex gap-3">
                  {f.showPrivacy && <span>Privacy Policy</span>}
                  {f.showTerms && <span>Terms of Service</span>}
                  {f.showAdminLink && <span>Staff login</span>}
                </span>
              </div>
            </div>
          </Panel>
        </div>
      </div>
    );
  }

  /* ---------------- Contact ---------------- */
  if (key === 'contact') {
    const c = content.contact;
    const up = (p: Partial<typeof c>) => set('contact', { ...c, ...p });
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email);
    return (
      <div className="space-y-5">
        {header}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-4 items-start">
          <div className="space-y-4">
            <Panel title="Page text">
              <div className="space-y-4">
                <Field label="Heading">
                  <Input value={c.heading} onChange={(e) => up({ heading: e.target.value })} />
                </Field>
                <Field label="Introduction">
                  <Textarea rows={2} value={c.intro} onChange={(e) => up({ intro: e.target.value })} />
                </Field>
              </div>
            </Panel>
            <Panel title="Contact details">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Main email" hint={!emailOk ? <span className="text-[#B42F3B]">This doesn't look like an email address.</span> : 'Form submissions are sent here.'}>
                  <Input type="email" value={c.email} onChange={(e) => up({ email: e.target.value })} />
                </Field>
                <Field label="Second email">
                  <Input type="email" value={c.secondaryEmail} onChange={(e) => up({ secondaryEmail: e.target.value })} />
                </Field>
                <Field label="Phone">
                  <Input value={c.phone} onChange={(e) => up({ phone: e.target.value })} />
                </Field>
                <Field label="WhatsApp number" hint="Digits only, with country code (91…).">
                  <Input value={c.whatsapp} onChange={(e) => up({ whatsapp: e.target.value.replace(/[^0-9]/g, '') })} inputMode="numeric" />
                </Field>
                <Field label="Address" className="sm:col-span-2">
                  <Input value={c.address} onChange={(e) => up({ address: e.target.value })} />
                </Field>
                <Field label="Office hours">
                  <Input value={c.hours} onChange={(e) => up({ hours: e.target.value })} />
                </Field>
                <Field label="Reply promise">
                  <Input value={c.responseTime} onChange={(e) => up({ responseTime: e.target.value })} />
                </Field>
                <Field label="Google Maps embed link" className="sm:col-span-2" hint="Optional. From Google Maps → Share → Embed a map → copy the src link.">
                  <Input value={c.mapUrl} onChange={(e) => up({ mapUrl: e.target.value })} placeholder="https://www.google.com/maps/embed?..." />
                </Field>
              </div>
            </Panel>
            <Panel title="Contact form">
              <div className="space-y-4">
                <Field label="Topics in the “I'm interested in” dropdown" hint="One per line.">
                  <Textarea rows={5} value={c.topics} onChange={(e) => up({ topics: e.target.value })} />
                </Field>
                <Field label="Message after sending">
                  <Textarea rows={2} value={c.successMessage} onChange={(e) => up({ successMessage: e.target.value })} />
                </Field>
                <div className="flex items-center justify-between">
                  <span className="text-[13.5px] text-[#26355A]">Email the visitor a copy of their message</span>
                  <Toggle checked={c.autoReply} onChange={(v) => up({ autoReply: v })} label="Auto-reply" />
                </div>
              </div>
            </Panel>
          </div>
          <Panel title="Preview" className="xl:sticky xl:top-20">
            <div className="rounded-[12px] border border-[#DDE4EF] p-4 bg-[#F8FAFC]">
              <div className="text-[18px] font-extrabold text-[#0F172A]">{c.heading}</div>
              <p className="text-[12.5px] text-[#475569] mt-1">{c.intro}</p>
              <ul className="mt-3 space-y-2 text-[12.5px] text-[#334155]">
                <li className="flex gap-2"><Mail className="w-4 h-4 text-[#2563EB] shrink-0" />{c.email}{c.secondaryEmail && <span className="text-[#64748B]">/ {c.secondaryEmail}</span>}</li>
                <li className="flex gap-2"><Phone className="w-4 h-4 text-[#2563EB] shrink-0" />{c.phone}</li>
                <li className="flex gap-2"><MapPin className="w-4 h-4 text-[#2563EB] shrink-0" />{c.address}</li>
                <li className="flex gap-2"><Clock className="w-4 h-4 text-[#2563EB] shrink-0" />{c.hours}</li>
              </ul>
              <div className="mt-4 space-y-2">
                <div className="h-8 rounded-[8px] bg-white border border-[#E2E8F0]" />
                <select className="w-full h-8 rounded-[8px] bg-white border border-[#E2E8F0] text-[12px] px-2" aria-label="Topic preview">
                  {c.topics.split('\n').filter(Boolean).map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
                <div className="h-16 rounded-[8px] bg-white border border-[#E2E8F0]" />
                <div className="h-8 rounded-full bg-[#2563EB] text-white text-[12px] font-semibold flex items-center justify-center">Send message</div>
              </div>
              <p className="mt-3 text-[11.5px] text-[#0B7A55] bg-[#E3F6EE] rounded-[8px] p-2">{c.successMessage}</p>
            </div>
          </Panel>
        </div>
      </div>
    );
  }

  /* ---------------- Calls to action ---------------- */
  if (key === 'ctas') {
    const list = content.ctas;
    const upd = (id: string, p: Partial<(typeof list)[number]>) => set('ctas', list.map((x) => (x.id === id ? { ...x, ...p } : x)));
    const styles = { navy: 'bg-[#0F172A] text-white', blue: 'bg-[#2563EB] text-white', light: 'bg-[#EFF6FF] text-[#0F172A]' };
    return (
      <div className="space-y-5">
        {header}
        <div className="flex justify-end">
          <Button
            variant="dark"
            icon={Plus}
            onClick={() =>
              set('ctas', [...list, { id: uid('cta'), name: 'New call to action', placement: 'Homepage', heading: 'Book a free career call', body: '15 minutes with a mentor, no obligation.', buttonLabel: 'Book now', buttonHref: '#contact', style: 'blue', active: false }])
            }
          >
            Add call to action
          </Button>
        </div>
        {list.length === 0 && (
          <Panel>
            <Empty icon={ImageIcon} title="No calls to action" body="Add one to invite visitors to book, message or sign up." />
          </Panel>
        )}
        {list.map((c) => (
          <Panel
            key={c.id}
            title={c.name}
            description={c.placement}
            actions={
              <>
                <span className="text-[12.5px] text-[#5B6885]">{c.active ? 'Showing' : 'Hidden'}</span>
                <Toggle checked={c.active} onChange={(v) => upd(c.id, { active: v })} label="Show on site" />
                <IconButton icon={Trash2} tone="danger" label="Delete" onClick={() => window.confirm(`Delete "${c.name}"?`) && set('ctas', list.filter((x) => x.id !== c.id))} />
              </>
            }
          >
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Internal name">
                  <Input value={c.name} onChange={(e) => upd(c.id, { name: e.target.value })} />
                </Field>
                <Field label="Where it appears">
                  <Select value={c.placement} onChange={(e) => upd(c.id, { placement: e.target.value })}>
                    {['Homepage', 'Homepage, above footer', 'After services list', 'After testimonials', 'Contact page', 'Article footer', 'Site-wide popup'].map((p) => (
                      <option key={p}>{p}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="Heading" className="sm:col-span-2">
                  <Input value={c.heading} onChange={(e) => upd(c.id, { heading: e.target.value })} />
                </Field>
                <Field label="Supporting text" className="sm:col-span-2">
                  <Textarea rows={2} value={c.body} onChange={(e) => upd(c.id, { body: e.target.value })} />
                </Field>
                <Field label="Button text">
                  <Input value={c.buttonLabel} onChange={(e) => upd(c.id, { buttonLabel: e.target.value })} />
                </Field>
                <Field label="Button links to">
                  <Input value={c.buttonHref} onChange={(e) => upd(c.id, { buttonHref: e.target.value })} />
                </Field>
                <Field label="Colour" className="sm:col-span-2">
                  <Segmented
                    value={c.style}
                    onChange={(v) => upd(c.id, { style: v })}
                    options={[
                      { value: 'navy', label: 'Navy' },
                      { value: 'blue', label: 'Blue' },
                      { value: 'light', label: 'Light' },
                    ]}
                  />
                </Field>
              </div>
              <div className={cx('rounded-[14px] p-5 self-start', styles[c.style], !c.active && 'opacity-50')}>
                <div className="text-[18px] font-extrabold leading-tight">{c.heading}</div>
                <p className={cx('text-[12.5px] mt-1.5', c.style === 'light' ? 'text-[#475569]' : 'opacity-80')}>{c.body}</p>
                <span className={cx('inline-block mt-3 text-[12px] font-semibold rounded-full px-3.5 py-1.5', c.style === 'blue' ? 'bg-white text-[#2563EB]' : c.style === 'navy' ? 'bg-[#2563EB] text-white' : 'bg-[#0F172A] text-white')}>{c.buttonLabel}</span>
              </div>
            </div>
          </Panel>
        ))}
      </div>
    );
  }

  /* ---------------- Article covers ---------------- */
  if (key === 'articles') {
    const list = content.articles;
    const upd = (id: string, p: Partial<(typeof list)[number]>) => set('articles', list.map((x) => (x.id === id ? { ...x, ...p } : x)));
    const shown = list.filter((a) => articleFilter === 'all' || a.status === articleFilter);
    const slugify = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
    const uploadCover = (id: string) => uploadImage((url) => upd(id, { coverUrl: url }));
    return (
      <div className="space-y-5">
        {header}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Segmented
            value={articleFilter}
            onChange={setArticleFilter}
            options={[
              { value: 'all', label: 'All', count: list.length },
              { value: 'Published', label: 'Published', count: list.filter((a) => a.status === 'Published').length },
              { value: 'Draft', label: 'Drafts', count: list.filter((a) => a.status === 'Draft').length },
            ]}
          />
          <Button
            variant="dark"
            icon={Plus}
            onClick={() =>
              set('articles', [
                { id: uid('art'), title: 'How to choose between MBA and a job after graduation', slug: 'mba-or-job-after-graduation', category: 'Career guidance', excerpt: '', coverUrl: '', coverAlt: '', focal: 'center', overlay: true, status: 'Draft', publishedOn: '' },
                ...list,
              ])
            }
          >
            Add article
          </Button>
        </div>
        {shown.length === 0 && (
          <Panel>
            <Empty icon={ImageIcon} title="No articles yet" body="Add an article to set its cover image and title card." />
          </Panel>
        )}
        {shown.map((a) => {
          const missing = [!a.coverUrl && 'cover image', a.coverUrl && !a.coverAlt && 'alt text', !a.excerpt && 'excerpt'].filter(Boolean) as string[];
          const cover = (ratio: string, w: string, label: string) => (
            <figure className={w}>
              <div className="relative overflow-hidden rounded-[10px] bg-[#E2E8F1]" style={{ aspectRatio: ratio }}>
                {a.coverUrl ? (
                  <img src={a.coverUrl} alt={a.coverAlt} className="absolute inset-0 h-full w-full object-cover" style={{ objectPosition: a.focal }} />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-[#8C97AE]">
                    <ImageIcon className="w-6 h-6" />
                  </div>
                )}
                {a.overlay && (
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A]/85 via-[#0F172A]/20 to-transparent flex items-end p-2.5">
                    <span className="text-white text-[11.5px] font-bold leading-snug line-clamp-2">{a.title}</span>
                  </div>
                )}
              </div>
              <figcaption className="text-[11.5px] text-[#7A869E] mt-1">{label}</figcaption>
            </figure>
          );
          return (
            <Panel
              key={a.id}
              title={a.title || 'Untitled article'}
              description={`/blog/${a.slug || '…'}`}
              actions={
                <>
                  <Badge tone={a.status === 'Published' ? 'mint' : 'marigold'} dot>
                    {a.status}
                  </Badge>
                  <Button size="sm" onClick={() => upd(a.id, { status: a.status === 'Published' ? 'Draft' : 'Published', publishedOn: a.status === 'Published' ? a.publishedOn : new Date().toISOString().slice(0, 10) })}>
                    {a.status === 'Published' ? 'Move to drafts' : 'Mark published'}
                  </Button>
                  <IconButton icon={Trash2} tone="danger" label="Delete" onClick={() => window.confirm(`Delete "${a.title}"?`) && set('articles', list.filter((x) => x.id !== a.id))} />
                </>
              }
            >
              <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Title" className="sm:col-span-2" hint={<Counter value={a.title} min={30} max={65} />}>
                    <Input value={a.title} onChange={(e) => upd(a.id, { title: e.target.value, slug: a.slug && a.slug !== slugify(a.title) ? a.slug : slugify(e.target.value) })} />
                  </Field>
                  <Field label="URL slug">
                    <Input value={a.slug} onChange={(e) => upd(a.id, { slug: slugify(e.target.value) })} />
                  </Field>
                  <Field label="Category">
                    <Select value={a.category} onChange={(e) => upd(a.id, { category: e.target.value })}>
                      {['Career guidance', 'Study abroad', 'Placements', 'Resume & LinkedIn', 'Interviews', 'Student stories'].map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Excerpt" className="sm:col-span-2" hint="One or two sentences shown under the cover on the blog list.">
                    <Textarea rows={2} value={a.excerpt} onChange={(e) => upd(a.id, { excerpt: e.target.value })} />
                  </Field>
                  <Field label="Cover image" className="sm:col-span-2" hint="1600 × 900 px or larger works at every size.">
                    <div className="flex gap-2">
                      <Input value={a.coverUrl.startsWith('data:') ? 'Uploaded image' : a.coverUrl} onChange={(e) => upd(a.id, { coverUrl: e.target.value })} placeholder="https://… or upload" readOnly={a.coverUrl.startsWith('data:')} />
                      <Button icon={Upload} onClick={() => uploadCover(a.id)}>
                        Upload
                      </Button>
                      {a.coverUrl && <IconButton icon={Trash2} tone="danger" label="Remove image" onClick={() => upd(a.id, { coverUrl: '' })} className="h-10 w-10" />}
                    </div>
                  </Field>
                  <Field label="Alt text" className="sm:col-span-2" hint="Describes the image for screen readers and Google Images.">
                    <Input value={a.coverAlt} onChange={(e) => upd(a.id, { coverAlt: e.target.value })} placeholder="Student presenting a project to two mentors" />
                  </Field>
                  <Field label="Keep in frame">
                    <Select value={a.focal} onChange={(e) => upd(a.id, { focal: e.target.value as 'center' })}>
                      <option value="top">Top of image</option>
                      <option value="center">Centre</option>
                      <option value="bottom">Bottom of image</option>
                    </Select>
                  </Field>
                  <div className="flex items-end pb-2.5 justify-between gap-3">
                    <span className="text-[13.5px] text-[#26355A]">Title over image</span>
                    <Toggle checked={a.overlay} onChange={(v) => upd(a.id, { overlay: v })} label="Title over image" />
                  </div>
                </div>
                <div>
                  <div className="flex items-end gap-3">
                    {cover('16 / 9', 'flex-[1.6]', 'Blog card 16:9')}
                    {cover('1 / 1', 'flex-1', 'Instagram 1:1')}
                  </div>
                  <div className="mt-3">{cover('1.91 / 1', 'w-full', 'Link preview 1.91:1 (WhatsApp, LinkedIn)')}</div>
                  {missing.length > 0 && (
                    <p className="mt-3 text-[12.5px] text-[#94570A] bg-[#FDF1DC] rounded-[8px] px-3 py-2">Still needed: {missing.join(', ')}.</p>
                  )}
                </div>
              </div>
            </Panel>
          );
        })}
      </div>
    );
  }

  /* ---------------- SEO ---------------- */
  if (key === 'seo') {
    const s = content.seo;
    const up = (p: Partial<typeof s>) => set('seo', { ...s, ...p });
    const homeTitle = s.defaultTitle;
    return (
      <div className="space-y-5">
        {header}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_440px] gap-4 items-start">
          <div className="space-y-4">
            <Panel title="Site defaults" description="Used on any page that doesn't set its own.">
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Site name">
                    <Input value={s.siteName} onChange={(e) => up({ siteName: e.target.value })} />
                  </Field>
                  <Field label="Title pattern" hint="%s is replaced by the page title.">
                    <Input value={s.titleTemplate} onChange={(e) => up({ titleTemplate: e.target.value })} />
                  </Field>
                </div>
                <Field label="Homepage title" hint={<Counter value={s.defaultTitle} min={45} max={60} />}>
                  <Input value={s.defaultTitle} onChange={(e) => up({ defaultTitle: e.target.value })} />
                </Field>
                <Field label="Meta description" hint={<Counter value={s.description} min={120} max={160} />}>
                  <Textarea rows={3} value={s.description} onChange={(e) => up({ description: e.target.value })} />
                </Field>
                <Field label="Keywords" hint="Comma separated. Google ignores these, but some site search tools use them.">
                  <Input value={s.keywords} onChange={(e) => up({ keywords: e.target.value })} />
                </Field>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Main website address">
                    <Input value={s.canonical} onChange={(e) => up({ canonical: e.target.value })} />
                  </Field>
                  <Field label="X / Twitter handle">
                    <Input value={s.twitter} onChange={(e) => up({ twitter: e.target.value })} placeholder="@maxicareer" />
                  </Field>
                </div>
                <Field label="Share image" hint="Shown when the site is shared. 1200 × 630 px.">
                  <div className="flex gap-2">
                    <Input value={s.ogImage} onChange={(e) => up({ ogImage: e.target.value })} />
                    <Button icon={Upload} disabled={uploading} onClick={() => uploadImage((url) => up({ ogImage: url }))}>
                      {uploading ? 'Uploading…' : 'Upload'}
                    </Button>
                  </div>
                </Field>
                <div className="flex items-center justify-between">
                  <span className="text-[13.5px] text-[#26355A]">Let search engines index the site</span>
                  <Toggle checked={s.indexable} onChange={(v) => up({ indexable: v })} label="Indexable" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[13.5px] text-[#26355A]">Generate sitemap.xml</span>
                  <Toggle checked={s.sitemap} onChange={(v) => up({ sitemap: v })} label="Sitemap" />
                </div>
                {!s.indexable && <p className="text-[12.5px] text-[#B42F3B] bg-[#FCEBEC] rounded-[8px] px-3 py-2">The whole site will be hidden from Google once published.</p>}
              </div>
            </Panel>
            <Panel title="Page by page" description="Override the title and description for individual pages." actions={<Button size="sm" icon={Plus} onClick={() => up({ pages: [...s.pages, { id: uid('pg'), path: '/new-page', title: '', description: '', noindex: false }] })}>Add page</Button>}>
              <div className="space-y-3">
                {s.pages.map((p) => {
                  const updP = (patch: Partial<typeof p>) => up({ pages: s.pages.map((x) => (x.id === p.id ? { ...x, ...patch } : x)) });
                  return (
                    <div key={p.id} className="rounded-[11px] border border-[#EAEFF6] bg-[#FBFCFE] p-3 grid grid-cols-1 sm:grid-cols-[140px_1fr_auto] gap-2 items-start">
                      <Input value={p.path} onChange={(e) => updP({ path: e.target.value })} className="h-9 mc-num" aria-label="Path" />
                      <div className="space-y-2">
                        <Input value={p.title} onChange={(e) => updP({ title: e.target.value })} placeholder="Page title" className="h-9" aria-label="Page title" />
                        <Input value={p.description} onChange={(e) => updP({ description: e.target.value })} placeholder="Description (optional)" className="h-9" aria-label="Page description" />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] text-[#5B6885]">Hide</span>
                        <Toggle checked={p.noindex} onChange={(v) => updP({ noindex: v })} label="Hide from search" />
                        <IconButton icon={Trash2} tone="danger" label="Remove" onClick={() => up({ pages: s.pages.filter((x) => x.id !== p.id) })} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Panel>
          </div>
          <div className="space-y-4 xl:sticky xl:top-20">
            <Panel title="On Google">
              <div className="rounded-[12px] border border-[#DDE4EF] p-4 bg-white" style={{ fontFamily: 'Arial, sans-serif' }}>
                <div className="flex items-center gap-2">
                  <img src="/images/maxicareer-icon.svg" alt="" className="h-6 w-6 rounded-full border border-[#E2E8F0]" />
                  <div>
                    <div className="text-[13px] text-[#202124]">{s.siteName}</div>
                    <div className="text-[11.5px] text-[#4D5156]">{s.canonical}</div>
                  </div>
                </div>
                <div className="mt-1.5 text-[18px] leading-snug text-[#1A0DAB] line-clamp-1">{homeTitle}</div>
                <div className="text-[13px] text-[#4D5156] leading-snug line-clamp-2">{s.description}</div>
              </div>
            </Panel>
            <Panel title="When shared">
              <div className="rounded-[12px] border border-[#DDE4EF] overflow-hidden bg-[#F0F2F5]">
                <div className="bg-[#E2E8F1]" style={{ aspectRatio: '1.91/1' }}>
                  {s.ogImage && <img src={s.ogImage} alt="" className="w-full h-full object-contain bg-white" />}
                </div>
                <div className="px-3 py-2.5">
                  <div className="text-[11px] uppercase text-[#65676B]">{s.canonical.replace(/^https?:\/\//, '')}</div>
                  <div className="text-[14px] font-semibold text-[#050505] line-clamp-1">{homeTitle}</div>
                  <div className="text-[12.5px] text-[#65676B] line-clamp-1">{s.description}</div>
                </div>
              </div>
            </Panel>
          </div>
        </div>
      </div>
    );
  }

  /* ---------------- Social ---------------- */
  const list = content.social;
  const upd = (id: string, p: Partial<(typeof list)[number]>) => set('social', list.map((x) => (x.id === id ? { ...x, ...p } : x)));
  const available = Object.keys(SOCIAL_ICON).filter((p) => !list.some((s) => s.platform === p));
  return (
    <div className="space-y-5">
      {header}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-4 items-start">
        <Panel flush>
          <div className="hidden md:grid grid-cols-[1fr_80px_80px_80px_40px] gap-3 px-5 py-2.5 text-[12.5px] font-semibold text-[#5B6885] border-b border-[#EAEFF6] bg-[#F7F9FC] rounded-t-[14px]">
            <span>Profile</span>
            <span className="text-center">Show</span>
            <span className="text-center">Footer</span>
            <span className="text-center">Contact</span>
            <span />
          </div>
          <ul className="divide-y divide-[#EAEFF6]">
            {list.map((s) => {
              const Icon = SOCIAL_ICON[s.platform] || Link2;
              const bad = s.url && !isUrl(s.url);
              return (
                <li key={s.id} className="grid grid-cols-1 md:grid-cols-[1fr_80px_80px_80px_40px] gap-3 items-center px-5 py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="h-9 w-9 shrink-0 rounded-[10px] bg-[#0D1B3E] text-white flex items-center justify-center">
                      <Icon className="w-4 h-4" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-semibold text-[#0D1B3E]">{s.platform}</div>
                      <Input value={s.url} onChange={(e) => upd(s.id, { url: e.target.value, visible: e.target.value ? s.visible || isUrl(e.target.value) : false })} placeholder={SOCIAL_PREFIX[s.platform] + '…'} className={cx('h-9 mt-1', bad && 'border-[#E8A1A8]')} aria-label={`${s.platform} URL`} />
                      {bad && <span className="text-[12px] text-[#B42F3B]">Use a full link starting with https://</span>}
                    </div>
                  </div>
                  {(['visible', 'inFooter', 'inContact'] as const).map((k) => (
                    <div key={k} className="flex md:justify-center items-center gap-2">
                      <span className="md:hidden text-[12.5px] text-[#5B6885] w-16">{k === 'visible' ? 'Show' : k === 'inFooter' ? 'Footer' : 'Contact'}</span>
                      <Toggle checked={s[k]} onChange={(v) => upd(s.id, { [k]: v })} disabled={!s.url || !!bad} label={`${s.platform} ${k}`} />
                    </div>
                  ))}
                  <IconButton icon={Trash2} tone="danger" label={`Remove ${s.platform}`} onClick={() => set('social', list.filter((x) => x.id !== s.id))} />
                </li>
              );
            })}
          </ul>
          {available.length > 0 && (
            <div className="flex flex-wrap gap-2 px-5 py-4 border-t border-[#EAEFF6]">
              {available.map((p) => {
                const I = SOCIAL_ICON[p];
                return (
                  <Button key={p} size="sm" icon={I} onClick={() => set('social', [...list, { id: uid('so'), platform: p, url: '', visible: false, inFooter: true, inContact: false }])}>
                    Add {p}
                  </Button>
                );
              })}
            </div>
          )}
        </Panel>
        <Panel title="Preview">
          <p className="text-[12.5px] text-[#5B6885] mb-2">Footer</p>
          <div className="rounded-[12px] bg-[#0F172A] p-4 flex gap-2.5">
            {list.filter((s) => s.visible && s.inFooter && s.url).length === 0 && <span className="text-[12px] text-[#64748B]">No icons yet</span>}
            {list
              .filter((s) => s.visible && s.inFooter && s.url)
              .map((s) => {
                const I = SOCIAL_ICON[s.platform] || Link2;
                return (
                  <span key={s.id} className="h-8 w-8 rounded-full bg-[#1E293B] text-white flex items-center justify-center" title={s.platform}>
                    <I className="w-4 h-4" />
                  </span>
                );
              })}
          </div>
          <p className="text-[12.5px] text-[#5B6885] mt-4 mb-2">Contact page</p>
          <div className="rounded-[12px] border border-[#DDE4EF] p-3 space-y-2">
            {list.filter((s) => s.visible && s.inContact && s.url).length === 0 && <span className="text-[12px] text-[#7A869E]">Nothing shown</span>}
            {list
              .filter((s) => s.visible && s.inContact && s.url)
              .map((s) => {
                const I = SOCIAL_ICON[s.platform] || Link2;
                return (
                  <div key={s.id} className="flex items-center gap-2 text-[12.5px] text-[#334155] min-w-0">
                    <I className="w-4 h-4 text-[#2563EB] shrink-0" />
                    <span className="truncate">{s.url.replace(/^https?:\/\/(www\.)?/, '')}</span>
                  </div>
                );
              })}
          </div>
        </Panel>
      </div>
    </div>
  );
};
