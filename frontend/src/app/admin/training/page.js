'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import api from '@/lib/axios';
import toast from 'react-hot-toast';

import {
  BookOpen,
  User,
  Calendar,
  Clock,
  Users,
  MapPin,
  Link as LinkIcon,
  Inbox,
  Loader2,
  X,
  Plus,
  CheckCircle2,
  Pencil,
  RotateCcw,
  Trash2,
  Ban,
  Search,
  ChevronRight,
  GraduationCap,
  Video,
  Building2,
  Layers3,
  BarChart3,
  AlertCircle,
} from 'lucide-react';

/* ============================================================
   EMPTY FORM
============================================================ */

const EMPTY_FORM = {
  title: '',
  description: '',
  category: 'TECHNICAL',
  trainer: '',
  mode: 'ONLINE',
  startDate: '',
  endDate: '',
  durationHours: '',
  maxParticipants: '',
  venue: '',
  meetingLink: '',
};

/* ============================================================
   STATUS CONFIGURATION
============================================================ */

const STATUS_META = {
  UPCOMING: {
    label: 'Upcoming',
    dot: 'bg-blue-500',
    badge:
      'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/20',
  },

  ONGOING: {
    label: 'Ongoing',
    dot: 'bg-amber-500',
    badge:
      'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20',
  },

  COMPLETED: {
    label: 'Completed',
    dot: 'bg-emerald-500',
    badge:
      'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20',
  },

  CANCELLED: {
    label: 'Cancelled',
    dot: 'bg-rose-500',
    badge:
      'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/20',
  },
};

/* ============================================================
   BADGE
============================================================ */

function Badge({ status }) {
  const meta = STATUS_META[status] || {
    label: String(status || 'Unknown').replaceAll('_', ' '),
    dot: 'bg-slate-400',
    badge:
      'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-500/10 dark:text-slate-300 dark:border-slate-500/20',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${meta.badge}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${meta.dot}`}
      />

      {meta.label}
    </span>
  );
}

/* ============================================================
   MODE BADGE
============================================================ */

function ModeBadge({ mode }) {
  const meta =
    {
      ONLINE: {
        icon: Video,
        label: 'Online',
      },

      OFFLINE: {
        icon: Building2,
        label: 'Offline',
      },

      HYBRID: {
        icon: Layers3,
        label: 'Hybrid',
      },
    }[mode] || {
      icon: Layers3,
      label: mode || 'Unknown',
    };

  const Icon = meta.icon;

  return (
    <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
      <Icon size={12} />

      {meta.label}
    </span>
  );
}

/* ============================================================
   STAT CARD
============================================================ */

function StatCard({
  icon: Icon,
  label,
  value,
  description,
}) {
  return (
    <div className="group rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
            {label}
          </p>

          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-950 dark:text-white">
            {value}
          </p>

          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            {description}
          </p>
        </div>

        <div className="rounded-xl bg-slate-100 p-2.5 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          <Icon size={18} />
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   FORM FIELD
============================================================ */

function Field({
  label,
  required,
  children,
  hint,
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
        {label}{' '}
        {required && (
          <span className="text-rose-500">*</span>
        )}
      </label>

      {children}

      {hint && (
        <p className="mt-1 text-[10px] text-slate-400">
          {hint}
        </p>
      )}
    </div>
  );
}

/* ============================================================
   INPUT STYLE
============================================================ */

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-slate-500 dark:focus:ring-slate-800';

/* ============================================================
   MAIN PAGE
============================================================ */

export default function TrainingPage() {
  /* ----------------------------------------------------------
     TRAININGS
  ---------------------------------------------------------- */

  const [trainings, setTrainings] = useState([]);

  const [loading, setLoading] = useState(true);

  /* ----------------------------------------------------------
     FORM
  ---------------------------------------------------------- */

  const [showForm, setShowForm] = useState(false);

  const [form, setForm] =
    useState(EMPTY_FORM);

  const [submitting, setSubmitting] =
    useState(false);

  /* ----------------------------------------------------------
     SELECTED TRAINING
  ---------------------------------------------------------- */

  const [selected, setSelected] =
    useState(null);

  const [enrollments, setEnrollments] =
    useState([]);

  const [loadingEnroll, setLoadingEnroll] =
    useState(false);

  /* ----------------------------------------------------------
     COMPLETION
  ---------------------------------------------------------- */

  const [completing, setCompleting] =
    useState(null);

  const [score, setScore] =
    useState('');

  const [feedback, setFeedback] =
    useState('');

  const [completingId, setCompletingId] =
    useState(null);

  /* ----------------------------------------------------------
     EDIT / REOPEN / DELETE
  ---------------------------------------------------------- */

  const [editingTraining, setEditingTraining] =
    useState(null);

  const [formMode, setFormMode] =
    useState('CREATE');

  const [deletingId, setDeletingId] =
    useState(null);

  /* ----------------------------------------------------------
     SEARCH / FILTER
  ---------------------------------------------------------- */

  const [query, setQuery] =
    useState('');

  const [statusFilter, setStatusFilter] =
    useState('ALL');

  /* ----------------------------------------------------------
     TODAY
  ---------------------------------------------------------- */

  const todayStr =
    new Date().toLocaleDateString('en-CA');

  /* ============================================================
     DYNAMIC STATUS
  ============================================================ */

  const getDynamicStatus = useCallback(
    (training) => {
      /*
       * Cancelled status from DB always has priority.
       */

      if (
        training.status === 'CANCELLED'
      ) {
        return 'CANCELLED';
      }

      /*
       * If dates are unavailable,
       * use the database status.
       */

      if (
        !training.startDate ||
        !training.endDate
      ) {
        return (
          training.status ||
          'UPCOMING'
        );
      }

      /*
       * Future training.
       */

      if (
        todayStr <
        training.startDate
      ) {
        return 'UPCOMING';
      }

      /*
       * Current training.
       */

      if (
        todayStr >=
        training.startDate &&
        todayStr <=
        training.endDate
      ) {
        return 'ONGOING';
      }

      /*
       * Past training.
       */

      if (
        todayStr >
        training.endDate
      ) {
        return 'COMPLETED';
      }

      return (
        training.status ||
        'UPCOMING'
      );
    },
    [todayStr]
  );

  /* ============================================================
     FETCH TRAININGS
  ============================================================ */

  const fetchTrainings =
    useCallback(async () => {
      setLoading(true);

      try {
        const res =
          await api.get(
            '/api/trainings'
          );

        setTrainings(
          res.data?.data?.content ||
          []
        );
      } catch (error) {
        toast.error(
          'Failed to load trainings'
        );
      } finally {
        setLoading(false);
      }
    }, []);

  /* ============================================================
     INITIAL LOAD
  ============================================================ */

  useEffect(() => {
    fetchTrainings();
  }, [fetchTrainings]);

  /* ============================================================
     FETCH ENROLLMENTS
  ============================================================ */

  const fetchEnrollments =
    async (trainingId) => {
      setLoadingEnroll(true);

      try {
        const res =
          await api.get(
            `/api/trainings/${trainingId}/enrollments`
          );

        setEnrollments(
          res.data?.data || []
        );
      } catch (error) {
        setEnrollments([]);

        toast.error(
          'Unable to load enrolled employees'
        );
      } finally {
        setLoadingEnroll(false);
      }
    };

  /* ============================================================
     SELECT TRAINING
  ============================================================ */

  const handleSelectTraining =
    (training) => {
      /*
       * Clicking selected training closes
       * the details panel.
       */

      if (
        selected?.id === training.id
      ) {
        setSelected(null);
        setEnrollments([]);
        return;
      }

      setSelected(training);

      setCompletingId(null);
      setScore('');
      setFeedback('');

      fetchEnrollments(
        training.id
      );
    };

  /* ============================================================
     OPEN CREATE / EDIT / REOPEN FORM
  ============================================================ */

  const openTrainingForm =
    (
      training = null,
      mode = 'CREATE'
    ) => {
      setFormMode(mode);

      setEditingTraining(training);

      if (training) {
        setForm({
          title:
            training.title || '',

          description:
            training.description || '',

          category:
            training.category ||
            'TECHNICAL',

          trainer:
            training.trainer || '',

          mode:
            training.mode ||
            'ONLINE',

          startDate:
            training.startDate || '',

          endDate:
            training.endDate || '',

          durationHours:
            training.durationHours ??
            '',

          maxParticipants:
            training.maxParticipants ??
            '',

          venue:
            training.venue || '',

          meetingLink:
            training.meetingLink || '',
        });
      } else {
        setForm(EMPTY_FORM);
      }

      setShowForm(true);
    };

  /* ============================================================
     CLOSE FORM
  ============================================================ */

  const closeForm = () => {
    if (submitting) return;

    setShowForm(false);

    setEditingTraining(null);

    setFormMode('CREATE');

    setForm(EMPTY_FORM);
  };

  /* ============================================================
     SUBMIT TRAINING
  ============================================================ */

  const handleSubmitTraining =
    async (e) => {
      e.preventDefault();

      /* --------------------------------------------------------
         VALIDATION
      -------------------------------------------------------- */

      if (!form.title.trim()) {
        toast.error(
          'Training title is required'
        );
        return;
      }

      if (!form.description.trim()) {
        toast.error(
          'Description is required'
        );
        return;
      }

      if (!form.trainer.trim()) {
        toast.error(
          'Trainer is required'
        );
        return;
      }

      if (!form.startDate) {
        toast.error(
          'Start Date is required'
        );
        return;
      }

      if (!form.endDate) {
        toast.error(
          'End Date is required'
        );
        return;
      }

      if (
        form.endDate <
        form.startDate
      ) {
        toast.error(
          'End Date cannot be before Start Date'
        );
        return;
      }

      /*
       * New training cannot start in the past.
       */

      if (
        formMode === 'CREATE' &&
        form.startDate < todayStr
      ) {
        toast.error(
          'Start Date cannot be before today'
        );
        return;
      }

      const duration =
        parseInt(
          form.durationHours,
          10
        ) || 0;

      const maxParticipants =
        parseInt(
          form.maxParticipants,
          10
        ) || 0;

      if (duration < 0) {
        toast.error(
          'Duration cannot be negative'
        );
        return;
      }

      if (
        maxParticipants < 1
      ) {
        toast.error(
          'Maximum participants must be at least 1'
        );
        return;
      }

      /*
       * Offline / hybrid requires venue.
       */

      if (
        form.mode !== 'ONLINE' &&
        !form.venue.trim()
      ) {
        toast.error(
          'Venue is required for offline/hybrid trainings'
        );
        return;
      }

      /*
       * Online / hybrid requires meeting link.
       */

      if (
        form.mode !== 'OFFLINE' &&
        !form.meetingLink.trim()
      ) {
        toast.error(
          'Meeting link is required for online/hybrid trainings'
        );
        return;
      }

      /* --------------------------------------------------------
         PAYLOAD
      -------------------------------------------------------- */

      const payload = {
        title:
          form.title.trim(),

        description:
          form.description.trim(),

        category:
          form.category,

        trainer:
          form.trainer.trim(),

        mode:
          form.mode,

        startDate:
          form.startDate,

        endDate:
          form.endDate,

        durationHours:
          duration,

        maxParticipants:
          maxParticipants,

        venue:
          form.venue.trim(),

        meetingLink:
          form.meetingLink.trim(),
      };

      setSubmitting(true);

      try {
        /* ------------------------------------------------------
           CREATE
        ------------------------------------------------------ */

        if (
          formMode === 'CREATE'
        ) {
          await api.post(
            '/api/trainings',
            payload
          );

          toast.success(
            'Training created successfully'
          );
        }

        /* ------------------------------------------------------
           EDIT
        ------------------------------------------------------ */

        else if (
          formMode === 'EDIT'
        ) {
          await api.put(
            `/api/trainings/${editingTraining.id}`,
            payload
          );

          toast.success(
            'Training updated successfully'
          );
        }

        /* ------------------------------------------------------
           REOPEN
        ------------------------------------------------------ */

        else if (
          formMode === 'REOPEN'
        ) {
          await api.put(
            `/api/trainings/${editingTraining.id}/reopen`,
            payload
          );

          toast.success(
            'Training re-opened successfully'
          );
        }

        closeForm();

        setSelected(null);

        await fetchTrainings();
      } catch (error) {
        toast.error(
          error.response?.data?.message ||
          'Failed to save training'
        );
      } finally {
        setSubmitting(false);
      }
    };

  /* ============================================================
     CANCEL TRAINING
  ============================================================ */

  const handleCancelTraining =
    async (trainingId) => {
      const training =
        trainings.find(
          (t) =>
            t.id === trainingId
        );

      if (!training) return;

      const message =
        training.enrolledCount > 0
          ? `Cancel "${training.title}"?\n\n${training.enrolledCount} employee(s) are currently enrolled.\n\nThe training will remain available for re-opening.`
          : `Cancel "${training.title}"?\n\nThe training will be marked as cancelled.`;

      if (
        !window.confirm(message)
      ) {
        return;
      }

      try {
        await api.put(
          `/api/trainings/${trainingId}/status`,
          {
            status: 'CANCELLED',
          }
        );

        toast.success(
          'Training cancelled'
        );

        setSelected(null);

        await fetchTrainings();
      } catch (error) {
        toast.error(
          error.response?.data?.message ||
          'Failed to cancel training'
        );
      }
    };

  /* ============================================================
     DELETE TRAINING
  ============================================================ */

  const handleDeleteTraining =
    async (trainingId) => {
      const training =
        trainings.find(
          (t) =>
            t.id === trainingId
        );

      if (!training) return;

      /*
       * Safety rule:
       * only cancelled trainings
       * can be permanently deleted.
       */

      if (
        training.status !==
        'CANCELLED'
      ) {
        toast.error(
          'Only cancelled trainings can be deleted'
        );

        return;
      }

      const message =
        training.enrolledCount > 0
          ? `Delete "${training.title}" permanently?\n\n${training.enrolledCount} employee(s) are enrolled.\n\nThis cannot be undone.`
          : `Delete "${training.title}" permanently?\n\nThis cannot be undone.`;

      if (
        !window.confirm(message)
      ) {
        return;
      }

      setDeletingId(trainingId);

      try {
        await api.delete(
          `/api/trainings/${trainingId}`
        );

        toast.success(
          'Training deleted permanently'
        );

        setSelected(null);

        await fetchTrainings();
      } catch (error) {
        toast.error(
          error.response?.data?.message ||
          'Failed to delete training'
        );
      } finally {
        setDeletingId(null);
      }
    };

  /* ============================================================
     COMPLETE ENROLLMENT
  ============================================================ */

  const handleComplete =
    async (enrollmentId) => {
      const numericScore =
        parseInt(score, 10);

      if (
        Number.isNaN(
          numericScore
        ) ||
        numericScore < 0 ||
        numericScore > 100
      ) {
        toast.error(
          'Enter a score between 0 and 100'
        );

        return;
      }

      setCompleting(
        enrollmentId
      );

      try {
        await api.put(
          `/api/trainings/enrollments/${enrollmentId}/complete`,
          {
            score:
              numericScore,

            feedback:
              feedback,

            certificateUrl:
              `/api/files/certificate-${enrollmentId}.pdf`,
          }
        );

        toast.success(
          'Enrollment marked as completed'
        );

        setCompletingId(null);

        setScore('');

        setFeedback('');

        if (selected) {
          await fetchEnrollments(
            selected.id
          );
        }
      } catch (error) {
        toast.error(
          error.response?.data?.message ||
          'Failed to complete enrollment'
        );
      } finally {
        setCompleting(null);
      }
    };

  /* ============================================================
     FILTER TRAININGS
  ============================================================ */

  const filteredTrainings =
    useMemo(() => {
      const normalized =
        query
          .trim()
          .toLowerCase();

      return trainings.filter(
        (training) => {
          const status =
            getDynamicStatus(
              training
            );

          const matchesStatus =
            statusFilter === 'ALL' ||
            status ===
            statusFilter;

          const matchesQuery =
            !normalized ||
            [
              training.title,
              training.trainer,
              training.category,
              training.venue,
            ]
              .filter(Boolean)
              .some((value) =>
                String(value)
                  .toLowerCase()
                  .includes(
                    normalized
                  )
              );

          return (
            matchesStatus &&
            matchesQuery
          );
        }
      );
    }, [
      trainings,
      query,
      statusFilter,
      getDynamicStatus,
    ]);

  /* ============================================================
     STATISTICS
  ============================================================ */

  const stats = useMemo(() => {
    const statuses =
      trainings.map(
        getDynamicStatus
      );

    return {
      total:
        trainings.length,

      upcoming:
        statuses.filter(
          (s) =>
            s === 'UPCOMING'
        ).length,

      ongoing:
        statuses.filter(
          (s) =>
            s === 'ONGOING'
        ).length,

      completed:
        statuses.filter(
          (s) =>
            s === 'COMPLETED'
        ).length,

      cancelled:
        statuses.filter(
          (s) =>
            s === 'CANCELLED'
        ).length,

      enrollments:
        trainings.reduce(
          (sum, training) =>
            sum +
            (Number(
              training.enrolledCount
            ) || 0),
          0
        ),
    };
  }, [
    trainings,
    getDynamicStatus,
  ]);

  /* ============================================================
     RENDER
  ============================================================ */

  return (
    <div className="min-h-full bg-slate-50/70 px-4 py-6 text-slate-900 dark:bg-slate-950 dark:text-slate-100 sm:px-6 lg:px-8">

      <div className="mx-auto max-w-[1500px] space-y-6">

        {/* ======================================================
            PREMIUM HEADER
        ====================================================== */}

        <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:p-7">

          <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-slate-100 blur-3xl dark:bg-slate-800" />

          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

            <div className="flex items-start gap-4">

              <div className="hidden rounded-2xl bg-slate-900 p-3 text-white shadow-sm dark:bg-white dark:text-slate-900 sm:flex">
                <GraduationCap
                  size={25}
                />
              </div>

              <div>

                <div className="mb-1 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">

                  <span>
                    Learning & Development
                  </span>

                  <span className="h-1 w-1 rounded-full bg-slate-300" />

                  <span>
                    HRMS
                  </span>

                </div>

                <h1 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-3xl">
                  Training Management
                </h1>

                <p className="mt-1.5 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
                  Plan training programs,
                  monitor participation,
                  and keep employee
                  learning records organized.
                </p>

              </div>

            </div>

            <button
              onClick={() =>
                openTrainingForm()
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-200 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 dark:focus:ring-slate-800"
            >
              <Plus size={17} />

              Create Training
            </button>

          </div>

        </section>

        {/* ======================================================
            KPI CARDS
        ====================================================== */}

        <section className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">

          <StatCard
            icon={BookOpen}
            label="Programs"
            value={stats.total}
            description="Total created"
          />

          <StatCard
            icon={Calendar}
            label="Upcoming"
            value={stats.upcoming}
            description="Scheduled next"
          />

          <StatCard
            icon={Clock}
            label="Ongoing"
            value={stats.ongoing}
            description="Currently active"
          />

          <StatCard
            icon={CheckCircle2}
            label="Completed"
            value={stats.completed}
            description="Past programs"
          />

          <StatCard
            icon={Ban}
            label="Cancelled"
            value={stats.cancelled}
            description="Cancelled programs"
          />

          <StatCard
            icon={Users}
            label="Enrollments"
            value={stats.enrollments}
            description="Total participants"
          />

        </section>

        {/* ======================================================
            SEARCH + FILTER TOOLBAR
        ====================================================== */}

        <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">

            {/* Search */}

            <div className="relative w-full lg:max-w-md">

              <Search
                size={17}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                value={query}
                onChange={(e) =>
                  setQuery(
                    e.target.value
                  )
                }
                placeholder="Search by training, trainer, category..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:focus:border-slate-500 dark:focus:ring-slate-800"
              />

            </div>

            {/* Status Filters */}

            <div className="flex items-center gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1 dark:bg-slate-800">

              {[
                'ALL',
                'UPCOMING',
                'ONGOING',
                'COMPLETED',
                'CANCELLED',
              ].map(
                (status) => (
                  <button
                    key={status}
                    onClick={() =>
                      setStatusFilter(
                        status
                      )
                    }
                    className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-[11px] font-semibold transition ${statusFilter ===
                        status
                        ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-950 dark:text-white'
                        : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                      }`}
                  >
                    {status === 'ALL'
                      ? 'All'
                      : status.replace(
                        '_',
                        ' '
                      )}
                  </button>
                )
              )}

            </div>

          </div>

        </section>

        {/* ======================================================
            MAIN GRID
        ====================================================== */}

        <div
          className={`grid items-start gap-5 ${selected
              ? 'xl:grid-cols-[minmax(0,1fr)_480px]'
              : 'grid-cols-1'
            }`}
        >

          {/* ====================================================
              TRAINING LIST
          ==================================================== */}

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">

            {/* List Header */}

            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">

              <div>

                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Training Programs
                </h2>

                <p className="mt-0.5 text-[11px] text-slate-400">
                  Showing{' '}
                  {
                    filteredTrainings.length
                  }{' '}
                  of{' '}
                  {trainings.length}{' '}
                  programs
                </p>

              </div>

              <BarChart3
                size={17}
                className="text-slate-400"
              />

            </div>

            {/* Loading */}

            {loading ? (
              <div className="flex min-h-72 flex-col items-center justify-center gap-3 text-sm text-slate-400">

                <Loader2
                  size={24}
                  className="animate-spin"
                />

                Loading training
                programs...

              </div>
            ) : filteredTrainings.length ===
              0 ? (

              /* Empty state */

              <div className="flex min-h-72 flex-col items-center justify-center px-6 text-center">

                <div className="mb-3 rounded-2xl bg-slate-100 p-4 text-slate-400 dark:bg-slate-800">

                  <Inbox size={25} />

                </div>

                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">

                  {trainings.length ===
                    0
                    ? 'No training programs yet'
                    : 'No matching programs'}

                </h3>

                <p className="mt-1 max-w-sm text-xs text-slate-400">

                  {trainings.length ===
                    0
                    ? 'Create your first program to start managing employee learning.'
                    : 'Try another search term or change the status filter.'}

                </p>

                {trainings.length ===
                  0 && (
                    <button
                      onClick={() =>
                        openTrainingForm()
                      }
                      className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900"
                    >
                      <Plus size={14} />

                      Create First Training
                    </button>
                  )}

              </div>

            ) : (

              /* Training cards */

              <div className="divide-y divide-slate-100 dark:divide-slate-800">

                {filteredTrainings.map(
                  (training) => {
                    const currentStatus =
                      getDynamicStatus(
                        training
                      );

                    const isSelected =
                      selected?.id ===
                      training.id;

                    const enrolled =
                      Number(
                        training.enrolledCount
                      ) || 0;

                    const capacity =
                      Number(
                        training.maxParticipants
                      ) || 0;

                    const percentage =
                      capacity
                        ? Math.min(
                          100,
                          Math.round(
                            (enrolled /
                              capacity) *
                            100
                          )
                        )
                        : 0;

                    return (
                      <button
                        key={
                          training.id
                        }
                        onClick={() =>
                          handleSelectTraining(
                            training
                          )
                        }
                        className={`group block w-full text-left transition ${isSelected
                            ? 'bg-slate-50 dark:bg-slate-800/60'
                            : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/30'
                          }`}
                      >

                        <div className="flex gap-4 p-4 sm:p-5">

                          {/* Icon */}

                          <div
                            className={`mt-0.5 hidden h-11 w-11 shrink-0 items-center justify-center rounded-xl sm:flex ${isSelected
                                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                                : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300'
                              }`}
                          >
                            <BookOpen
                              size={19}
                            />
                          </div>

                          {/* Content */}

                          <div className="min-w-0 flex-1">

                            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">

                              <div className="min-w-0">

                                <h3 className="truncate text-sm font-bold text-slate-900 dark:text-white">
                                  {
                                    training.title
                                  }
                                </h3>

                                <p className="mt-1 line-clamp-1 text-xs text-slate-500 dark:text-slate-400">
                                  {training.description ||
                                    'No description provided'}
                                </p>

                              </div>

                              <div className="flex shrink-0 items-center gap-2">

                                <Badge
                                  status={
                                    currentStatus
                                  }
                                />

                                <ChevronRight
                                  size={
                                    16
                                  }
                                  className={`text-slate-300 transition group-hover:translate-x-0.5 ${isSelected
                                      ? 'rotate-90 text-slate-500'
                                      : ''
                                    }`}
                                />

                              </div>

                            </div>

                            {/* Metadata */}

                            <div className="mt-4 grid gap-2 text-[11px] text-slate-500 dark:text-slate-400 sm:grid-cols-4">

                              <span className="flex min-w-0 items-center gap-1.5">

                                <User
                                  size={
                                    13
                                  }
                                  className="shrink-0 text-slate-400"
                                />

                                <span className="truncate">
                                  {training.trainer ||
                                    'No trainer'}
                                </span>

                              </span>

                              <span className="flex items-center gap-1.5">

                                <Calendar
                                  size={
                                    13
                                  }
                                  className="shrink-0 text-slate-400"
                                />

                                {training.startDate}{' '}
                                →
                                {training.endDate}

                              </span>

                              <span className="flex items-center gap-1.5">

                                <Clock
                                  size={
                                    13
                                  }
                                  className="shrink-0 text-slate-400"
                                />

                                {training.durationHours ??
                                  0}{' '}
                                hours

                              </span>

                              <span className="flex items-center gap-1.5">

                                <Users
                                  size={
                                    13
                                  }
                                  className="shrink-0 text-slate-400"
                                />

                                {enrolled}/
                                {capacity ||
                                  '∞'}{' '}
                                enrolled

                              </span>

                            </div>

                            {/* Bottom row */}

                            <div className="mt-3 flex items-center gap-3">

                              <ModeBadge
                                mode={
                                  training.mode
                                }
                              />

                              <span className="text-[11px] font-medium text-slate-400">
                                {training.category?.replaceAll(
                                  '_',
                                  ' '
                                )}
                              </span>

                              {capacity >
                                0 && (
                                  <div className="ml-auto hidden w-28 items-center gap-2 sm:flex">

                                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">

                                      <div
                                        className="h-full rounded-full bg-slate-700 dark:bg-slate-300"
                                        style={{
                                          width: `${percentage}%`,
                                        }}
                                      />

                                    </div>

                                    <span className="text-[10px] font-semibold text-slate-400">
                                      {
                                        percentage
                                      }
                                      %
                                    </span>

                                  </div>
                                )}

                            </div>

                          </div>

                        </div>

                      </button>
                    );
                  }
                )}

              </div>
            )}

          </section>

          {/* ====================================================
              DETAILS PANEL START
          ==================================================== */}

          {selected && (
            <aside className="sticky top-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">

              {/* Details header */}

              <div className="border-b border-slate-100 p-5 dark:border-slate-800">

                <div className="flex items-start justify-between gap-4">

                  <div className="min-w-0">

                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                      Training Details
                    </p>

                    <h2 className="mt-1.5 text-lg font-bold tracking-tight text-slate-950 dark:text-white">
                      {
                        selected.title
                      }
                    </h2>

                    <div className="mt-2 flex flex-wrap items-center gap-2">

                      <Badge
                        status={getDynamicStatus(
                          selected
                        )}
                      />

                      <ModeBadge
                        mode={
                          selected.mode
                        }
                      />

                    </div>

                  </div>

                  <button
                    onClick={() =>
                      setSelected(null)
                    }
                    className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                    aria-label="Close details"
                  >
                    <X size={18} />
                  </button>

                </div>

                {/* Actions */}

                <div className="mt-4 flex flex-wrap gap-2">

                  {selected.status !==
                    'CANCELLED' &&
                    selected.status !==
                    'COMPLETED' && (
                      <>
                        <button
                          onClick={() =>
                            openTrainingForm(
                              selected,
                              'EDIT'
                            )
                          }
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                        >
                          <Pencil
                            size={
                              13
                            }
                          />

                          Edit
                        </button>

                        <button
                          onClick={() =>
                            handleCancelTraining(
                              selected.id
                            )
                          }
                          className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 dark:border-rose-500/20 dark:text-rose-400 dark:hover:bg-rose-500/10"
                        >
                          <Ban
                            size={
                              13
                            }
                          />

                          Cancel
                        </button>
                      </>
                    )}

                  {selected.status ===
                    'CANCELLED' && (
                      <>
                        <button
                          onClick={() =>
                            openTrainingForm(
                              selected,
                              'REOPEN'
                            )
                          }
                          className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900"
                        >
                          <RotateCcw
                            size={
                              13
                            }
                          />

                          Re-open
                        </button>

                        <button
                          disabled={
                            deletingId ===
                            selected.id
                          }
                          onClick={() =>
                            handleDeleteTraining(
                              selected.id
                            )
                          }
                          className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-50 dark:border-rose-500/20 dark:text-rose-400"
                        >
                          {deletingId ===
                            selected.id ? (
                            <Loader2
                              size={
                                13
                              }
                              className="animate-spin"
                            />
                          ) : (
                            <Trash2
                              size={
                                13
                              }
                            />
                          )}

                          Delete
                        </button>
                      </>
                    )}

                </div>

              </div>

              {/* ==================================================
                  DETAILS CONTENT
              ================================================== */}

              <div className="max-h-[calc(100vh-210px)] overflow-y-auto">

                {/* Training metadata */}

                <div className="grid grid-cols-2 gap-2 p-4">

                  {[
                    [
                      Calendar,
                      'Schedule',
                      `${selected.startDate} → ${selected.endDate}`,
                    ],

                    [
                      Clock,
                      'Duration',
                      `${selected.durationHours ?? 0} hours`,
                    ],

                    [
                      User,
                      'Trainer',
                      selected.trainer ||
                      'Not assigned',
                    ],

                    [
                      Users,
                      'Capacity',
                      `${selected.enrolledCount || 0}/${selected.maxParticipants || '∞'}`,
                    ],

                    [
                      MapPin,
                      'Venue',
                      selected.venue ||
                      'Not specified',
                    ],

                    [
                      Layers3,
                      'Category',
                      selected.category?.replaceAll(
                        '_',
                        ' '
                      ) ||
                      'General',
                    ],
                  ].map(
                    ([
                      Icon,
                      label,
                      value,
                    ]) => (
                      <div
                        key={
                          label
                        }
                        className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-800/40"
                      >
                        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">

                          <Icon
                            size={
                              12
                            }
                          />

                          {label}

                        </div>

                        <p className="mt-1.5 line-clamp-2 text-xs font-semibold text-slate-700 dark:text-slate-200">
                          {value}
                        </p>

                      </div>
                    )
                  )}

                </div>

                {/* Description */}

                {selected.description && (
                  <div className="px-4 pb-4">

                    <div className="rounded-xl border border-slate-100 p-4 dark:border-slate-800">

                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Overview
                      </p>

                      <p className="mt-2 text-xs leading-5 text-slate-600 dark:text-slate-300">
                        {
                          selected.description
                        }
                      </p>

                    </div>

                  </div>
                )}

                {/* Meeting link */}

                {selected.meetingLink && (
                  <div className="mx-4 mb-4 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-500/20 dark:bg-emerald-500/10">

                    <div className="rounded-lg bg-white p-2 text-emerald-600 shadow-sm dark:bg-slate-900 dark:text-emerald-400">
                      <LinkIcon
                        size={15}
                      />
                    </div>

                    <div className="min-w-0 flex-1">

                      <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                        Meeting Link
                      </p>

                      <a
                        href={
                          selected.meetingLink
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="mt-0.5 block truncate text-xs font-semibold text-emerald-700 underline underline-offset-2 dark:text-emerald-300"
                      >
                        {
                          selected.meetingLink
                        }
                      </a>

                    </div>

                  </div>
                )}

                {/* =================================================
                    ENROLLMENTS START
                ================================================= */}

                <div className="border-t border-slate-100 p-4 dark:border-slate-800">

                  <div className="mb-3 flex items-center justify-between">

                    <div>

                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                        Enrolled Employees
                      </h3>

                      <p className="mt-0.5 text-[11px] text-slate-400">
                        {
                          enrollments.length
                        }{' '}
                        participant(s)
                      </p>

                    </div>

                    <Users
                      size={16}
                      className="text-slate-400"
                    />

                  </div>

                  {/* Loading */}

                  {loadingEnroll ? (
                    <div className="flex items-center justify-center gap-2 py-8 text-xs text-slate-400">

                      <Loader2
                        size={16}
                        className="animate-spin"
                      />

                      Loading participants...

                    </div>
                  ) : enrollments.length ===
                    0 ? (

                    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 py-8 text-center dark:border-slate-800 dark:bg-slate-800/30">

                      <Users
                        size={21}
                        className="mx-auto mb-2 text-slate-300 dark:text-slate-600"
                      />

                      <p className="text-xs font-medium text-slate-400">
                        No employees enrolled yet.
                      </p>

                    </div>

                  ) : (

                    <div className="space-y-2.5">

                      {enrollments.map(
                        (enrollment) => (
                          <div
                            key={
                              enrollment.id
                            }
                            className="rounded-xl border border-slate-200 p-3.5 dark:border-slate-800"
                          >

                            <div className="flex items-start justify-between gap-3">

                              <div className="min-w-0">

                                <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                                  {
                                    enrollment.employeeName
                                  }
                                </p>

                                <p className="mt-0.5 text-[10px] text-slate-400">
                                  Enrolled{' '}
                                  {enrollment.enrolledAt
                                    ? new Date(
                                      enrollment.enrolledAt
                                    ).toLocaleDateString()
                                    : 'N/A'}
                                </p>

                              </div>

                              <Badge
                                status={
                                  enrollment.completed
                                    ? 'COMPLETED'
                                    : enrollment.status
                                }
                              />

                            </div>

                            {/* Completed enrollment */}

                            {enrollment.completed ? (

                              <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">

                                <div className="flex items-center justify-between text-xs font-bold">

                                  <span>
                                    Score:{' '}
                                    {
                                      enrollment.score
                                    }
                                    /100
                                  </span>

                                  <span className="text-[10px] font-medium opacity-75">
                                    {enrollment.completedAt
                                      ? new Date(
                                        enrollment.completedAt
                                      ).toLocaleDateString()
                                      : ''}
                                  </span>

                                </div>

                                {enrollment.feedback && (
                                  <p className="mt-2 text-[11px] leading-4 opacity-90">
                                    {
                                      enrollment.feedback
                                    }
                                  </p>
                                )}

                              </div>

                            ) : completingId ===
                              enrollment.id ? (

                              /* Completion form */

                              <div className="mt-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">

                                <div className="grid grid-cols-[100px_1fr] gap-2">

                                  <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    placeholder="Score / 100"
                                    value={
                                      score
                                    }
                                    onChange={(
                                      e
                                    ) =>
                                      setScore(
                                        e
                                          .target
                                          .value
                                      )
                                    }
                                    className={
                                      inputClass
                                    }
                                  />

                                  <input
                                    type="text"
                                    placeholder="Feedback"
                                    value={
                                      feedback
                                    }
                                    onChange={(
                                      e
                                    ) =>
                                      setFeedback(
                                        e
                                          .target
                                          .value
                                      )
                                    }
                                    className={
                                      inputClass
                                    }
                                  />

                                </div>

                                <div className="mt-2 flex justify-end gap-2">

                                  <button
                                    onClick={() =>
                                      setCompletingId(
                                        null
                                      )
                                    }
                                    className="rounded-lg px-3 py-2 text-[11px] font-semibold text-slate-500 hover:bg-white dark:hover:bg-slate-900"
                                  >
                                    Cancel
                                  </button>

                                  <button
                                    disabled={
                                      completing ===
                                      enrollment.id
                                    }
                                    onClick={() =>
                                      handleComplete(
                                        enrollment.id
                                      )
                                    }
                                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-[11px] font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                                  >

                                    {completing ===
                                      enrollment.id && (
                                        <Loader2
                                          size={
                                            12
                                          }
                                          className="animate-spin"
                                        />
                                      )}

                                    Save Completion

                                  </button>

                                </div>

                              </div>

                            ) : (

                              /* Mark complete */

                              <button
                                onClick={() =>
                                  setCompletingId(
                                    enrollment.id
                                  )
                                }
                                className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:underline dark:text-emerald-400"
                              >

                                <CheckCircle2
                                  size={
                                    14
                                  }
                                />

                                Mark as Complete

                              </button>

                            )}

                          </div>
                        )
                      )}

                    </div>
                  )}

                </div>

              </div>

            </aside>
          )}

        </div>

        {/* ======================================================
            PART 2 CONTINUES:
            CREATE / EDIT / REOPEN MODAL
        ====================================================== */}
        {/* ======================================================
            CREATE / EDIT / REOPEN MODAL
        ====================================================== */}

        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">

            <div className="flex max-h-[94vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">

              {/* ==================================================
                  MODAL HEADER
              ================================================== */}

              <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5 dark:border-slate-800">

                <div>

                  <div className="flex items-center gap-2">

                    <div className="rounded-xl bg-slate-100 p-2 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                      <GraduationCap
                        size={17}
                      />
                    </div>

                    <h2 className="text-base font-bold text-slate-950 dark:text-white">

                      {formMode ===
                        'CREATE'
                        ? 'Create Training Program'
                        : formMode ===
                          'EDIT'
                          ? 'Edit Training Program'
                          : 'Re-open Training Program'}

                    </h2>

                  </div>

                  <p className="mt-1 pl-10 text-[11px] text-slate-400">

                    {formMode ===
                      'REOPEN'
                      ? 'Review the details before making this program active again.'
                      : 'Add the essential program information and schedule.'}

                  </p>

                </div>

                <button
                  type="button"
                  onClick={closeForm}
                  disabled={submitting}
                  className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                  aria-label="Close form"
                >
                  <X size={18} />
                </button>

              </div>

              {/* ==================================================
                  FORM
              ================================================== */}

              <form
                onSubmit={
                  handleSubmitTraining
                }
                className="overflow-y-auto p-6"
              >

                <div className="space-y-5">

                  {/* =================================================
                      TITLE
                  ================================================= */}

                  <Field
                    label="Training Title"
                    required
                  >

                    <input
                      type="text"
                      required
                      value={
                        form.title
                      }
                      onChange={(e) =>
                        setForm({
                          ...form,
                          title:
                            e.target.value,
                        })
                      }
                      className={
                        inputClass
                      }
                      placeholder="e.g. Advanced Java Microservices"
                    />

                  </Field>

                  {/* =================================================
                      DESCRIPTION
                  ================================================= */}

                  <Field
                    label="Description"
                    required
                  >

                    <textarea
                      rows={3}
                      required
                      value={
                        form.description
                      }
                      onChange={(e) =>
                        setForm({
                          ...form,
                          description:
                            e.target.value,
                        })
                      }
                      className={`${inputClass} resize-none`}
                      placeholder="Describe the training objectives, topics and expected outcomes..."
                    />

                  </Field>

                  {/* =================================================
                      CATEGORY + MODE
                  ================================================= */}

                  <div className="grid gap-4 sm:grid-cols-2">

                    <Field
                      label="Category"
                      required
                    >

                      <select
                        required
                        value={
                          form.category
                        }
                        onChange={(e) =>
                          setForm({
                            ...form,
                            category:
                              e.target.value,
                          })
                        }
                        className={
                          inputClass
                        }
                      >

                        <option value="TECHNICAL">
                          Technical
                        </option>

                        <option value="SOFT_SKILLS">
                          Soft Skills
                        </option>

                        <option value="COMPLIANCE">
                          Compliance
                        </option>

                        <option value="MANAGEMENT">
                          Management
                        </option>

                      </select>

                    </Field>

                    <Field
                      label="Mode"
                      required
                    >

                      <select
                        required
                        value={
                          form.mode
                        }
                        onChange={(e) =>
                          setForm({
                            ...form,
                            mode:
                              e.target.value,
                          })
                        }
                        className={
                          inputClass
                        }
                      >

                        <option value="ONLINE">
                          Online
                        </option>

                        <option value="OFFLINE">
                          Offline
                        </option>

                        <option value="HYBRID">
                          Hybrid
                        </option>

                      </select>

                    </Field>

                  </div>

                  {/* =================================================
                      TRAINER + DURATION
                  ================================================= */}

                  <div className="grid gap-4 sm:grid-cols-2">

                    <Field
                      label="Trainer"
                      required
                    >

                      <input
                        type="text"
                        required
                        value={
                          form.trainer
                        }
                        onChange={(e) =>
                          setForm({
                            ...form,
                            trainer:
                              e.target.value,
                          })
                        }
                        className={
                          inputClass
                        }
                        placeholder="Instructor name"
                      />

                    </Field>

                    <Field
                      label="Duration (Hours)"
                      required
                    >

                      <input
                        type="number"
                        required
                        min="0"
                        step="1"
                        value={
                          form.durationHours
                        }
                        onChange={(e) =>
                          setForm({
                            ...form,
                            durationHours:
                              e.target.value,
                          })
                        }
                        className={
                          inputClass
                        }
                        placeholder="10"
                      />

                    </Field>

                  </div>

                  {/* =================================================
                      START + END DATE
                  ================================================= */}

                  <div className="grid gap-4 sm:grid-cols-2">

                    <Field
                      label="Start Date"
                      required
                    >

                      <input
                        type="date"
                        required
                        min={
                          formMode ===
                            'CREATE'
                            ? todayStr
                            : undefined
                        }
                        value={
                          form.startDate
                        }
                        onChange={(e) => {

                          const startDate =
                            e.target.value;

                          setForm(
                            (prev) => ({
                              ...prev,

                              startDate,

                              endDate:
                                prev.endDate &&
                                  prev.endDate <
                                  startDate
                                  ? startDate
                                  : prev.endDate,
                            })
                          );

                        }}
                        className={
                          inputClass
                        }
                      />

                    </Field>

                    <Field
                      label="End Date"
                      required
                    >

                      <input
                        type="date"
                        required
                        min={
                          form.startDate ||
                          (formMode ===
                            'CREATE'
                            ? todayStr
                            : undefined)
                        }
                        value={
                          form.endDate
                        }
                        onChange={(e) => {

                          const endDate =
                            e.target.value;

                          if (
                            form.startDate &&
                            endDate <
                            form.startDate
                          ) {

                            toast.error(
                              'End Date cannot be before Start Date'
                            );

                            return;

                          }

                          setForm({
                            ...form,
                            endDate,
                          });

                        }}
                        className={
                          inputClass
                        }
                      />

                    </Field>

                  </div>

                  {/* =================================================
                      CAPACITY + VENUE
                  ================================================= */}

                  <div className="grid gap-4 sm:grid-cols-2">

                    <Field
                      label="Maximum Participants"
                      required
                    >

                      <input
                        type="number"
                        required
                        min="1"
                        step="1"
                        value={
                          form.maxParticipants
                        }
                        onChange={(e) =>
                          setForm({
                            ...form,
                            maxParticipants:
                              e.target.value,
                          })
                        }
                        className={
                          inputClass
                        }
                        placeholder="25"
                      />

                    </Field>

                    <Field
                      label="Venue"
                      required={
                        form.mode !==
                        'ONLINE'
                      }
                    >

                      <input
                        type="text"
                        required={
                          form.mode !==
                          'ONLINE'
                        }
                        value={
                          form.venue
                        }
                        onChange={(e) =>
                          setForm({
                            ...form,
                            venue:
                              e.target.value,
                          })
                        }
                        className={
                          inputClass
                        }
                        placeholder="Conference Room A"
                      />

                    </Field>

                  </div>

                  {/* =================================================
                      MEETING LINK
                  ================================================= */}

                  <Field
                    label="Meeting Link"
                    required={
                      form.mode !==
                      'OFFLINE'
                    }
                  >

                    <input
                      type="url"
                      required={
                        form.mode !==
                        'OFFLINE'
                      }
                      value={
                        form.meetingLink
                      }
                      onChange={(e) =>
                        setForm({
                          ...form,
                          meetingLink:
                            e.target.value,
                        })
                      }
                      className={
                        inputClass
                      }
                      placeholder="https://meet.google.com/..."
                    />

                  </Field>

                  {/* =================================================
                      HYBRID INFORMATION
                  ================================================= */}

                  {form.mode ===
                    'HYBRID' && (
                      <div className="flex gap-3 rounded-xl border border-blue-200 bg-blue-50 p-3 text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300">

                        <AlertCircle
                          size={16}
                          className="mt-0.5 shrink-0"
                        />

                        <p className="text-[11px] leading-5">

                          Hybrid programs require
                          both a physical venue and
                          a meeting link.

                        </p>

                      </div>
                    )}

                </div>

                {/* =================================================
                    FORM FOOTER
                ================================================= */}

                <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-5 dark:border-slate-800">

                  <button
                    type="button"
                    onClick={
                      closeForm
                    }
                    disabled={
                      submitting
                    }
                    className="rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 disabled:opacity-50 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={
                      submitting
                    }
                    className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-50 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                  >

                    {submitting && (
                      <Loader2
                        size={14}
                        className="animate-spin"
                      />
                    )}

                    {formMode ===
                      'CREATE'
                      ? 'Create Training'
                      : formMode ===
                        'EDIT'
                        ? 'Save Changes'
                        : 'Re-open Training'}

                  </button>

                </div>

              </form>

            </div>

          </div>
        )}

      </div>

    </div>
  );
}