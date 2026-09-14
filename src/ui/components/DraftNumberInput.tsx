import {
  useState,
  type ChangeEvent,
  type FocusEvent,
  type InputHTMLAttributes,
  type JSX,
} from 'react';

type DraftNumberInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type' | 'value' | 'onChange'
> & {
  /** What the store holds, as the field shows it when nobody is typing. */
  value: number | string;
  /** The text after every keystroke. The caller stores what the model
   *  accepts and ignores the rest. */
  onValueText: (text: string) => void;
};

/**
 * A number field a person can type through.
 *
 * An input bound straight to the store puts the store's value back
 * after every keystroke the model refuses, so "0.5" typed over a basin
 * of 3 km² came out as 3.5: the 0 was refused, the 3 came back, and
 * ".5" landed after it. Here the text stays the typist's while the
 * field has focus, every accepted value reaches the store as it is
 * typed, and leaving the field shows what the store kept.
 */
export function DraftNumberInput({
  value,
  onValueText,
  onBlur,
  ...rest
}: DraftNumberInputProps): JSX.Element {
  const [draft, setDraft] = useState<string | null>(null);
  const change = (e: ChangeEvent<HTMLInputElement>): void => {
    setDraft(e.target.value);
    onValueText(e.target.value);
  };
  const blur = (e: FocusEvent<HTMLInputElement>): void => {
    setDraft(null);
    onBlur?.(e);
  };
  return <input {...rest} type="number" value={draft ?? value} onChange={change} onBlur={blur} />;
}
