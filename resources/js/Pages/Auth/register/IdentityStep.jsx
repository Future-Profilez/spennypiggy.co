import { useEffect, useRef, useState } from "react";
import Field from "./Field";
import StepShell, { RHYTHM } from "./StepShell";
import { ROLE_CREATOR, accentFor, suggestUsernames } from "./constants";

/**
 * Screen one of the form: who you are.
 *
 * Name and username only. The username is the slowest field on any signup —
 * it's the one with unread rules that can come back "taken" — so it is offered
 * as tappable suggestions built from the name, with the first available one
 * already filled in. The common path is: type your name, press Continue.
 */
export default function IdentityStep({
    role,
    data,
    setData,
    fieldStatus,
    fieldError,
    onFieldBlur,
    takenUsername,
    onSubmit,
    canContinue,
}) {
    const accent = accentFor(role);
    const isCreator = Number(role) === ROLE_CREATOR;
    const [suggestions, setSuggestions] = useState([]);
    const [editingHandle, setEditingHandle] = useState(false);
    // Once someone edits the handle themselves, suggestions stop overwriting it.
    const handleTouched = useRef(false);

    useEffect(() => {
        const next = suggestUsernames(data.name);
        setSuggestions(next);

        if (handleTouched.current) return;
        if (next.length && data.username !== next[0]) {
            setData("username", next[0]);
        }
        if (!next.length && data.username) {
            setData("username", "");
        }
    }, [data.name]);

    // A taken suggestion is worse than none, so move to the next one. The
    // verdict carries the handle it applies to — acting on a bare "taken" flag
    // skipped the following suggestion too, because the flag was still true for
    // one render after the value changed.
    useEffect(() => {
        if (handleTouched.current) return;
        if (!takenUsername || takenUsername !== data.username) return;

        const i = suggestions.indexOf(takenUsername);
        if (i > -1 && suggestions[i + 1]) {
            setData("username", suggestions[i + 1]);
        }
    }, [takenUsername, suggestions, data.username]);

    const pick = (value) => {
        handleTouched.current = true;
        setData("username", value);
        onFieldBlur("username");
    };

    return (
        <StepShell
            role={role}
            title={isCreator ? "What's your name?" : "What should we call you?"}
            subtitle={
                isCreator
                    ? "This is the name on your page. Change it any time."
                    : "Creators see this when you buy from them."
            }
            onSubmit={onSubmit}
            action="Continue"
            actionDisabled={!canContinue}
        >
            <Field
                id="name"
                name="name"
                label={isCreator ? "Display name" : "Your name"}
                value={data.name}
                autoComplete="name"
                autoFocus
                placeholder="Eg. Ava Collins"
                status={fieldStatus("name")}
                error={fieldError("name")}
                onChange={(e) => setData("name", e.target.value)}
                onBlur={() => onFieldBlur("name")}
            />

            {data.name.trim() && (
                <div className={RHYTHM.panelDivide}>
                    {editingHandle || !suggestions.length ? (
                        <Field
                            id="username"
                            name="username"
                            label="Username"
                            value={data.username}
                            autoComplete="username"
                            autoCapitalize="none"
                            spellCheck="false"
                            placeholder="priyasharma"
                            prefix="@"
                            status={fieldStatus("username")}
                            error={fieldError("username")}
                            hint={
                                isCreator
                                    ? `spennypiggy.co/${data.username || "your-username"}`
                                    : undefined
                            }
                            onChange={(e) => {
                                handleTouched.current = true;
                                setData(
                                    "username",
                                    e.target.value.toLowerCase(),
                                );
                            }}
                            onBlur={() => onFieldBlur("username")}
                        />
                    ) : (
                        <>
                            <div className="mb-2 flex items-baseline justify-between gap-3">
                                <span className="text-[12px] font-semibold uppercase tracking-[0.14em] text-black/60">
                                    Your username
                                </span>
                                <button
                                    type="button"
                                    onClick={() => {
                                        handleTouched.current = true;
                                        setEditingHandle(true);
                                    }}
                                    className="text-xs font-semibold text-black/60 underline decoration-2 underline-offset-2 hover:text-black"
                                >
                                    Type my own
                                </button>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {suggestions.map((s) => {
                                    const selected = data.username === s;
                                    return (
                                        <button
                                            key={s}
                                            type="button"
                                            aria-pressed={selected}
                                            onClick={() => pick(s)}
                                            className={`min-h-[44px] rounded-full border-2 px-3.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 ${
                                                selected
                                                    ? "border-black text-white"
                                                    : "border-black/15 bg-white text-black/70 hover:border-black/40"
                                            }`}
                                            style={
                                                selected
                                                    ? {
                                                          backgroundColor:
                                                              accent.hex,
                                                      }
                                                    : undefined
                                            }
                                        >
                                            @{s}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* The creator's URL is already printed on the
                                    preview strip directly above, so only the
                                    supporter needs a line here. */}
                            {fieldError("username") ? (
                                <p
                                    role="alert"
                                    className="mt-2 text-xs font-medium text-[#C81E1E]"
                                >
                                    {fieldError("username")} Pick another, or
                                    type your own.
                                </p>
                            ) : (
                                !isCreator && (
                                    <p className="mt-2 text-xs text-black/60">
                                        This is how creators see you.
                                    </p>
                                )
                            )}
                        </>
                    )}
                </div>
            )}
        </StepShell>
    );
}
