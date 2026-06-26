"use client";

import { useState } from "react";
import type { FaqDocument } from "@/lib/types";
import { updateAnswer } from "@/lib/faq-storage";
import {
  createStep,
  createTip,
  hasHowToContent,
  parseHowToAnswer,
  serializeHowToContent,
  type HowToContent,
  type HowToStep,
  type HowToTip,
} from "@/lib/howto-content";
import { useConfirm } from "@/components/ConfirmProvider";

interface HowToContentEditorProps {
  entryId: string;
  answer: string;
  faq: FaqDocument;
  onChange: (doc: FaqDocument) => void;
}

const NEW_STEP_ID = "__new-step__";
const NEW_TIP_ID = "__new-tip__";

type EditingTarget =
  | { kind: "step"; id: string }
  | { kind: "tip"; id: string }
  | null;

function saveContent(
  faq: FaqDocument,
  entryId: string,
  content: HowToContent,
  onChange: (doc: FaqDocument) => void,
) {
  onChange(updateAnswer(faq, entryId, serializeHowToContent(content)));
}

function StepEditorRow({
  stepNumber,
  value,
  onChange,
  onSave,
  onCancel,
  placeholder,
}: {
  stepNumber: number;
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  placeholder: string;
}) {
  return (
    <li className="flex gap-3 text-[14px] leading-7 text-[#374151]">
      <span className="shrink-0 pt-0.5 tabular-nums font-medium">{stepNumber}.</span>
      <div className="min-w-0 flex-1 space-y-2">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          autoFocus
          className="w-full resize-y border-none bg-transparent p-0 text-[14px] leading-7 text-[#374151] placeholder:text-[#9ca3af] focus:outline-none"
          placeholder={placeholder}
        />
        <div className="flex gap-4 text-[13px]">
          <button
            type="button"
            onClick={onSave}
            className="text-[#374151] hover:underline"
          >
            Save
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="text-[#9ca3af] hover:text-[#6b7280]"
          >
            Cancel
          </button>
        </div>
      </div>
    </li>
  );
}

export default function HowToContentEditor({
  entryId,
  answer,
  faq,
  onChange,
}: HowToContentEditorProps) {
  const content = parseHowToAnswer(answer);
  const [editing, setEditing] = useState<EditingTarget>(null);
  const [draftText, setDraftText] = useState("");
  const confirm = useConfirm();

  const persist = (next: HowToContent) => {
    saveContent(faq, entryId, next, onChange);
  };

  const startEdit = (target: EditingTarget, text: string) => {
    setEditing(target);
    setDraftText(text);
  };

  const cancelEdit = () => {
    setEditing(null);
    setDraftText("");
  };

  const saveEdit = () => {
    if (!editing) return;
    const trimmed = draftText.trim();

    if (editing.kind === "step") {
      if (editing.id === NEW_STEP_ID) {
        if (trimmed) {
          persist({ ...content, steps: [...content.steps, createStep(trimmed)] });
        }
      } else if (!trimmed) {
        persist({
          ...content,
          steps: content.steps.filter((step) => step.id !== editing.id),
        });
      } else {
        persist({
          ...content,
          steps: content.steps.map((step) =>
            step.id === editing.id ? { ...step, text: trimmed } : step,
          ),
        });
      }
    } else if (editing.id === NEW_TIP_ID) {
      if (trimmed) {
        persist({ ...content, tips: [...content.tips, createTip(trimmed)] });
      }
    } else if (!trimmed) {
      persist({
        ...content,
        tips: content.tips.filter((tip) => tip.id !== editing.id),
      });
    } else {
      persist({
        ...content,
        tips: content.tips.map((tip) =>
          tip.id === editing.id ? { ...tip, text: trimmed } : tip,
        ),
      });
    }

    cancelEdit();
  };

  const addStep = () => {
    startEdit({ kind: "step", id: NEW_STEP_ID }, "");
  };

  const addTip = () => {
    startEdit({ kind: "tip", id: NEW_TIP_ID }, "");
  };

  const nextStepNumber = content.steps.length + 1;
  const isAddingStep = editing?.kind === "step" && editing.id === NEW_STEP_ID;

  const renderStep = (step: HowToStep, index: number) => {
    const isEditing = editing?.kind === "step" && editing.id === step.id;

    if (isEditing) {
      return (
        <StepEditorRow
          key={step.id}
          stepNumber={index + 1}
          value={draftText}
          onChange={setDraftText}
          onSave={saveEdit}
          onCancel={cancelEdit}
          placeholder="Type the instruction…"
        />
      );
    }

    return (
      <li key={step.id} className="group flex gap-3 text-[14px] leading-7 text-[#374151]">
        <span className="shrink-0 tabular-nums font-medium">{index + 1}.</span>
        <div className="min-w-0 flex-1">
          <button
            type="button"
            onClick={() => startEdit({ kind: "step", id: step.id }, step.text)}
            className="w-full cursor-text text-left hover:text-[#111827]"
          >
            {step.text}
          </button>
          <div className="mt-1 flex gap-3 text-[12px] text-[#9ca3af]">
            <button
              type="button"
              onClick={() => startEdit({ kind: "step", id: step.id }, step.text)}
              className="hover:text-[#6b7280] hover:underline"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => {
                void confirm({ message: "Are you sure you want to delete this step?" }).then(
                  (ok) => {
                    if (ok) {
                      persist({
                        ...content,
                        steps: content.steps.filter((item) => item.id !== step.id),
                      });
                    }
                  },
                );
              }}
              className="hover:text-[#6b7280] hover:underline"
            >
              Delete
            </button>
          </div>
        </div>
      </li>
    );
  };

  const renderTip = (tip: HowToTip) => {
    const isEditing = editing?.kind === "tip" && editing.id === tip.id;

    if (isEditing) {
      return (
        <div key={tip.id} className="space-y-2 rounded-md bg-[#eff6ff] px-4 py-3">
          <textarea
            value={draftText}
            onChange={(e) => setDraftText(e.target.value)}
            rows={3}
            autoFocus
            className="w-full resize-y border-none bg-transparent p-0 text-[14px] leading-7 text-[#1e40af] italic placeholder:text-[#93c5fd] focus:outline-none"
            placeholder="Type your tip here…"
          />
          <div className="flex gap-4 text-[13px] not-italic">
            <button
              type="button"
              onClick={saveEdit}
              className="text-[#1e40af] hover:underline"
            >
              Save
            </button>
            <button
              type="button"
              onClick={cancelEdit}
              className="text-[#93c5fd] hover:text-[#1e40af]"
            >
              Cancel
            </button>
          </div>
        </div>
      );
    }

    return (
      <div
        key={tip.id}
        className="group flex gap-2 rounded-md bg-[#eff6ff] px-4 py-3 text-[14px] leading-7 text-[#1e40af]"
      >
        <span
          className="material-symbols-outlined mt-0.5 shrink-0 text-[18px] text-[#3b82f6]"
          aria-hidden
        >
          lightbulb
        </span>
        <div className="min-w-0 flex-1">
          <button
            type="button"
            onClick={() => startEdit({ kind: "tip", id: tip.id }, tip.text)}
            className="w-full cursor-text text-left"
          >
            <p className="italic">
              <span className="font-semibold not-italic">Tip:</span> {tip.text}
            </p>
          </button>
          <div className="mt-1 flex gap-3 text-[12px] not-italic">
            <button
              type="button"
              onClick={() => startEdit({ kind: "tip", id: tip.id }, tip.text)}
              className="text-[#3b82f6] hover:underline"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => {
                void confirm({ message: "Are you sure you want to delete this tip?" }).then(
                  (ok) => {
                    if (ok) {
                      persist({
                        ...content,
                        tips: content.tips.filter((item) => item.id !== tip.id),
                      });
                    }
                  },
                );
              }}
              className="text-[#3b82f6] hover:underline"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderNewTip = () => {
    if (editing?.kind !== "tip" || editing.id !== NEW_TIP_ID) return null;

    return (
      <div className="space-y-2 rounded-md bg-[#eff6ff] px-4 py-3">
        <div className="flex gap-2 text-[14px] leading-7 text-[#1e40af]">
          <span
            className="material-symbols-outlined mt-0.5 shrink-0 text-[18px] text-[#3b82f6]"
            aria-hidden
          >
            lightbulb
          </span>
          <span className="shrink-0 font-semibold not-italic">Tip:</span>
          <textarea
            value={draftText}
            onChange={(e) => setDraftText(e.target.value)}
            rows={3}
            autoFocus
            className="min-w-0 flex-1 resize-y border-none bg-transparent p-0 italic placeholder:text-[#93c5fd] focus:outline-none"
            placeholder="Type your tip here…"
          />
        </div>
        <div className="flex gap-4 text-[13px] not-italic">
          <button
            type="button"
            onClick={saveEdit}
            className="text-[#1e40af] hover:underline"
          >
            Save
          </button>
          <button
            type="button"
            onClick={cancelEdit}
            className="text-[#93c5fd] hover:text-[#1e40af]"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {(content.steps.length > 0 || isAddingStep) && (
        <ol className="list-none space-y-3">
          {content.steps.map(renderStep)}
          {isAddingStep && (
            <StepEditorRow
              stepNumber={nextStepNumber}
              value={draftText}
              onChange={setDraftText}
              onSave={saveEdit}
              onCancel={cancelEdit}
              placeholder="Type the instruction…"
            />
          )}
        </ol>
      )}

      {content.tips.map(renderTip)}
      {renderNewTip()}

      {!hasHowToContent(content) && !editing && (
        <p className="text-[14px] leading-7 text-[#9ca3af]">
          Click <span className="text-[#6b7280]">Add step</span> to add instruction{" "}
          <span className="text-[#6b7280]">1.</span>, then type and save. Each new
          step gets the next number automatically.
        </p>
      )}

      <div className="flex flex-wrap gap-4 pt-2 text-[13px] text-[#9ca3af]">
        <button
          type="button"
          onClick={addStep}
          disabled={isAddingStep}
          className="hover:text-[#6b7280] hover:underline disabled:cursor-not-allowed disabled:opacity-40"
        >
          Add step{content.steps.length > 0 ? ` (${nextStepNumber}.)` : ""}
        </button>
        <button
          type="button"
          onClick={addTip}
          disabled={editing?.kind === "tip"}
          className="hover:text-[#6b7280] hover:underline disabled:cursor-not-allowed disabled:opacity-40"
        >
          Add tip
        </button>
      </div>
    </div>
  );
}
