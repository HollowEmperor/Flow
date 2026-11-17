import React, { useState, useRef } from 'react';
import {
  Award,
  BadgeCheck,
  Briefcase,
  Camera,
  CheckCircle2,
  Crown,
  Image as ImageIcon,
  Medal,
  Plus,
  Sparkles,
  Trash2,
  Upload,
  Wrench,
} from 'lucide-react';
import { TopicItem, computeTopicProgressPercent } from '../utils/todoLogic';

export type MasteryPathwayType =
  | 'skill'
  | 'certificate_medal'
  | 'title_position';

export interface MasteryPhotoAttachment {
  id: string;
  url: string;
  caption: string;
  uploadedAt: string;
}

export interface TopicMasteryRecord {
  topicId: string;
  primaryPathway: MasteryPathwayType;
  // Option 1: Gain a Skill
  skillEnabled: boolean;
  skillName: string;
  skillProficiency: 'Foundational' | 'Practitioner' | 'Master';
  skillProofNote: string;
  skillUnlocked: boolean;

  // Option 2: Gain a Certificate, Medal, or Plaque with Attached Photos
  awardEnabled: boolean;
  awardKind: 'Certificate' | 'Medal' | 'Plaque';
  awardTitle: string;
  awardIssuer: string;
  awardPhotos: MasteryPhotoAttachment[];
  awardUnlocked: boolean;

  // Option 3: Gain a New Title or Position
  titlePositionEnabled: boolean;
  titlePositionKind: 'Title' | 'Position';
  titlePositionName: string;
  titlePositionOrg: string;
  titlePositionUnlocked: boolean;
}

const MASTERY_STORAGE_KEY = 'focusflow_topic_mastery_v1';

// Built-in crisp SVG data URLs so sample certificates/medals render real visual previews out of the box
const SAMPLE_CERTIFICATE_SVG_DATA_URL =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='640' height='420' viewBox='0 0 640 420'><rect width='640' height='420' fill='%23F8FAFC'/><rect x='20' y='20' width='600' height='380' rx='16' fill='%23FFFFFF' stroke='%231E293B' stroke-width='6'/><rect x='36' y='36' width='568' height='348' rx='10' fill='none' stroke='%232563EB' stroke-width='2'/><rect x='220' y='64' width='200' height='28' rx='6' fill='%23DBEAFE'/><text x='320' y='83' text-anchor='middle' font-family='sans-serif' font-size='13' font-weight='bold' fill='%231E40AF'>CERTIFICATE OF MASTERY</text><text x='320' y='145' text-anchor='middle' font-family='serif' font-size='26' font-weight='bold' fill='%230F172A'>Systems Architecture &amp; TypeScript</text><text x='320' y='185' text-anchor='middle' font-family='sans-serif' font-size='14' fill='%23475569'>Verified Topic Completion &amp; Production Capstone</text><circle cx='320' cy='275' r='38' fill='%23059669'/><circle cx='320' cy='275' r='28' fill='none' stroke='%23FFFFFF' stroke-width='2'/><text x='320' y='280' text-anchor='middle' font-family='sans-serif' font-size='12' font-weight='bold' fill='%23FFFFFF'>VERIFIED</text><line x1='120' y1='340' x2='240' y2='340' stroke='%2394A3B8' stroke-width='2'/><line x1='400' y1='340' x2='520' y2='340' stroke='%2394A3B8' stroke-width='2'/></svg>";

const SAMPLE_MEDAL_SVG_DATA_URL =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='640' height='420' viewBox='0 0 640 420'><rect width='640' height='420' fill='%230F172A'/><rect x='24' y='24' width='592' height='372' rx='18' fill='%231E293B' stroke='%236D28D9' stroke-width='4'/><polygon points='270,40 310,40 335,155 295,155' fill='%232563EB'/><polygon points='370,40 330,40 305,155 345,155' fill='%23059669'/><circle cx='320' cy='220' r='74' fill='%237C3AED' stroke='%23F8FAFC' stroke-width='5'/><circle cx='320' cy='220' r='56' fill='%236D28D9' stroke='%23A78BFA' stroke-width='2'/><text x='320' y='215' text-anchor='middle' font-family='sans-serif' font-size='15' font-weight='bold' fill='%23FFFFFF'>HONOR MEDAL</text><text x='320' y='238' text-anchor='middle' font-family='monospace' font-size='12' fill='%23D8B4FE'>100% MASTERY</text><text x='320' y='345' text-anchor='middle' font-family='sans-serif' font-size='18' font-weight='bold' fill='%23F8FAFC'>Endurance &amp; Strength Conditioning Medal</text></svg>";

export function getDefaultMasteryRecordForTopic(
  topic: TopicItem
): TopicMasteryRecord {
  const isComplete = computeTopicProgressPercent(topic) >= 100;

  if (topic.id === 'topic-seed-1') {
    return {
      topicId: topic.id,
      primaryPathway: 'skill',
      skillEnabled: true,
      skillName: 'Full-Stack Distributed Systems & TypeScript Architecture',
      skillProficiency: 'Master',
      skillProofNote:
        'Able to architect fault-tolerant state machines and zero-latency reactive interfaces.',
      skillUnlocked: true,
      awardEnabled: true,
      awardKind: 'Certificate',
      awardTitle: 'Advanced Systems Engineering Certificate',
      awardIssuer: 'FocusFlow Technical Guild',
      awardPhotos: [
        {
          id: 'photo-seed-cert-1',
          url: SAMPLE_CERTIFICATE_SVG_DATA_URL,
          caption: 'Official Systems Architecture Certificate',
          uploadedAt: '2026-11-14',
        },
      ],
      awardUnlocked: true,
      titlePositionEnabled: true,
      titlePositionKind: 'Position',
      titlePositionName: 'Principal Systems Architect',
      titlePositionOrg: 'Engineering Leadership Track',
      titlePositionUnlocked: isComplete,
    };
  }

  if (topic.id === 'topic-seed-2') {
    return {
      topicId: topic.id,
      primaryPathway: 'certificate_medal',
      skillEnabled: true,
      skillName: 'Applied Machine Learning & Quantitative Modeling',
      skillProficiency: 'Practitioner',
      skillProofNote:
        'Can train, evaluate, and deploy gradient-boosted & neural pipelines.',
      skillUnlocked: isComplete,
      awardEnabled: true,
      awardKind: 'Certificate',
      awardTitle: 'Machine Learning Specialization Certificate',
      awardIssuer: 'DeepLearning & Quantitative Institute',
      awardPhotos: [
        {
          id: 'photo-seed-cert-2',
          url: SAMPLE_CERTIFICATE_SVG_DATA_URL,
          caption: 'Completed Specialization Certificate Photo',
          uploadedAt: '2026-11-14',
        },
      ],
      awardUnlocked: isComplete,
      titlePositionEnabled: true,
      titlePositionKind: 'Title',
      titlePositionName: 'AI Research & Knowledge Fellow',
      titlePositionOrg: 'Man of Knowledge 30Y Track',
      titlePositionUnlocked: isComplete,
    };
  }

  if (topic.id === 'topic-seed-3') {
    return {
      topicId: topic.id,
      primaryPathway: 'title_position',
      skillEnabled: true,
      skillName: 'High-VO2 Max Athletic Conditioning & Recovery',
      skillProficiency: 'Practitioner',
      skillProofNote:
        'Sustained zone-2 endurance and progressive overload discipline.',
      skillUnlocked: isComplete,
      awardEnabled: true,
      awardKind: 'Medal',
      awardTitle: '10K Finisher & Strength Conditioning Medal',
      awardIssuer: 'City Athletic Federation',
      awardPhotos: [
        {
          id: 'photo-seed-medal-1',
          url: SAMPLE_MEDAL_SVG_DATA_URL,
          caption: 'Finisher Medal Photo Attachment',
          uploadedAt: '2026-11-14',
        },
      ],
      awardUnlocked: true,
      titlePositionEnabled: true,
      titlePositionKind: 'Title',
      titlePositionName: 'Disciplined Endurance Athlete',
      titlePositionOrg: 'Strength & Vitality Pillar',
      titlePositionUnlocked: true,
    };
  }

  return {
    topicId: topic.id,
    primaryPathway: 'skill',
    skillEnabled: true,
    skillName: `${topic.title} Mastery Skill`,
    skillProficiency: 'Practitioner',
    skillProofNote: `Completed ${topic.goalLabel}`,
    skillUnlocked: isComplete,
    awardEnabled: true,
    awardKind: 'Certificate',
    awardTitle: `${topic.title} Completion Certificate`,
    awardIssuer: `${topic.lifeArea} Academy`,
    awardPhotos: [],
    awardUnlocked: isComplete,
    titlePositionEnabled: true,
    titlePositionKind: 'Title',
    titlePositionName: `${topic.lifeArea} Specialist`,
    titlePositionOrg: 'Personal Mastery Track',
    titlePositionUnlocked: isComplete,
  };
}

export function loadTopicMasteryMap(
  topics: TopicItem[]
): Record<string, TopicMasteryRecord> {
  let stored: Record<string, TopicMasteryRecord> = {};
  try {
    const raw = localStorage.getItem(MASTERY_STORAGE_KEY);
    if (raw) {
      stored = JSON.parse(raw);
    }
  } catch {
    stored = {};
  }

  const merged: Record<string, TopicMasteryRecord> = { ...stored };
  for (const t of topics) {
    if (!merged[t.id]) {
      merged[t.id] = getDefaultMasteryRecordForTopic(t);
    }
  }
  return merged;
}

export function saveTopicMasteryMap(
  map: Record<string, TopicMasteryRecord>
): void {
  try {
    localStorage.setItem(MASTERY_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // Ignore storage quota issues
  }
}

// ============================================================================
// 1. Overview Cabinet: Shows All Gained Skills, Certificates/Medals (with Photos), and Titles/Positions
// ============================================================================
interface TopicMasteryOverviewCabinetProps {
  topics: TopicItem[];
  masteryMap: Record<string, TopicMasteryRecord>;
  onSelectTopic: (topicId: string) => void;
}

export const TopicMasteryOverviewCabinet: React.FC<
  TopicMasteryOverviewCabinetProps
> = ({ topics, masteryMap, onSelectTopic }) => {
  const [activeTab, setActiveTab] = useState<
    'all' | 'skill' | 'certificate_medal' | 'title_position'
  >('all');
  const [lightboxPhoto, setLightboxPhoto] = useState<{
    url: string;
    caption: string;
    awardTitle: string;
  } | null>(null);

  const records = topics.map((topic) => ({
    topic,
    record: masteryMap[topic.id] ?? getDefaultMasteryRecordForTopic(topic),
    progressPct: computeTopicProgressPercent(topic),
  }));

  const unlockedSkills = records.filter(
    (r) => r.record.skillUnlocked || r.progressPct >= 100
  );
  const unlockedAwards = records.filter(
    (r) =>
      r.record.awardUnlocked ||
      r.record.awardPhotos.length > 0 ||
      r.progressPct >= 100
  );
  const unlockedTitles = records.filter(
    (r) => r.record.titlePositionUnlocked || r.progressPct >= 100
  );

  return (
    <section
      aria-label="Topic Mastery Verification & Outcomes Cabinet"
      data-testid="topic-mastery-overview-cabinet"
      className="bg-white border border-slate-200 rounded-2xl overflow-hidden"
    >
      {/* Solid Dark Header Strip */}
      <div className="bg-slate-900 text-white px-5 py-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-wider mb-1">
            <Sparkles className="w-3 h-3" aria-hidden="true" />
            <span>3 Ways to Know You Have Mastered a Topic</span>
          </div>
          <h2 className="text-base sm:text-lg font-bold font-display">
            Topic Completion: Certificates, Medals &amp; Plaques · Titles &amp; Positions · Skills
          </h2>
          <p className="text-xs text-slate-300 mt-0.5">
            Topics are areas you learn by working towards a certain Goal — completed by Certificate, Medal, Plaque (with attached photos), Title, or Position.
          </p>
        </div>

        {/* 3-Pathway Filter Tabs */}
        <div
          role="tablist"
          aria-label="Filter mastery achievements"
          className="flex flex-wrap items-center gap-1 bg-slate-800 p-1 rounded-xl"
        >
          {(
            [
              {
                id: 'all',
                label: 'All 3 Proofs',
                activeClass: 'bg-white text-slate-900',
              },
              {
                id: 'skill',
                label: `1. Skills (${unlockedSkills.length})`,
                activeClass: 'bg-emerald-600 text-white',
              },
              {
                id: 'certificate_medal',
                label: `2. Certs & Medals (${unlockedAwards.length})`,
                activeClass: 'bg-blue-600 text-white',
              },
              {
                id: 'title_position',
                label: `3. Titles & Positions (${unlockedTitles.length})`,
                activeClass: 'bg-purple-700 text-white',
              },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === tab.id
                  ? tab.activeClass
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3 Mastery Columns Grid */}
      <div className="p-4 sm:p-5 grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Column 1: Gained Skills */}
        {(activeTab === 'all' || activeTab === 'skill') && (
          <div
            data-testid="mastery-pillar-skills"
            className={`bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 ${
              activeTab === 'skill' ? 'lg:col-span-3' : ''
            }`}
          >
            <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <Wrench className="w-4 h-4" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    1. Gained Skills
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Capabilities unlocked by topic mastery
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900">
                {unlockedSkills.length}/{records.length}
              </span>
            </div>

            <div className="space-y-2">
              {records.map(({ topic, record, progressPct }) => {
                const isClaimed = record.skillUnlocked || progressPct >= 100;
                return (
                  <div
                    key={topic.id}
                    onClick={() => onSelectTopic(topic.id)}
                    className={`p-3 rounded-xl border transition-colors cursor-pointer ${
                      isClaimed
                        ? 'bg-white border-emerald-300 hover:border-emerald-500'
                        : 'bg-white/60 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-bold text-slate-900">
                        {record.skillName}
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded shrink-0 ${
                          isClaimed
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {isClaimed ? record.skillProficiency : `${progressPct}%`}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1 line-clamp-2">
                      {record.skillProofNote}
                    </p>
                    <div className="mt-1.5 text-[10px] font-semibold text-emerald-700">
                      Topic: {topic.title}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Column 2: Certificates & Medals (with Photo Attachments) */}
        {(activeTab === 'all' || activeTab === 'certificate_medal') && (
          <div
            data-testid="mastery-pillar-certificates-medals"
            className={`bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 ${
              activeTab === 'certificate_medal' ? 'lg:col-span-3' : ''
            }`}
          >
            <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
                  <Medal className="w-4 h-4" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    2. Certificates &amp; Medals
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Attach photos of your certificates or medals
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-900">
                {unlockedAwards.length}/{records.length}
              </span>
            </div>

            <div className="space-y-2.5">
              {records.map(({ topic, record, progressPct }) => {
                const isClaimed =
                  record.awardUnlocked ||
                  record.awardPhotos.length > 0 ||
                  progressPct >= 100;
                return (
                  <div
                    key={topic.id}
                    className={`p-3 rounded-xl border transition-colors ${
                      isClaimed
                        ? 'bg-white border-blue-300'
                        : 'bg-white/60 border-slate-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => onSelectTopic(topic.id)}
                        className="text-left group cursor-pointer"
                      >
                        <span className="text-xs font-bold text-slate-900 group-hover:text-blue-700">
                          {record.awardTitle}
                        </span>
                        <span className="block text-[11px] text-slate-500">
                          {record.awardIssuer} · Topic: {topic.title}
                        </span>
                      </button>
                      <span
                        className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded shrink-0 ${
                          record.awardKind === 'Medal'
                            ? 'bg-purple-700 text-white'
                            : 'bg-blue-600 text-white'
                        }`}
                      >
                        {record.awardKind}
                      </span>
                    </div>

                    {/* Attached Photos Thumbnail Strip */}
                    {record.awardPhotos.length > 0 ? (
                      <div className="mt-2.5 flex items-center gap-2 overflow-x-auto pb-1">
                        {record.awardPhotos.map((photo) => (
                          <button
                            key={photo.id}
                            type="button"
                            onClick={() =>
                              setLightboxPhoto({
                                url: photo.url,
                                caption: photo.caption,
                                awardTitle: record.awardTitle,
                              })
                            }
                            className="group relative w-20 h-14 rounded-lg overflow-hidden border border-slate-300 hover:border-blue-600 shrink-0 bg-slate-900 cursor-pointer"
                            title="Click to inspect attached certificate/medal photo"
                          >
                            <img
                              src={photo.url}
                              alt={photo.caption}
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => onSelectTopic(topic.id)}
                          className="px-2.5 py-1.5 rounded-lg border border-dashed border-blue-300 text-blue-700 hover:bg-blue-50 text-[11px] font-semibold flex items-center gap-1 shrink-0 cursor-pointer"
                        >
                          <Camera className="w-3 h-3" aria-hidden="true" />
                          <span>+ Photo</span>
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onSelectTopic(topic.id)}
                        className="mt-2 w-full py-1.5 px-2.5 rounded-lg border border-dashed border-slate-300 hover:border-blue-500 text-[11px] font-semibold text-blue-700 hover:bg-blue-50 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Camera className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Open Topic to Attach {record.awardKind} Photo</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Column 3: New Titles & Positions */}
        {(activeTab === 'all' || activeTab === 'title_position') && (
          <div
            data-testid="mastery-pillar-titles-positions"
            className={`bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 ${
              activeTab === 'title_position' ? 'lg:col-span-3' : ''
            }`}
          >
            <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-purple-700 text-white flex items-center justify-center shrink-0">
                  <Crown className="w-4 h-4" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    3. New Titles &amp; Positions
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Identity &amp; role elevation upon completion
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-purple-100 text-purple-900">
                {unlockedTitles.length}/{records.length}
              </span>
            </div>

            <div className="space-y-2">
              {records.map(({ topic, record, progressPct }) => {
                const isClaimed =
                  record.titlePositionUnlocked || progressPct >= 100;
                return (
                  <div
                    key={topic.id}
                    onClick={() => onSelectTopic(topic.id)}
                    className={`p-3 rounded-xl border transition-colors cursor-pointer ${
                      isClaimed
                        ? 'bg-white border-purple-300 hover:border-purple-500'
                        : 'bg-white/60 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-bold text-slate-900">
                        {record.titlePositionName}
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded shrink-0 ${
                          isClaimed
                            ? 'bg-purple-700 text-white'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {record.titlePositionKind}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1">
                      {record.titlePositionOrg}
                    </p>
                    <div className="mt-1.5 flex items-center justify-between text-[10px] font-semibold">
                      <span className="text-purple-700">Topic: {topic.title}</span>
                      <span className="font-mono text-slate-500">
                        {isClaimed ? 'EARNED' : `${progressPct}%`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Lightbox Modal for Inspecting Attached Certificate / Medal Photo */}
      {lightboxPhoto && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={lightboxPhoto.awardTitle}
          className="fixed inset-0 z-50 bg-slate-900/80 flex items-center justify-center p-4"
          onClick={() => setLightboxPhoto(null)}
        >
          <div
            className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full overflow-hidden shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold">{lightboxPhoto.awardTitle}</h3>
                <p className="text-xs text-slate-300">{lightboxPhoto.caption}</p>
              </div>
              <button
                type="button"
                onClick={() => setLightboxPhoto(null)}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
            <div className="p-4 bg-slate-100 flex items-center justify-center">
              <img
                src={lightboxPhoto.url}
                alt={lightboxPhoto.caption}
                className="max-h-[420px] w-auto rounded-lg border border-slate-300"
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

// ============================================================================
// 2. Per-Topic Mastery Verification Studio (Inside Topic Detail View)
// ============================================================================
interface TopicMasteryStudioProps {
  topic: TopicItem;
  record: TopicMasteryRecord;
  onUpdateRecord: (updated: TopicMasteryRecord) => void;
  onMarkTopic100Percent?: () => void;
}

export const TopicMasteryStudio: React.FC<TopicMasteryStudioProps> = ({
  topic,
  record,
  onUpdateRecord,
  onMarkTopic100Percent,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [photoUrlInput, setPhotoUrlInput] = useState('');
  const [photoCaptionInput, setPhotoCaptionInput] = useState('');

  const progressPct = computeTopicProgressPercent(topic);
  const isTopicFullyCompleted =
    progressPct >= 100 ||
    record.skillUnlocked ||
    record.awardUnlocked ||
    record.titlePositionUnlocked;

  const handlePhotoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          const newPhoto: MasteryPhotoAttachment = {
            id: `photo-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            url: reader.result,
            caption:
              photoCaptionInput.trim() ||
              `${record.awardKind}: ${file.name.replace(/\.[^.]+$/, '')}`,
            uploadedAt: new Date().toISOString().slice(0, 10),
          };
          onUpdateRecord({
            ...record,
            awardPhotos: [...record.awardPhotos, newPhoto],
            awardUnlocked: true,
          });
          setPhotoCaptionInput('');
        }
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
  };

  const handleAddPhotoByUrl = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUrl = photoUrlInput.trim();
    if (!cleanUrl) return;

    const newPhoto: MasteryPhotoAttachment = {
      id: `photo-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      url: cleanUrl,
      caption:
        photoCaptionInput.trim() ||
        `${record.awardKind} Photo (${record.awardTitle})`,
      uploadedAt: new Date().toISOString().slice(0, 10),
    };

    onUpdateRecord({
      ...record,
      awardPhotos: [...record.awardPhotos, newPhoto],
      awardUnlocked: true,
    });
    setPhotoUrlInput('');
    setPhotoCaptionInput('');
  };

  const handleDeletePhoto = (photoId: string) => {
    onUpdateRecord({
      ...record,
      awardPhotos: record.awardPhotos.filter((p) => p.id !== photoId),
    });
  };

  const handleCompleteAndUnlockAll = () => {
    if (onMarkTopic100Percent) {
      onMarkTopic100Percent();
    }
    onUpdateRecord({
      ...record,
      skillUnlocked: true,
      awardUnlocked: true,
      titlePositionUnlocked: true,
    });
  };

  return (
    <section
      aria-label="Topic Mastery Verification Options"
      data-testid="topic-mastery-studio"
      className="bg-white border border-slate-200 rounded-2xl overflow-hidden"
    >
      {/* Top Banner */}
      <div className="bg-slate-900 text-white px-5 py-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-wider">
              Topic Mastery Verification
            </span>
            <span className="text-xs font-mono text-slate-300">
              Progress: {progressPct}%
            </span>
          </div>
          <h2 className="text-base sm:text-lg font-bold font-display mt-1">
            How You Know You Have Mastered &ldquo;{topic.title}&rdquo;
          </h2>
          <p className="text-xs text-slate-300 mt-0.5">
            Achieve mastery through any or all of these 3 outcomes: Gain a Skill, Earn a Certificate/Medal (with photos), or Gain a New Title/Position.
          </p>
        </div>

        <button
          type="button"
          data-testid="claim-all-topic-mastery-btn"
          onClick={handleCompleteAndUnlockAll}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
            isTopicFullyCompleted
              ? 'bg-emerald-600 text-white'
              : 'bg-blue-600 hover:bg-blue-500 text-white'
          }`}
        >
          <BadgeCheck className="w-4 h-4" aria-hidden="true" />
          <span>
            {isTopicFullyCompleted
              ? 'Topic Mastery Verified (All 3 Unlocked)'
              : 'Complete Topic & Unlock Mastery Proofs'}
          </span>
        </button>
      </div>

      {/* Three Mastery Options Cards */}
      <div className="p-5 grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* OPTION 1: GAIN A SKILL */}
        <div
          data-testid="topic-mastery-option-skill"
          className={`rounded-2xl border p-4 flex flex-col justify-between space-y-4 ${
            record.skillUnlocked
              ? 'bg-emerald-50/40 border-emerald-400'
              : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <Wrench className="w-4 h-4" aria-hidden="true" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
                    Option 1 · Skill Outcome
                  </span>
                  <h3 className="text-sm font-bold text-slate-900">
                    Gain a Skill
                  </h3>
                </div>
              </div>

              <button
                type="button"
                data-testid="toggle-skill-mastery-btn"
                onClick={() =>
                  onUpdateRecord({
                    ...record,
                    skillUnlocked: !record.skillUnlocked,
                  })
                }
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                  record.skillUnlocked
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white border border-slate-300 text-slate-700 hover:bg-emerald-50'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{record.skillUnlocked ? 'Skill Gained' : 'Mark Gained'}</span>
              </button>
            </div>

            <div className="space-y-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Skill You Gain Upon Completion
                </label>
                <input
                  type="text"
                  data-testid="mastery-skill-name-input"
                  value={record.skillName}
                  onChange={(e) =>
                    onUpdateRecord({ ...record, skillName: e.target.value })
                  }
                  placeholder="e.g., Distributed Systems Engineering"
                  className="w-full px-3 py-1.5 text-xs font-semibold text-slate-900 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Mastery Tier
                </label>
                <div className="grid grid-cols-3 gap-1">
                  {(['Foundational', 'Practitioner', 'Master'] as const).map(
                    (tier) => (
                      <button
                        key={tier}
                        type="button"
                        onClick={() =>
                          onUpdateRecord({ ...record, skillProficiency: tier })
                        }
                        className={`py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                          record.skillProficiency === tier
                            ? 'bg-emerald-600 text-white'
                            : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {tier}
                      </button>
                    )
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  How You Prove This Skill in Action
                </label>
                <textarea
                  rows={2}
                  value={record.skillProofNote}
                  onChange={(e) =>
                    onUpdateRecord({
                      ...record,
                      skillProofNote: e.target.value,
                    })
                  }
                  placeholder="What can you build, solve, or execute now?"
                  className="w-full px-3 py-1.5 text-xs text-slate-800 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-600"
                />
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Status:</span>
            <span
              className={`font-bold ${
                record.skillUnlocked ? 'text-emerald-700' : 'text-slate-500'
              }`}
            >
              {record.skillUnlocked
                ? `Unlocked (${record.skillProficiency})`
                : 'In Progress'}
            </span>
          </div>
        </div>

        {/* OPTION 2: CERTIFICATE OR MEDAL + ATTACHED PHOTOS */}
        <div
          data-testid="topic-mastery-option-certificate-medal"
          className={`rounded-2xl border p-4 flex flex-col justify-between space-y-4 ${
            record.awardUnlocked
              ? 'bg-blue-50/40 border-blue-400'
              : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                  <Award className="w-4 h-4" aria-hidden="true" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800 block">
                    Option 2 · Tangible Credential
                  </span>
                  <h3 className="text-sm font-bold text-slate-900">
                    Certificate, Medal, or Plaque + Photos
                  </h3>
                </div>
              </div>

              <button
                type="button"
                data-testid="toggle-award-mastery-btn"
                onClick={() =>
                  onUpdateRecord({
                    ...record,
                    awardUnlocked: !record.awardUnlocked,
                  })
                }
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                  record.awardUnlocked
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-slate-300 text-slate-700 hover:bg-blue-50'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                <span>
                  {record.awardUnlocked
                    ? `${record.awardKind} Earned`
                    : 'Mark Earned'}
                </span>
              </button>
            </div>

            {/* Switch between Certificate, Medal, and Plaque */}
            <div className="grid grid-cols-3 gap-1.5 bg-white p-1 rounded-xl border border-slate-200">
              {(['Certificate', 'Medal', 'Plaque'] as const).map((kind) => (
                <button
                  key={kind}
                  type="button"
                  data-testid={`select-award-kind-${kind.toLowerCase()}`}
                  onClick={() =>
                    onUpdateRecord({ ...record, awardKind: kind })
                  }
                  className={`py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                    record.awardKind === kind
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {kind === 'Certificate' ? (
                    <Award className="w-3.5 h-3.5" aria-hidden="true" />
                  ) : (
                    <Medal className="w-3.5 h-3.5" aria-hidden="true" />
                  )}
                  <span>{kind}</span>
                </button>
              ))}
            </div>

            <div className="space-y-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  {record.awardKind} Title
                </label>
                <input
                  type="text"
                  value={record.awardTitle}
                  onChange={(e) =>
                    onUpdateRecord({ ...record, awardTitle: e.target.value })
                  }
                  placeholder={`e.g., ${topic.title} ${record.awardKind}`}
                  className="w-full px-3 py-1.5 text-xs font-semibold text-slate-900 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Issuing Organization / Event
                </label>
                <input
                  type="text"
                  value={record.awardIssuer}
                  onChange={(e) =>
                    onUpdateRecord({ ...record, awardIssuer: e.target.value })
                  }
                  placeholder="e.g., Coursera, University, Federation"
                  className="w-full px-3 py-1.5 text-xs text-slate-800 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
                />
              </div>

              {/* Photo Attachment Controls */}
              <div className="pt-1 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                    <Camera
                      className="w-3.5 h-3.5 text-blue-600"
                      aria-hidden="true"
                    />
                    <span>
                      Attached {record.awardKind} Photos (
                      {record.awardPhotos.length})
                    </span>
                  </span>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoFileUpload}
                    className="hidden"
                    data-testid="mastery-photo-file-input"
                  />
                  <button
                    type="button"
                    data-testid="upload-mastery-photo-btn"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Upload className="w-3 h-3" aria-hidden="true" />
                    <span>Upload Photo</span>
                  </button>
                </div>

                {/* Optional Image URL Input + Caption */}
                <form
                  onSubmit={handleAddPhotoByUrl}
                  className="flex items-center gap-1.5"
                >
                  <input
                    type="text"
                    value={photoUrlInput}
                    onChange={(e) => setPhotoUrlInput(e.target.value)}
                    placeholder={`Or paste ${record.awardKind.toLowerCase()} photo URL...`}
                    aria-label="Paste certificate or medal photo URL"
                    className="flex-1 px-2.5 py-1 text-xs text-slate-800 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
                  />
                  <button
                    type="submit"
                    data-testid="attach-photo-url-btn"
                    className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    <Plus className="w-3 h-3" aria-hidden="true" />
                    <span>Attach</span>
                  </button>
                </form>

                {/* Attached Photos Gallery */}
                {record.awardPhotos.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    {record.awardPhotos.map((photo) => (
                      <div
                        key={photo.id}
                        data-testid={`attached-award-photo-${photo.id}`}
                        className="group relative rounded-xl overflow-hidden border border-slate-300 bg-white"
                      >
                        <img
                          src={photo.url}
                          alt={photo.caption}
                          className="w-full h-24 object-cover bg-slate-900"
                        />
                        <div className="p-1.5 flex items-center justify-between gap-1 bg-white">
                          <span className="text-[10px] font-medium text-slate-700 truncate">
                            {photo.caption}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDeletePhoto(photo.id)}
                            aria-label={`Remove photo ${photo.caption}`}
                            className="p-1 text-slate-400 hover:text-red-600 rounded cursor-pointer shrink-0"
                          >
                            <Trash2 className="w-3 h-3" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-3 px-3 rounded-xl border border-dashed border-slate-300 bg-white/70 text-center text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      No photos attached yet — upload a photo of your{' '}
                      {record.awardKind.toLowerCase()} above.
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Credential Proof:</span>
            <span
              className={`font-bold ${
                record.awardUnlocked ? 'text-blue-700' : 'text-slate-500'
              }`}
            >
              {record.awardUnlocked
                ? `${record.awardKind} Verified (${record.awardPhotos.length} photo${record.awardPhotos.length === 1 ? '' : 's'})`
                : 'Awaiting Completion'}
            </span>
          </div>
        </div>

        {/* OPTION 3: NEW TITLE OR POSITION */}
        <div
          data-testid="topic-mastery-option-title-position"
          className={`rounded-2xl border p-4 flex flex-col justify-between space-y-4 ${
            record.titlePositionUnlocked
              ? 'bg-purple-50/40 border-purple-400'
              : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-700 text-white flex items-center justify-center shrink-0">
                  <Crown className="w-4 h-4" aria-hidden="true" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-800 block">
                    Option 3 · Status &amp; Role Elevation
                  </span>
                  <h3 className="text-sm font-bold text-slate-900">
                    New Title or Position
                  </h3>
                </div>
              </div>

              <button
                type="button"
                data-testid="toggle-title-position-mastery-btn"
                onClick={() =>
                  onUpdateRecord({
                    ...record,
                    titlePositionUnlocked: !record.titlePositionUnlocked,
                  })
                }
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                  record.titlePositionUnlocked
                    ? 'bg-purple-700 text-white'
                    : 'bg-white border border-slate-300 text-slate-700 hover:bg-purple-50'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                <span>
                  {record.titlePositionUnlocked
                    ? `${record.titlePositionKind} Earned`
                    : 'Mark Earned'}
                </span>
              </button>
            </div>

            {/* Switch between Title and Position */}
            <div className="grid grid-cols-2 gap-1.5 bg-white p-1 rounded-xl border border-slate-200">
              {(['Title', 'Position'] as const).map((kind) => (
                <button
                  key={kind}
                  type="button"
                  data-testid={`select-role-kind-${kind.toLowerCase()}`}
                  onClick={() =>
                    onUpdateRecord({ ...record, titlePositionKind: kind })
                  }
                  className={`py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                    record.titlePositionKind === kind
                      ? 'bg-purple-700 text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {kind === 'Title' ? (
                    <Crown className="w-3.5 h-3.5" aria-hidden="true" />
                  ) : (
                    <Briefcase className="w-3.5 h-3.5" aria-hidden="true" />
                  )}
                  <span>New {kind}</span>
                </button>
              ))}
            </div>

            <div className="space-y-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  New {record.titlePositionKind} Name
                </label>
                <input
                  type="text"
                  data-testid="mastery-title-position-input"
                  value={record.titlePositionName}
                  onChange={(e) =>
                    onUpdateRecord({
                      ...record,
                      titlePositionName: e.target.value,
                    })
                  }
                  placeholder={
                    record.titlePositionKind === 'Title'
                      ? 'e.g., Principal Fellow / Master Orator'
                      : 'e.g., Team Lead / Advisory Board Member'
                  }
                  className="w-full px-3 py-1.5 text-xs font-semibold text-slate-900 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-purple-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Organization, Community, or 30-Year Identity Track
                </label>
                <input
                  type="text"
                  value={record.titlePositionOrg}
                  onChange={(e) =>
                    onUpdateRecord({
                      ...record,
                      titlePositionOrg: e.target.value,
                    })
                  }
                  placeholder="e.g., Engineering Guild / Civic Leadership"
                  className="w-full px-3 py-1.5 text-xs text-slate-800 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-purple-600"
                />
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Elevation Status:</span>
            <span
              className={`font-bold ${
                record.titlePositionUnlocked
                  ? 'text-purple-700'
                  : 'text-slate-500'
              }`}
            >
              {record.titlePositionUnlocked
                ? `Active ${record.titlePositionKind}: ${record.titlePositionName}`
                : 'Unlocked upon topic completion'}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
