import { useId, useState, useSyncExternalStore } from "react";
import { Check } from "lucide-react";
import { ActionPopover } from "./ui/ActionPopover";
import { locales, type Locale } from "../i18n/locales";
import { useMessages } from "../i18n/react";
import { currentLocale, languageIssue, selectLocale, subscribeLocale } from "../i18n/runtime";

export function LanguagePicker() {
  const { text } = useMessages();
  const locale = useSyncExternalStore(subscribeLocale, currentLocale);
  const issue = useSyncExternalStore(subscribeLocale, languageIssue);
  const selected = locales.find((item) => item.code === locale)!;
  return (
    <ActionPopover
      label={text("language.choose", { language: selected.name })}
      icon={<CountryFlag country={selected.country} />}
      iconOnly
      placement="top-end"
      className={issue ? "language-trigger status-warning" : "language-trigger"}
    >
      {(close) => <LanguageOptions close={close} />}
    </ActionPopover>
  );
}

function CountryFlag({ country }: { country: string }) {
  return (
    <img
      className="language-flag"
      src={new URL(`../assets/flags/${country}.svg`, import.meta.url).href}
      alt=""
      aria-hidden="true"
    />
  );
}

function LanguageOptions({ close }: { close: () => void }) {
  const { text, renderMessage } = useMessages();
  const locale = useSyncExternalStore(subscribeLocale, currentLocale);
  const issue = useSyncExternalStore(subscribeLocale, languageIssue);
  const [pending, setPending] = useState(false);
  const id = useId();
  const choose = async (next: Locale) => {
    setPending(true);
    const success = await selectLocale(next);
    setPending(false);
    if (success && !languageIssue()) close();
  };
  return (
    <section className="language-panel" aria-labelledby={id} aria-busy={pending}>
      <h2 id={id}>{text("language.title")}</h2>
      <fieldset disabled={pending} aria-label={text("language.title")}>
        {locales.map((item) => (
          <label key={item.code} className="language-option" lang={item.code}>
            <input
              type="radio"
              name={id}
              value={item.code}
              checked={item.code === locale}
              onClick={() => {
                if (item.code === locale) void choose(item.code);
              }}
              onChange={() => void choose(item.code)}
            />
            <CountryFlag country={item.country} />
            <span>{item.name}</span>
            {item.code === locale && <Check size={15} aria-hidden="true" />}
          </label>
        ))}
      </fieldset>
      <div role="status" aria-live="polite">
        {pending && <p>{text("language.loading")}</p>}
        {issue && <p className="status-warning">{renderMessage(issue)}</p>}
      </div>
    </section>
  );
}
