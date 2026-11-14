import React, { useState, useMemo, useEffect } from 'react';
import {
  Users,
  Building2,
  Flame,
  Plus,
  CheckCircle2,
  Calendar,
  ArrowUpRight,
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import {
  Category,
  LIFE_AREAS,
  RelationshipCadence,
  RelationshipContact,
  OrganizationCategory,
  OrganizationItem,
} from '../utils/todoLogic';
import { DAYS_OF_WEEK } from '../utils/promptQuestionsData';

interface RelationshipOrgDashboardProps {
  contacts: RelationshipContact[];
  organizations: OrganizationItem[];
  onLogCheckIn: (contactId: string) => void;
  onAddContact: (params: {
    name: string;
    role: string;
    organizationName: string;
    lifeArea: Category;
    cadence: RelationshipCadence;
    nextAction: string;
  }) => void;
  onAddOrganization: (params: {
    name: string;
    type: OrganizationCategory;
    role: string;
    lifeArea: Category;
    cadence: string;
    memberOrContactCount: number;
    focusGoal: string;
  }) => void;
  onPushNextActionToTodo: (
    title: string,
    notes: string,
    lifeArea: Category
  ) => void;
}

const CADENCE_OPTIONS: RelationshipCadence[] = [
  'Weekly',
  'Bi-weekly',
  'Monthly',
  'Quarterly',
];

const ORG_TYPES: OrganizationCategory[] = [
  'Company',
  'Community',
  'Open Source',
  'Club',
  'Volunteer',
];

const CONTACT_DAY_OF_WEEK_STORAGE_KEY = 'focusflow_contact_day_of_week_v1';

export const RelationshipOrgDashboard: React.FC<
  RelationshipOrgDashboardProps
> = ({
  contacts,
  organizations,
  onLogCheckIn,
  onAddContact,
  onAddOrganization,
  onPushNextActionToTodo,
}) => {
  const [activeSubView, setActiveSubView] = useState<
    'all' | 'relationships' | 'organizations'
  >('all');
  const [areaFilter, setAreaFilter] = useState<Category | 'All'>('All');
  const [showAddContact, setShowAddContact] = useState(false);
  const [showAddOrg, setShowAddOrg] = useState(false);

  // Add Contact Form State
  const [contactName, setContactName] = useState('');
  const [contactRole, setContactRole] = useState('');
  const [contactOrg, setContactOrg] = useState('');
  const [contactArea, setContactArea] = useState<Category>('Social');
  const [contactCadence, setContactCadence] =
    useState<RelationshipCadence>('Weekly');
  const [contactNextAction, setContactNextAction] = useState('');
  const [newContactDayOfWeek, setNewContactDayOfWeek] =
    useState<string>('Friday');

  // Connecting to people prompt: "At what day of the week did I contact this person?"
  const [contactDayMap, setContactDayMap] = useState<Record<string, string>>(
    () => {
      try {
        const saved = localStorage.getItem(CONTACT_DAY_OF_WEEK_STORAGE_KEY);
        if (saved) {
          return JSON.parse(saved) ?? {};
        }
      } catch {
        // ignore
      }
      return {
        'rel-1': 'Wednesday',
        'rel-2': 'Friday',
        'rel-3': 'Sunday',
        'rel-4': 'Tuesday',
      };
    }
  );

  useEffect(() => {
    try {
      localStorage.setItem(
        CONTACT_DAY_OF_WEEK_STORAGE_KEY,
        JSON.stringify(contactDayMap)
      );
    } catch {
      // ignore
    }
  }, [contactDayMap]);

  // Add Organization Form State
  const [orgName, setOrgName] = useState('');
  const [orgType, setOrgType] = useState<OrganizationCategory>('Community');
  const [orgRole, setOrgRole] = useState('');
  const [orgArea, setOrgArea] = useState<Category>('Social');
  const [orgCadence, setOrgCadence] = useState('Weekly Sync');
  const [orgGoal, setOrgGoal] = useState('');

  const filteredContacts = useMemo(
    () =>
      contacts.filter(
        (c) => areaFilter === 'All' || c.lifeArea === areaFilter
      ),
    [contacts, areaFilter]
  );

  const filteredOrgs = useMemo(
    () =>
      organizations.filter(
        (o) => areaFilter === 'All' || o.lifeArea === areaFilter
      ),
    [organizations, areaFilter]
  );

  const totalStreaks = useMemo(
    () => contacts.reduce((sum, c) => sum + c.streakCount, 0),
    [contacts]
  );

  const handleCreateContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim()) return;
    onAddContact({
      name: contactName,
      role: contactRole || 'Close Connection',
      organizationName: contactOrg || 'Personal Network',
      lifeArea: contactArea,
      cadence: contactCadence,
      nextAction: `${
        contactNextAction || 'Schedule catch-up call'
      } (Contacted on ${newContactDayOfWeek})`,
    });
    setContactName('');
    setContactRole('');
    setContactOrg('');
    setContactNextAction('');
    setShowAddContact(false);
  };

  const handleCreateOrg = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim()) return;
    onAddOrganization({
      name: orgName,
      type: orgType,
      role: orgRole || 'Active Member',
      lifeArea: orgArea,
      cadence: orgCadence || 'Weekly Sync',
      memberOrContactCount: 5,
      focusGoal: orgGoal || 'Collaborate and contribute consistently',
    });
    setOrgName('');
    setOrgRole('');
    setOrgGoal('');
    setShowAddOrg(false);
  };

  return (
    <div
      data-testid="relationship-org-dashboard"
      className="space-y-4 @container"
    >
      {/* Header Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-700" aria-hidden="true" />
              <h1 className="text-lg @sm:text-xl font-bold tracking-tight text-slate-900 font-display">
                Relationship &amp; Organization Dashboard
              </h1>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              Nurture high-trust relationships, mentors, and organizations
              connected to your 7 Life Areas.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setShowAddContact((prev) => !prev);
                setShowAddOrg(false);
              }}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Add Person</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setShowAddOrg((prev) => !prev);
                setShowAddContact(false);
              }}
              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer"
            >
              <Building2 className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Add Organization</span>
            </button>
          </div>
        </div>

        {/* Connecting to People Reflection Banner */}
        <div
          data-testid="connecting-to-people-prompt-banner"
          className="bg-emerald-50/70 border border-emerald-200 rounded-xl px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2"
        >
          <div className="flex items-center gap-2">
            <HelpCircle
              className="w-4 h-4 text-emerald-700 shrink-0"
              aria-hidden="true"
            />
            <span className="text-xs font-bold text-emerald-950">
              Connecting to people prompt:{' '}
              <span className="underline decoration-emerald-400">
                &ldquo;At what day of the week did I contact this person?&rdquo;
              </span>
            </span>
          </div>
          <span className="text-[11px] font-mono text-emerald-800">
            Select the exact weekday on each relationship card below
          </span>
        </div>

        {/* Summary KPI Strip */}
        <div className="grid grid-cols-3 gap-2.5 pt-2 border-t border-slate-100">
          <div className="bg-slate-50 rounded-lg p-2.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Key Relationships
            </span>
            <p
              data-testid="relationship-total-count"
              className="text-base font-bold font-mono text-slate-900 mt-0.5"
            >
              {contacts.length}
            </p>
          </div>
          <div className="bg-slate-50 rounded-lg p-2.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Organizations
            </span>
            <p
              data-testid="organization-total-count"
              className="text-base font-bold font-mono text-emerald-700 mt-0.5"
            >
              {organizations.length}
            </p>
          </div>
          <div className="bg-slate-50 rounded-lg p-2.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Check-In Streaks
            </span>
            <p className="text-base font-bold font-mono text-amber-700 mt-0.5">
              {totalStreaks} touchpoints
            </p>
          </div>
        </div>

        {/* Filter Bar: Sub-view + 7 Life Area Filter */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <div
            role="group"
            aria-label="Filter Relationship and Organization view"
            className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg"
          >
            {(
              [
                { id: 'all', label: 'All Network' },
                {
                  id: 'relationships',
                  label: `Relationships (${filteredContacts.length})`,
                },
                {
                  id: 'organizations',
                  label: `Organizations (${filteredOrgs.length})`,
                },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveSubView(tab.id)}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                  activeSubView === tab.id
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <label htmlFor="network-area-select" className="sr-only">
              Filter by Life Area
            </label>
            <select
              id="network-area-select"
              value={areaFilter}
              onChange={(e) =>
                setAreaFilter(e.target.value as Category | 'All')
              }
              className="text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700"
            >
              <option value="All">All 7 Life Areas</option>
              {LIFE_AREAS.map((area) => (
                <option key={area} value={area}>
                  {area}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Collapsible Add Relationship Form */}
      {showAddContact && (
        <form
          onSubmit={handleCreateContact}
          className="bg-white border border-slate-200 rounded-xl p-4 space-y-3"
        >
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            New Relationship / Contact
          </h2>
          <div className="grid grid-cols-1 @sm:grid-cols-2 gap-2.5">
            <input
              type="text"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="Person's Full Name *"
              aria-label="Person's Full Name"
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900"
            />
            <input
              type="text"
              value={contactRole}
              onChange={(e) => setContactRole(e.target.value)}
              placeholder="Role (e.g. Mentor, Peer, Close Friend)"
              aria-label="Relationship Role"
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900"
            />
            <input
              type="text"
              value={contactOrg}
              onChange={(e) => setContactOrg(e.target.value)}
              placeholder="Organization / Community"
              aria-label="Contact Organization"
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900"
            />
            <div className="grid grid-cols-2 gap-2">
              <select
                value={contactArea}
                onChange={(e) => setContactArea(e.target.value as Category)}
                aria-label="Contact Life Area"
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-slate-700"
              >
                {LIFE_AREAS.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
              <select
                value={contactCadence}
                onChange={(e) =>
                  setContactCadence(e.target.value as RelationshipCadence)
                }
                aria-label="Check-in cadence"
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-slate-700"
              >
                {CADENCE_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Prompt Question inside Add Person form */}
          <div className="bg-emerald-50/60 border border-emerald-200 rounded-lg p-2.5 flex flex-wrap items-center justify-between gap-2">
            <label
              htmlFor="new-contact-weekday"
              className="text-xs font-bold text-emerald-950"
            >
              At what day of the week did I contact this person?
            </label>
            <select
              id="new-contact-weekday"
              value={newContactDayOfWeek}
              onChange={(e) => setNewContactDayOfWeek(e.target.value)}
              className="text-xs font-semibold bg-white border border-emerald-300 rounded-lg px-2.5 py-1 text-slate-800"
            >
              {DAYS_OF_WEEK.map((day) => (
                <option key={day} value={day}>
                  {day}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={contactNextAction}
              onChange={(e) => setContactNextAction(e.target.value)}
              placeholder="Next intentional action or check-in topic..."
              aria-label="Next action for relationship"
              className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900"
            />
            <button
              type="submit"
              disabled={!contactName.trim()}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white text-xs font-semibold rounded-lg cursor-pointer"
            >
              Save Person
            </button>
          </div>
        </form>
      )}

      {/* Collapsible Add Organization Form */}
      {showAddOrg && (
        <form
          onSubmit={handleCreateOrg}
          className="bg-white border border-slate-200 rounded-xl p-4 space-y-3"
        >
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            New Organization / Community
          </h2>
          <div className="grid grid-cols-1 @sm:grid-cols-2 gap-2.5">
            <input
              type="text"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              placeholder="Organization or Guild Name *"
              aria-label="Organization Name"
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900"
            />
            <input
              type="text"
              value={orgRole}
              onChange={(e) => setOrgRole(e.target.value)}
              placeholder="Your Role (e.g. Core Maintainer, Lead)"
              aria-label="Your Role in Organization"
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900"
            />
            <div className="grid grid-cols-2 gap-2">
              <select
                value={orgType}
                onChange={(e) =>
                  setOrgType(e.target.value as OrganizationCategory)
                }
                aria-label="Organization Type"
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-slate-700"
              >
                {ORG_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <select
                value={orgArea}
                onChange={(e) => setOrgArea(e.target.value as Category)}
                aria-label="Organization Life Area"
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-slate-700"
              >
                {LIFE_AREAS.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>
            <input
              type="text"
              value={orgCadence}
              onChange={(e) => setOrgCadence(e.target.value)}
              placeholder="Cadence (e.g. Weekly Sync, Saturdays)"
              aria-label="Organization Cadence"
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={orgGoal}
              onChange={(e) => setOrgGoal(e.target.value)}
              placeholder="Primary mission or contribution goal..."
              aria-label="Organization Focus Goal"
              className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900"
            />
            <button
              type="submit"
              disabled={!orgName.trim()}
              className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-40 text-white text-xs font-semibold rounded-lg cursor-pointer"
            >
              Save Organization
            </button>
          </div>
        </form>
      )}

      {/* Relationships Section */}
      {(activeSubView === 'all' || activeSubView === 'relationships') && (
        <section aria-label="Relationships directory" className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              People &amp; Mentors ({filteredContacts.length})
            </h2>
          </div>

          <div className="grid grid-cols-1 @xl:grid-cols-2 gap-3">
            {filteredContacts.map((person) => {
              const contactedDay = contactDayMap[person.id] ?? 'Friday';

              return (
                <div
                  key={person.id}
                  data-testid={`relationship-card-${person.id}`}
                  className="bg-white border border-slate-200 rounded-xl p-3.5 flex flex-col justify-between gap-3"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">
                          {person.name}
                        </h3>
                        <p className="text-xs text-slate-500">
                          {person.role} ·{' '}
                          <span className="font-medium text-slate-700">
                            {person.organizationName}
                          </span>
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-semibold">
                          {person.lifeArea}
                        </span>
                        <span
                          title="Check-in streak"
                          className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-mono font-bold flex items-center gap-1"
                        >
                          <Flame
                            className="w-3 h-3 text-amber-600"
                            aria-hidden="true"
                          />
                          {person.streakCount}
                        </span>
                      </div>
                    </div>

                    <div className="bg-slate-50 border border-slate-100 rounded-lg p-2.5 text-xs text-slate-700">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-0.5">
                        Next Touchpoint ({person.cadence})
                      </span>
                      {person.nextAction}
                    </div>

                    {/* Prompt Question: "At what day of the week did I contact this person?" */}
                    <div
                      data-testid={`contact-weekday-prompt-${person.id}`}
                      className="bg-emerald-50/50 border border-emerald-200/80 rounded-lg p-2 space-y-1.5"
                    >
                      <span className="block text-[11px] font-bold text-emerald-950">
                        At what day of the week did I contact this person?
                      </span>
                      <div className="flex flex-wrap items-center gap-1">
                        {DAYS_OF_WEEK.map((day) => {
                          const isSelected = contactedDay === day;
                          return (
                            <button
                              key={day}
                              type="button"
                              onClick={() =>
                                setContactDayMap((prev) => ({
                                  ...prev,
                                  [person.id]: day,
                                }))
                              }
                              className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors cursor-pointer ${
                                isSelected
                                  ? 'bg-emerald-700 text-white'
                                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              {day.slice(0, 3)}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[11px] font-mono text-slate-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3" aria-hidden="true" />
                      Last: {person.lastContactedDate} ({contactedDay})
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          const todayWeekday =
                            DAYS_OF_WEEK[
                              (new Date().getDay() + 6) % 7
                            ] ?? 'Friday';
                          setContactDayMap((prev) => ({
                            ...prev,
                            [person.id]: todayWeekday,
                          }));
                          onLogCheckIn(person.id);
                        }}
                        className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
                        <span>Log Check-In</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          onPushNextActionToTodo(
                            `${person.name}: ${person.nextAction}`,
                            `Relationship check-in (${person.organizationName} · Contacted ${contactedDay})`,
                            person.lifeArea
                          )
                        }
                        aria-label={`Add follow-up with ${person.name} to tasks`}
                        className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <span>To Task</span>
                        <ArrowUpRight className="w-3 h-3" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Organizations Section */}
      {(activeSubView === 'all' || activeSubView === 'organizations') && (
        <section aria-label="Organizations directory" className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Organizations, Communities &amp; Guilds ({filteredOrgs.length})
            </h2>
          </div>

          <div className="grid grid-cols-1 @xl:grid-cols-2 gap-3">
            {filteredOrgs.map((org) => (
              <div
                key={org.id}
                data-testid={`organization-card-${org.id}`}
                className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0">
                      <Building2 className="w-4 h-4" aria-hidden="true" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        {org.name}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {org.role} ·{' '}
                        <span className="font-medium text-slate-700">
                          {org.type}
                        </span>
                      </p>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 text-[10px] font-semibold shrink-0">
                    {org.lifeArea}
                  </span>
                </div>

                <p className="text-xs text-slate-700 bg-slate-50 border border-slate-100 rounded-lg p-2.5">
                  <Sparkles
                    className="w-3 h-3 text-emerald-600 inline mr-1"
                    aria-hidden="true"
                  />
                  {org.focusGoal}
                </p>

                <div className="pt-1 flex items-center justify-between text-[11px] text-slate-500">
                  <span className="font-medium text-slate-700">
                    {org.cadence}
                  </span>
                  <span className="font-mono">
                    {org.memberOrContactCount} active connections
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
