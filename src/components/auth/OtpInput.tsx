import { useMemo, useRef, type ClipboardEvent, type KeyboardEvent } from "react";

interface OtpInputProps {
  /** Number of digit boxes. */
  length: number;
  /** Current value (the concatenated digits, may be shorter than `length`). */
  value: string;
  /** Called with the new concatenated value whenever it changes. */
  onChange: (next: string) => void;
  /** Fired when all `length` digits are filled (e.g. via paste). */
  onComplete?: (value: string) => void;
  /** Disables all boxes (during verification). */
  disabled?: boolean;
  /** Marks the group invalid for assistive tech + red borders. */
  invalid?: boolean;
  /** id used for the group's aria-labelledby target. */
  labelId?: string;
}

/**
 * A numeric one-time-code input rendered as `length` separate boxes.
 *
 * Behaviour: numeric-only, auto-advance on entry, backspace moves to the
 * previous box, arrow keys navigate, and pasting a full code fills every box.
 * `inputMode="numeric"` + `autoComplete="one-time-code"` give the right mobile
 * keyboard and OS autofill. Nothing is persisted here — the value is owned by
 * the parent and never written to storage.
 */
export default function OtpInput({
  length,
  value,
  onChange,
  onComplete,
  disabled = false,
  invalid = false,
  labelId,
}: OtpInputProps) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  // Split the controlled value into per-box characters.
  const chars = useMemo(() => {
    const out = new Array<string>(length).fill("");
    for (let i = 0; i < Math.min(value.length, length); i += 1) {
      out[i] = value[i];
    }
    return out;
  }, [value, length]);

  function focusBox(index: number) {
    const clamped = Math.max(0, Math.min(length - 1, index));
    refs.current[clamped]?.focus();
    refs.current[clamped]?.select();
  }

  function commit(next: string) {
    const cleaned = next.replace(/\D/g, "").slice(0, length);
    onChange(cleaned);
    if (cleaned.length === length) onComplete?.(cleaned);
  }

  function handleChange(index: number, raw: string) {
    const digit = raw.replace(/\D/g, "");
    if (!digit) {
      // Cleared this box.
      const arr = [...chars];
      arr[index] = "";
      commit(arr.join(""));
      return;
    }
    // Typing possibly multiple digits (fast typing / partial paste into a box).
    const arr = [...chars];
    let cursor = index;
    for (const d of digit) {
      if (cursor >= length) break;
      arr[cursor] = d;
      cursor += 1;
    }
    commit(arr.join(""));
    focusBox(cursor);
  }

  function handleKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace") {
      if (chars[index]) {
        const arr = [...chars];
        arr[index] = "";
        commit(arr.join(""));
      } else if (index > 0) {
        const arr = [...chars];
        arr[index - 1] = "";
        commit(arr.join(""));
        focusBox(index - 1);
      }
      e.preventDefault();
    } else if (e.key === "ArrowLeft") {
      focusBox(index - 1);
      e.preventDefault();
    } else if (e.key === "ArrowRight") {
      focusBox(index + 1);
      e.preventDefault();
    }
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "");
    if (!pasted) return;
    e.preventDefault();
    commit(pasted.slice(0, length));
    focusBox(pasted.length);
  }

  return (
    <div
      className="flex justify-between gap-1.5 sm:gap-2"
      role="group"
      aria-labelledby={labelId}
    >
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          pattern="[0-9]*"
          maxLength={1}
          value={chars[i]}
          disabled={disabled}
          aria-invalid={invalid || undefined}
          aria-label={`Digit ${i + 1} of ${length}`}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          className={`h-11 w-full min-w-0 rounded-[10px] border bg-white/[0.045] text-center font-mono text-[16px] font-semibold text-content tabular-nums transition-[border-color,background-color,box-shadow] duration-200 ease-ease focus:outline-none disabled:opacity-60 ${
            invalid
              ? "border-bad focus:border-bad"
              : "border-hair-soft focus:border-accent focus:bg-white/[0.07]"
          }`}
        />
      ))}
    </div>
  );
}
