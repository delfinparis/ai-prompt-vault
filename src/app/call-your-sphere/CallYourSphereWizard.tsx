"use client";

import React, { useState } from "react";

type ActionType = "call" | "text" | "voicemail" | "super_small";

type ScriptResult = {
  call_script: string;
  text_script: string;
  voicemail_script: string;
  conversation_prompts: string[];
  referral_segue: string;
};

type WizardState = {
  step: number;
  blockReason?: string;
  emotion?: string;
  fearStory?: string;
  actionType?: ActionType;
  contactName?: string;
  contactNotes?: string;
  scriptResult?: ScriptResult;
  isLoading: boolean;
  error?: string;
};

const initialState: WizardState = {
  step: 1,
  isLoading: false,
};

const blockReasons = [
  "It’s been too long — feels awkward now.",
  "I don’t want to bother people.",
  "I don’t want to seem salesy.",
  "I don’t know what to say.",
  "I’m embarrassed I haven’t kept up.",
  "I just avoid it and don’t know why.",
];

const emotions = [
  "Anxiety",
  "Guilt",
  "Dread",
  "Awkwardness",
  "Overwhelm",
  "Nothing specific. I just procrastinate.",
];

const fearStories = [
  "They’ll think I’m only calling for business.",
  "They’ll judge me for being inconsistent.",
  "It’ll feel awkward.",
  "I won’t know what to say.",
  "They might ask questions I’m not ready for.",
  "Nothing specific… I just avoid it.",
];

const actionOptions: { key: ActionType; label: string }[] = [
  { key: "call", label: "Call ONE past client I like." },
  { key: "text", label: "Send a quick text instead." },
  { key: "voicemail", label: "Leave a voicemail (no live conversation)." },
  { key: "super_small", label: "Help me make this even smaller." },
];

export default function CallYourSphereWizard() {
  const [state, setState] = useState<WizardState>(initialState);

  const next = () => setState((s) => ({ ...s, step: s.step + 1 }));
  const back = () =>
    setState((s) => ({ ...s, step: s.step > 1 ? s.step - 1 : 1 }));

  const setBlockReason = (value: string) =>
    setState((s) => ({ ...s, blockReason: value }));
  const setEmotion = (value: string) =>
    setState((s) => ({ ...s, emotion: value }));
  const setFearStory = (value: string) =>
    setState((s) => ({ ...s, fearStory: value }));
  const setActionType = (value: ActionType) =>
    setState((s) => ({ ...s, actionType: value }));
  const setContactName = (value: string) =>
    setState((s) => ({ ...s, contactName: value }));
  const setContactNotes = (value: string) =>
    setState((s) => ({ ...s, contactNotes: value }));

  async function handleGenerateScript() {
    if (!state.contactName || !state.actionType) return;

    setState((s) => ({
      ...s,
      isLoading: true,
      error: undefined,
    }));

    try {
      // 🚫 No API call — generate a good local script instead
      const name = state.contactName || "there";

      const scriptResult: ScriptResult = {
        call_script: `Hey ${name}, it's your agent. I was thinking about you and realized it's been a while since we last caught up. No agenda at all – I'd just love to hear how you're doing and what's new. Got a minute to chat this week?`,
        text_script: `Hey ${name} 😊 It’s your agent. I was going through my past clients and realized it’s been a while since we’ve caught up. No real estate agenda – I’d just love to hear how you're doing. Would it be okay if I gave you a quick call sometime this week?`,
        voicemail_script: `Hey ${name}, it's your agent. Just calling because I realized it’s been a while and wanted to check in and see how you’re doing. No pressure to call back right away, but if you have a minute this week, I’d love to reconnect. My number is [your number]. Talk soon!`,
        conversation_prompts: [
          "Ask how life / work / family has been since you last spoke.",
          "Ask about any big changes or plans they’re excited about.",
          "Share one small personal update from your own life to keep things human.",
        ],
        referral_segue:
          "By the way, no pressure at all, but if anyone you care about ever mentions buying, selling, or just has questions about real estate, you can always send them my way. I'm happy to be a resource for them like I've tried to be for you.",
      };

      setState((s) => ({
        ...s,
        scriptResult,
        isLoading: false,
        step: 10,
      }));
    } catch (err: any) {
      console.error("Unexpected error in handleGenerateScript:", err);
      setState((s) => ({
        ...s,
        isLoading: false,
        error:
          "Something unexpected happened. Try again, or refresh the page.",
      }));
    }
  }

  function renderStep() {
    switch (state.step) {
      case 1:
        return (
          <StepCard>
            <StepHeader
              title="Call Your Sphere"
              subtitle="The easiest way to reconnect with your past clients — one call at a time."
            />
            <p className="text-sm text-slate-300 mb-6">
              No pressure. No scripts to memorize. No guilt about “not keeping
              up.” Just one tiny step today.
            </p>
            <PrimaryButton onClick={next}>Let’s Begin</PrimaryButton>
          </StepCard>
        );
      case 2:
        return (
          <StepCard onBack={back}>
            <StepHeader title="You already know this works." />
            <p className="text-sm text-slate-300 mb-3">
              If you&apos;re like most agents, you mean to call your past
              clients… but you put it off. Then you feel bad. Then more time
              passes. Then it feels even harder.
            </p>
            <p className="text-sm text-slate-400 mb-6">
              That&apos;s completely normal.
            </p>
            <PrimaryButton onClick={next}>Yep, that’s me</PrimaryButton>
          </StepCard>
        );
      case 3:
        return (
          <StepCard onBack={back}>
            <StepHeader title="You’re not behind. You’re human." />
            <p className="text-sm text-slate-300 mb-3">
              Almost every agent avoids these calls because of:
            </p>
            <ul className="text-sm text-slate-300 mb-4 list-disc list-inside space-y-1">
              <li>Awkwardness</li>
              <li>Anxiety</li>
              <li>Guilt</li>
              <li>Overwhelm</li>
              <li>Not knowing what to say</li>
            </ul>
            <p className="text-sm text-slate-400 mb-6">
              Nothing is wrong with you. Let&apos;s just make this easier.
            </p>
            <PrimaryButton onClick={next}>Okay, I’m ready</PrimaryButton>
          </StepCard>
        );
      case 4:
        return (
          <StepCard onBack={back}>
            <StepHeader title="What usually stops you?" />
            <p className="text-sm text-slate-300 mb-4">
              Which of these feels most true for you?
            </p>
            <div className="space-y-2 mb-6">
              {blockReasons.map((reason) => (
                <ChoiceButton
                  key={reason}
                  label={reason}
                  selected={state.blockReason === reason}
                  onClick={() => setBlockReason(reason)}
                />
              ))}
            </div>
            <PrimaryButton onClick={next} disabled={!state.blockReason}>
              Next
            </PrimaryButton>
          </StepCard>
        );
      case 5:
        return (
          <StepCard onBack={back}>
            <StepHeader title="What do you feel first?" />
            <p className="text-sm text-slate-300 mb-4">
              When you think about calling your past clients, what’s the first
              feeling you notice?
            </p>
            <div className="space-y-2 mb-6">
              {emotions.map((em) => (
                <ChoiceButton
                  key={em}
                  label={em}
                  selected={state.emotion === em}
                  onClick={() => setEmotion(em)}
                />
              ))}
            </div>
            <PrimaryButton onClick={next} disabled={!state.emotion}>
              Next
            </PrimaryButton>
          </StepCard>
        );
      case 6:
        return (
          <StepCard onBack={back}>
            <StepHeader title="What’s the story your brain tells you?" />
            <p className="text-sm text-slate-300 mb-4">
              If you reached out today, what&apos;s the little story your brain
              tells you might happen?
            </p>
            <div className="space-y-2 mb-6">
              {fearStories.map((story) => (
                <ChoiceButton
                  key={story}
                  label={story}
                  selected={state.fearStory === story}
                  onClick={() => setFearStory(story)}
                />
              ))}
            </div>
            <PrimaryButton onClick={next} disabled={!state.fearStory}>
              Next
            </PrimaryButton>
          </StepCard>
        );
      case 7:
        return (
          <StepCard onBack={back}>
            <StepHeader title="Good news: all of this is normal." />
            <p className="text-sm text-slate-300 mb-3">
              Past clients love hearing from their agents. They want to feel
              remembered.
            </p>
            <p className="text-sm text-slate-300 mb-3">
              You&apos;re not calling to beg for business. You&apos;re calling
              as a human reconnecting with humans.
            </p>
            <p className="text-sm text-slate-400 mb-6">
              You&apos;re not behind — you&apos;re restarting.
            </p>
            <PrimaryButton onClick={next}>
              Show me the smallest step
            </PrimaryButton>
          </StepCard>
        );
      case 8:
        return (
          <StepCard onBack={back}>
            <StepHeader title="What’s the smallest step you’re willing to take today?" />
            <div className="space-y-2 mb-6">
              {actionOptions.map((action) => (
                <ChoiceButton
                  key={action.key}
                  label={action.label}
                  selected={state.actionType === action.key}
                  onClick={() => setActionType(action.key)}
                />
              ))}
            </div>
            <PrimaryButton onClick={next} disabled={!state.actionType}>
              Next
            </PrimaryButton>
          </StepCard>
        );
      case 9:
        return (
          <StepCard onBack={back}>
          <StepHeader title="Who’s one past client you’d feel okay reaching out to?" />
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-1">
                Name
              </label>
              <input
                type="text"
                className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                value={state.contactName || ""}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="Sarah Johnson"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-1">
                Notes (optional)
              </label>
              <textarea
                className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-50 focus:outline-none focus:ring-1 focus:ring-emerald-500 min-h-[80px]"
                value={state.contactNotes || ""}
                onChange={(e) => setContactNotes(e.target.value)}
                placeholder="Bought a 3/2 in 2021. Mentioned maybe needing more space. Has a golden retriever."
              />
            </div>
          </div>
          {state.error && (
            <p className="text-sm text-red-400 mb-3">{state.error}</p>
          )}
          <PrimaryButton
            onClick={handleGenerateScript}
            disabled={!state.contactName || state.isLoading}
          >
            {state.isLoading ? "Generating..." : "Generate my script"}
          </PrimaryButton>
        </StepCard>
      );
      case 10:
        return (
          <StepCard onBack={back}>
            <StepHeader
              title={`Here’s what to say to ${
                state.contactName || "your client"
              }`}
            />
            {state.scriptResult ? (
              <ScriptTabs result={state.scriptResult} />
            ) : (
              <p className="text-sm text-slate-300 mb-6">
                No script yet — try going back and generating again.
              </p>
            )}
            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <PrimaryButton onClick={next}>I’ll make this call</PrimaryButton>
              <SecondaryButton onClick={next}>I’ll do it later</SecondaryButton>
            </div>
          </StepCard>
        );
      case 11:
        return (
          <StepCard onBack={back}>
            <StepHeader title="When will you reach out?" />
            <div className="space-y-2 mb-6">
              {[
                "Right now",
                "After lunch",
                "This evening",
                "Tomorrow morning",
              ].map((opt) => (
                <ChoiceButton
                  key={opt}
                  label={opt}
                  selected={false}
                  onClick={() => {
                    next();
                  }}
                />
              ))}
            </div>
          </StepCard>
        );
      case 12:
        return (
          <StepCard>
            <StepHeader title="Amazing. You just restarted the habit." />
            <p className="text-sm text-slate-300 mb-3">
              One call a day will change your business permanently. I&apos;ll be
              here to support you every step of the way.
            </p>
            <p className="text-sm text-slate-400 mb-6">
              When you&apos;re ready, come back and we&apos;ll pick the next
              person together.
            </p>
            <PrimaryButton onClick={() => setState(initialState)}>
              Start Another Call
            </PrimaryButton>
          </StepCard>
        );
      default:
        return null;
    }
  }

  return <div className="w-full">{renderStep()}</div>;
}

function StepCard({
  children,
  onBack,
}: {
  children: React.ReactNode;
  onBack?: () => void;
}) {
  return (
    <div className="relative rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-6 sm:px-6 sm:py-8 shadow-sm">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="absolute left-4 top-4 text-xs text-slate-400 hover:text-slate-200"
        >
          ← Back
        </button>
      )}
      {children}
    </div>
  );
}

function StepHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-4">
      <h2 className="text-xl sm:text-2xl font-semibold text-slate-50 mb-1">
        {title}
      </h2>
      {subtitle && <p className="text-sm text-slate-300">{subtitle}</p>}
    </div>
  );
}

function PrimaryButton({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center rounded-md px-5 py-2.5 text-sm font-semibold shadow-sm transition ${
        disabled
          ? "bg-slate-700 text-slate-400 cursor-not-allowed"
          : "bg-emerald-500 text-slate-950 hover:bg-emerald-400"
      }`}
    >
      {children}
    </button>
  );
}

function SecondaryButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center justify-center rounded-md border border-slate-600 px-5 py-2.5 text-sm font-semibold text-slate-100 hover:bg-slate-900/60 transition"
    >
      {children}
    </button>
  );
}

function ChoiceButton({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left rounded-lg border px-3 py-2 text-sm transition ${
        selected
          ? "border-emerald-400 bg-emerald-500/10 text-emerald-100"
          : "border-slate-700 bg-slate-900 text-slate-100 hover:border-slate-500"
      }`}
    >
      {label}
    </button>
  );
}

function ScriptTabs({ result }: { result: ScriptResult }) {
  const [tab, setTab] = useState<"call" | "text" | "voicemail" | "prompts">(
    "call"
  );

  const handleCopy = (text: string) => {
    if (!navigator?.clipboard) return;
    navigator.clipboard.writeText(text).catch(() => {});
  };

  const tabButtonClass = (active: boolean) =>
    `text-xs sm:text-sm px-3 py-1.5 rounded-full border transition ${
      active
        ? "border-emerald-400 bg-emerald-500/10 text-emerald-100"
        : "border-slate-700 bg-slate-900 text-slate-200 hover:border-slate-500"
    }`;

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          type="button"
          className={tabButtonClass(tab === "call")}
          onClick={() => setTab("call")}
        >
          Call Script
        </button>
        <button
          type="button"
          className={tabButtonClass(tab === "text")}
          onClick={() => setTab("text")}
        >
          Text
        </button>
        <button
          type="button"
          className={tabButtonClass(tab === "voicemail")}
          onClick={() => setTab("voicemail")}
        >
          Voicemail
        </button>
        <button
          type="button"
          className={tabButtonClass(tab === "prompts")}
          onClick={() => setTab("prompts")}
        >
          Conversation Prompts
        </button>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-100">
        {tab === "call" && (
          <>
            <p className="whitespace-pre-line mb-3">{result.call_script}</p>
            <button
              type="button"
              onClick={() => handleCopy(result.call_script)}
              className="text-xs text-emerald-300 hover:text-emerald-200"
            >
              Copy call script
            </button>
          </>
        )}
        {tab === "text" && (
          <>
            <p className="whitespace-pre-line mb-3">{result.text_script}</p>
            <button
              type="button"
              onClick={() => handleCopy(result.text_script)}
              className="text-xs text-emerald-300 hover:text-emerald-200"
            >
              Copy text
            </button>
          </>
        )}
        {tab === "voicemail" && (
          <>
            <p className="whitespace-pre-line mb-3">
              {result.voicemail_script}
            </p>
            <button
              type="button"
              onClick={() => handleCopy(result.voicemail_script)}
              className="text-xs text-emerald-300 hover:text-emerald-200"
            >
              Copy voicemail
            </button>
          </>
        )}
        {tab === "prompts" && (
          <ul className="list-disc list-inside space-y-1">
            {result.conversation_prompts?.map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </ul>
        )}
      </div>

      {result.referral_segue && (
        <div className="mt-4 text-xs text-slate-400">
          <div className="font-semibold text-slate-300 mb-1">
            Optional referral segue:
          </div>
          <p className="whitespace-pre-line">{result.referral_segue}</p>
        </div>
      )}
    </div>
  );
}