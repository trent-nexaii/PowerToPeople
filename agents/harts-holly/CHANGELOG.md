# Holly (Harts) - v2 changes

Source: Karen's email re. (1) Holly switching to a foreign language on the call at 13:34:03, and (2) "Adrienne" alone not being recognised while "Adrienne Allen" works.

## What the recording shows (call at 13:34, transcribed from the WAV; Holly is the right-hand channel)

| Time | Who | What |
|---|---|---|
| 2-6s | Holly | "Hello, you've reached Harts. This is Holly. Who would you like to speak with?" |
| 6.5-8s | Caller | "Adrienne, please" (rough transcription, 8 kHz audio) |
| 10.5-13s | Holly | "Just to confirm, that's Adrienne Allen?" |
| 13.5s | Caller | "Yes." |
| 14-19s | Holly | ~5 s silence (lookup running) |
| 19-23s | Holly | **Turkish:** "...bekleyin. Şu anda sizi bağlamak için gereken bilgileri alıyorum." = "...please wait. I'm currently getting the information needed to connect you." |

Findings:
- The switch is **not** in response to the caller. The caller spoke English and Holly's own opening was English. The Turkish is a status/filler line spoken **after the tool call**, which is a line the prompt never told her to say. It is either the model narrating the lookup and drifting language, or a platform-generated "please wait" message with a wrong language setting. Check the platform transcript for that turn: if the Turkish text is in the assistant's turn it is the model; if it only appears in the audio/event log it is a platform filler or TTS setting.
- Holly echoed "Just to confirm, that's Adrienne Allen?" for a plain first-name request. The v1 prompt only allows that for the Confusable groups ("NO confirmation and NO echo" for every other name), and the wording matches the example in the prompt. It cost a turn and a second "Yes".

## Issue 1 - Foreign language mid-call

New in v2 from the recording:
- Style rule: during a lookup, status check or transfer, say nothing or only "One moment." Never narrate. Filler is always English.
- Name Matching step 3: explicit ban on "Just to confirm" / echoing the full name outside the Confusable groups.

Causes found in the v1 prompt:
- Call Screening said "Use when clear for: name, reason, **language**, tone". That told the model to use a language from screening, in direct conflict with the English-only rule. Removed "language" and added "ignore any language information".
- The English rule sat below Context/Caller Context/Screening and was written mostly as prohibitions ("Never switch, mirror, translate..."). Moved it to the top, directly after Role, rewritten as what to do.
- No case for a greeting in another language (NZ callers: "Kia ora", "Ni hao", "Talofa"). Added a plain English reply.
- No path when the caller really does speak another language. Added: after two tries, offer the Admin team once, in English.
- Added a pre-reply self-check ("is every word English?") and an explicit "caller name / phone number never choose the language".

Not fixable in the prompt - check on the platform (3CX / voice provider):
- Speech-to-text language: set to English (en-NZ if available). Turn OFF language auto-detect / multilingual mode. On an 8 kHz phone line, auto-detect on a short or noisy first utterance can pick the wrong language, and the model then replies in it.
- Text-to-speech: fix the voice language to English. Avoid a multilingual voice that changes language based on the text it is given.
- Pull the raw log for 13:34:03: what the caller's turn was transcribed as, and what language tag it carried. That shows whether the switch started at STT or in the model.

## Issue 2 - "Adrienne" alone not recognised

Causes found in the v1 prompt:
- Matching rule was one vague line ("sounds like a directory name"). A first name said alone over the phone is often transcribed as "Adrian", "Adriana", "Andrea" etc., and "Adrienne Allen" only worked because the surname made the match easy.
- Adrienne's "Heard as" list was missing common variants. Added Adriana, Adrianna, Andrienne, Andrea, Adreen, Adrienn, Hadrian, plus the pronunciation (a-DREE-en).
- Recognition Repair (which asks the caller to spell) had no firm entry condition, so a near-miss could fall into it.

Changes:
- New **Name Matching** section: compare first sound, syllables and rhythm; a first name alone is a complete request; a close-sounding name always beats "no match"; spelling is the last resort; never say "I don't recognise that name" about a possible directory person.
- Staff Directory: "A first name on its own is a complete request."
- Recognition Repair: spelled names are compared by sound ("A-D-R-I-A-N" -> Adrienne), not letter for letter.
- Name Not Found: a failed first-name-only search still triggers the silent full-name then surname retries and never asks the caller to spell.
- Confusable Names: states Adrienne routes straight to lookup with no confirmation.

Check on the tool side: call find_contact_by_name with just "Adrienne" and confirm it returns her record. If it returns nothing but "Adrienne Allen" works, the lookup itself needs fixing (the new retry rule covers it, but it costs a step per call).

## Unchanged
Everything else - First Message, AI Disclosure, Spam, Confusable groups, Admin Stepdown, status handling, actions, End Call, Hostility, Guardrails - is as in v1.

## Test calls before going live
1. "Adrienne" - transfers to Adrienne Allen, no spelling request.
2. "Adrian", "Adriana", "Andrea" - same.
3. "Adrienne Allen" - still works.
4. "Kia ora, is Adrienne there?" - English reply, routes to Adrienne.
5. Speak Mandarin or te reo for several turns - Holly stays English, offers the team.
6. Caller with a non-English name on the caller ID - Holly stays English.
7. Mumble or noise only - Holly asks in English who they'd like to speak with.
8. Regression: Jane / Joanne confirm, "Reception" -> Admin Stepdown, Boardroom, "are you AI".
