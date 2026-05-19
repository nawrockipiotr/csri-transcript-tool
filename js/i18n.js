// ─── CSRI Transcript Analysis Tool — i18n ───
// UI language toggle PL / EN

const I18N = {
  _lang: 'en',

  en: {
    // Hero
    org_badge: 'Centre for Socially Responsible Innovations (CSRI)',
    dark_label: 'Dark',
    light_label: 'Light',
    tool_title: 'Transcript Analysis Tool',
    hero_lead: 'A translation, quality assessment, and analysis tool for multilingual transcripts, developed at the <strong>Centre for Socially Responsible Innovations (CSRI)</strong>, Faculty of Management, University of Warsaw.',
    howto_title: 'How to use this tool',
    howto_hide: '(click to hide)',
    howto_body: '<strong>1.</strong> Paste your API key from the selected AI provider (Anthropic, OpenAI, Google) or connect a local model server.<br><strong>2.</strong> Choose a mode: <strong>Translation</strong> converts the transcript into your target language, <strong>Quality Assessment</strong> checks the transcript for errors and flags them, <strong>Both</strong> does both at once. Additional options below let you add speaker check, anonymization, glossary extraction, and back-translation.<br><strong>3.</strong> Drag & drop your transcript files (TXT, DOCX, SRT, or PDF) or click to browse. You can drop multiple files for batch processing.<br><strong>4.</strong> Click <strong>Process Files</strong> and wait for results. You can stop at any time.<br><strong>5.</strong> Export results using the format buttons below each result, or use <strong>Export All (ZIP)</strong> for batch download.',
    howto_footer: 'Click a topic below to learn how each feature works.',
    hero_author: 'Transcript Analysis Tool · by Piotr Nawrocki',

    // Info toggle buttons
    btn_quality_flags: 'Quality flags',
    btn_translation: 'Translation',
    btn_summary: 'Summary',
    btn_lang_detect: 'Language detection',
    btn_speaker: 'Speaker Check',
    btn_anonymization: 'Anonymization',
    btn_glossary: 'Auto-Glossary',
    btn_backtrans: 'Back-translation',
    btn_consistency: 'Consistency Check',
    btn_diff: 'Diff view',
    btn_timestamp: 'Timestamp check',
    btn_stats: 'Stats',
    btn_inline_edit: 'Inline edit',
    btn_coding_export: 'Coding export',

    // Info panels
    info_quality: 'In Quality Assessment mode, the tool highlights potential transcription errors directly in the text. Flags do not mean the text is wrong — they mark places worth verifying.',
    info_quality_minor: '<strong>Minor</strong> — garbled but understandable from context (e.g. ASR mishearing, informal speech, slight distortion)',
    info_quality_serious: '<strong>Serious</strong> — incomprehensible, scrambled names, missing speech, or nonsensical fragments that need human verification',
    info_quality_score: '<strong>Quality Score guide:</strong> 1–2 largely unintelligible · 3–4 poor, frequent errors · 5–6 moderate, understandable with errors · 7–8 good, minor issues · 9–10 excellent.',
    info_quality_inline: '<strong>Inline edit:</strong> Click any flagged fragment to correct it in place. Press Enter to save or Escape to cancel. Corrected text appears in <span class="flag-corrected" style="cursor:default;">green with ✓</span> and is preserved in exports.',
    info_translation: 'AI-generated translation is a working aid. Verify before using in analysis or publication.',
    info_summary: 'When enabled, the tool generates a structured overview of the transcript: context, main topics, key findings, and ambiguities. The summary does not attribute statements to specific speakers (labels can be unreliable) and does not quote the transcript. It is prepended to TXT and DOCX exports but excluded from SRT files (which are for subtitles only).',
    info_lang_detect: 'The tool automatically detects the source language before processing. If multiple languages are present (code-switching), both primary and secondary languages are reported. Foreign inserts are preserved during quality assessment and translated with markers in translation mode. If the detected source language matches your target language, you\'ll see a warning.',
    info_speaker: 'Analyzes the quality of speaker diarization (who said what) in the transcript. Checks for: missing speaker labels, same label used for different speakers, same speaker appearing under different labels, unnecessary turn splits, and missing conversational turns. Reports the number of declared vs. estimated speakers and label coverage percentage. Flags problematic turns with <span class="flag-speaker" style="cursor:default;">blue markers</span>.<br>Best used on transcripts with speaker labels (e.g., "Speaker 1:", "Person 2:"). If your transcript has no labels, the tool will still estimate the number of distinct speakers.',
    info_anon_intro: 'Identifies and marks personally identifiable information (PII) in the transcript. Can be used as a standalone mode or as an add-on to Translation / Quality Assessment (via the checkbox below the mode selector). Detected categories:',
    info_anon_name: '<strong>Name</strong> — personal names (first, last, nicknames)',
    info_anon_org: '<strong>Organization</strong> — company, institution, department names',
    info_anon_loc: '<strong>Location</strong> — specific addresses, buildings, neighborhoods',
    info_anon_id: '<strong>Identifier</strong> — phone numbers, emails, ID numbers',
    info_anon_date: '<strong>Date</strong> — specific dates that could identify events or people',
    info_anon_footer: 'Export options: <strong>TXT (redacted)</strong> replaces PII with category placeholders, <strong>TXT (marked)</strong> shows original values with category labels.<br><strong>Custom categories:</strong> When the Anonymize checkbox is enabled, a category row appears below it. The 5 default categories are shown as tags. Type a custom category name (e.g., PHONE, PROJECT, ROLE) and press Enter to add it — the AI will then also detect and tag that type of PII.<br>Generic references ("the company", "last year") are not flagged. Speaker labels are not PII. Risk level (LOW/MEDIUM/HIGH) is based on PII density. AI-based PII detection may produce false negatives — always verify manually before sharing or publishing.',
    info_glossary: 'Available in Translation and Both modes. When enabled, the tool first extracts domain-specific terms (jargon, acronyms, recurring concepts) from the transcript and presents them in an editable table. You can review, edit translations, and deselect terms before approving. Approved glossary terms are then enforced during translation for consistent terminology across the entire file. After approval, a <strong>CSV</strong> button lets you download the approved glossary for reuse or reference.<br>The glossary is extracted from the first ~6000 characters. For multi-file batches, the glossary from the first file is reused for all subsequent files. You can also upload a previously saved glossary CSV instead of extracting one.',
    info_backtrans: 'Available in Translation and Both modes. When enabled, the translated text is translated back into the source language, then compared with the original. The comparison produces a fidelity score (1–10), a list of meaningful divergences with severity ratings (minor/major), and a summary assessment. This helps detect meaning shifts, omissions, or mistranslations.<br>Adds approximately 2x processing time. Comparison uses the first ~4000 characters of each text.',
    info_consistency: 'Available after batch translation (2+ files). The button appears in the batch export bar. Checks whether domain-specific terms are translated consistently across all files in the batch. Reports inconsistencies with recommended translations and justifications.<br>Uses the first ~2000 characters of each translation for analysis.',
    info_diff: 'After translation, a toggle button cycles through three views: <strong>Translation only</strong> (default), <strong>Side by side</strong> (original and translation in parallel columns), and <strong>Inline diff</strong> (line-by-line comparison with deletions and insertions highlighted). Useful for reviewing what changed during translation.<br>Diff is limited to the first 200 lines for performance.',
    info_timestamp: 'Automatically runs on SRT files (no AI call — purely deterministic). Detects: negative or zero durations, unrealistically long subtitles (>60s), very short subtitles (<500ms), overlapping entries, large gaps (>10s), and non-monotonic timestamps. Issues are shown with severity indicators (serious / minor) below the translation result.',
    info_stats: 'Every processed file gets a <strong>Stats</strong> tab with deterministic metrics (no AI call): word count, character count, speaker turns, number of speakers, average words per turn. For SRT files, total audio duration is also shown. If speakers are detected, a breakdown with percentage bars shows how much each speaker contributed.<br>Speaker detection uses label patterns like "Speaker 1:", "Person 2:", "Interviewer:" etc. Transcripts without speaker labels will show word and character counts only.',
    info_inline_edit: 'In the Translation and Quality tabs, flagged fragments (<span class="flag-yellow" style="cursor:default;">minor</span> and <span class="flag-red" style="cursor:default;">serious</span>) are clickable. Clicking opens an inline text field where you can type a correction. Press <strong>Enter</strong> to save or <strong>Escape</strong> to cancel. Corrected text replaces the flag and is shown in <span class="flag-corrected" style="cursor:default;">green</span>. Corrections are preserved when exporting to TXT, DOCX, and HTML.',
    info_coding: 'If you plan to code this transcript (assign thematic labels to passages), the <strong>Coding JSON</strong> button in each file\'s results exports a ready-to-import file. The transcript is split into speaker turns — each turn becomes one codable unit with its original text, translation, timestamps, QA flags, and glossary terms attached. You can assign speaker roles (moderator / informant) before export. The output file is designed for the CSRI Coding Tool but follows an open JSON schema.',

    // API section
    lbl_ai_provider: 'AI Provider',
    tab_anthropic: 'Anthropic (Claude)',
    tab_openai: 'OpenAI (ChatGPT)',
    tab_google: 'Google (Gemini)',
    tab_local: 'Local',
    lbl_server_endpoint: 'Server Endpoint',
    hint_endpoint: 'OpenAI-compatible endpoint. Ollama: localhost:11434/v1 · LM Studio: localhost:1234/v1 · vLLM: localhost:8000/v1',
    lbl_model_name: 'Model Name',
    hint_model: 'The model name as registered on your local server (run <code class="code-inline">ollama list</code> to see available models).',
    lbl_save_settings: 'Save settings on this computer',
    security_note: 'Key stored in this browser only · sent only to the selected provider · never shared with third parties',
    data_warning: 'When using cloud providers, transcript content is transmitted to their servers — ensure this is compatible with your data protection obligations.',
    lbl_high_quality: 'Use higher quality model',
    hint_model_default: 'Default: Claude Haiku (fast, cheap). Higher quality: Claude Sonnet (better translation accuracy, ~10× more expensive).',

    // Mode
    mode_translate: 'Translation',
    mode_quality: 'Quality Assessment',
    mode_both: 'Both',

    // Settings
    lbl_target_lang: 'Target Language',

    // Options
    opt_summary: 'Add summary',
    opt_summary_hint: '— prepends an overview at the beginning of the output (not included in SRT export)',
    opt_anonymize: 'Anonymize PII',
    opt_anonymize_hint: '— identifies and marks personal data alongside the main output',
    opt_anon_categories: 'Categories:',
    opt_anon_add: '+ add category',
    opt_speaker: 'Speaker Check',
    opt_speaker_hint: '— analyzes speaker label quality, detects mislabeled or missing turns',
    opt_glossary: 'Auto-Glossary',
    opt_glossary_hint: '— extracts domain terms, lets you review, then enforces consistent translation',
    opt_glossary_unavail: 'Requires Translation or Both mode',
    opt_glossary_upload: 'Or upload your own glossary',
    opt_backtrans: 'Back-translation validation',
    opt_backtrans_hint: '— translates back to source language and scores fidelity (adds ~2× processing time)',
    opt_backtrans_unavail: 'Requires Translation or Both mode',

    // Advanced
    adv_title: 'Advanced Settings',
    adv_detail: 'Processing detail',
    adv_fast: 'Fast — fewer API calls, lower cost',
    adv_balanced: 'Balanced — recommended',
    adv_thorough: 'Thorough — more API calls, higher accuracy',
    adv_detail_hint: 'Controls how the transcript is split for processing. Fast uses larger chunks (fewer calls), Thorough uses smaller chunks (more detail per segment).',
    adv_creativity: 'AI creativity',
    adv_precise: 'Precise',
    adv_balanced_label: 'Balanced',
    adv_creative: 'Creative',
    adv_creativity_hint: 'Precise mode keeps translations close to the original wording. Creative mode produces more natural, free-flowing text but may paraphrase more freely.',

    // Session
    session_available: 'Previous session results available',
    session_restore: 'Restore',

    // Dropzone
    drop_text: 'Drag & drop files here or <strong>click to browse</strong>',
    drop_subtext: 'TXT, DOCX, SRT, PDF — multiple files supported for batch processing',

    // Buttons
    btn_process: 'Process Files',
    btn_stop: 'Stop after current file',
    progress_processing: 'Processing...',
    progress_done: 'Done.',

    // Batch export
    batch_label: 'Batch export:',
    btn_export_all: 'Export All (ZIP)',
    btn_qa_csv: 'QA Report (CSV)',
    btn_qa_xlsx: 'QA Report (XLSX)',
    btn_consistency: 'Consistency Check',

    // JS dynamic messages
    msg_export_failed: 'Export failed: ',
    msg_docx_failed: 'DOCX export failed: ',
    msg_no_data: 'No data available for coding export. Process the file first.',
    msg_sparse_mode: 'This file was processed in {mode} mode — the JSON export will contain only raw text segments without translation or QA data. Continue?',
    msg_no_segments: 'No segments found. The transcript may be empty or in an unsupported format.',
    msg_stopped: 'Stopped. {n} file(s) completed — results preserved.',
    msg_remaining_s: '~{n}s remaining',
    msg_remaining_m: '~{n}min remaining',
    msg_no_cost: 'Local model — no API cost',
    msg_cost: 'Estimated cost: ${low} – ${high} USD for {files} file(s) · {model} · {calls} API calls/file',
    msg_glossary_review: 'Review uploaded glossary and click Approve to continue',
    msg_glossary_review2: 'Review glossary below and click Approve to continue',
    msg_glossary_loaded: '{n} terms loaded from {file}',
    msg_glossary_no_terms: 'No valid terms found. Format: source|target (one per line)',
    msg_glossary_approved: 'Glossary approved — {n} terms',
    msg_session_restore: 'Previous results available ({n} files, {time})',
    msg_lang_match: '<strong>{file}</strong>: detected language ({source}) matches target language ({target}). Translation may not be needed. Processing anyway.',
    // Provider-specific labels
    lbl_api_key_anthropic: 'Anthropic API Key',
    lbl_api_key_openai: 'OpenAI API Key',
    lbl_api_key_google: 'Google AI API Key',
    lbl_api_key_local: 'API Key (optional)',
    hint_anthropic: 'Default: Claude Haiku 4.5 (fast, cheap). Higher quality: Claude Sonnet 4.6 (~10× more expensive).',
    hint_openai: 'Default: GPT-4o mini (fast, cheap). Higher quality: GPT-4o (~15× more expensive).',
    hint_google: 'Default: Gemini Flash (fast, cheap). Higher quality: Gemini Pro (~10× more expensive).',
    hint_local: 'Local model via OpenAI-compatible API (Ollama, LM Studio, vLLM). Data stays on your machine — no external data transfer.',
  },

  pl: {
    // Hero
    org_badge: 'Centrum Innowacji Odpowiedzialnych Społecznie (CSRI)',
    dark_label: 'Ciemny',
    light_label: 'Jasny',
    tool_title: 'Transcript Analysis Tool',
    hero_lead: 'Narzędzie do tłumaczenia, oceny jakości i analizy wielojęzycznych transkrypcji, opracowane w <strong>Centrum Innowacji Odpowiedzialnych Społecznie (CSRI)</strong>, Wydział Zarządzania, Uniwersytet Warszawski.',
    howto_title: 'Jak korzystać z narzędzia',
    howto_hide: '(kliknij, by ukryć)',
    howto_body: '<strong>1.</strong> Wklej klucz API wybranego dostawcy AI (Anthropic, OpenAI, Google) lub podłącz lokalny serwer modelu.<br><strong>2.</strong> Wybierz tryb: <strong>Tłumaczenie</strong> tłumaczy transkrypcję na język docelowy, <strong>Ocena jakości</strong> sprawdza transkrypcję pod kątem błędów i oznacza je, <strong>Oba</strong> wykonuje oba jednocześnie. Dodatkowe opcje poniżej pozwalają dodać sprawdzanie mówców, anonimizację, ekstrakcję glosariusza i walidację zwrotną.<br><strong>3.</strong> Przeciągnij i upuść pliki (TXT, DOCX, SRT lub PDF) lub kliknij, by wybrać. Możesz przetwarzać wiele plików jednocześnie.<br><strong>4.</strong> Kliknij <strong>Przetwórz pliki</strong> i czekaj na wyniki. Możesz przerwać w dowolnym momencie.<br><strong>5.</strong> Eksportuj wyniki przyciskami pod każdym wynikiem lub użyj <strong>Eksportuj wszystko (ZIP)</strong> do pobrania paczki.',
    howto_footer: 'Kliknij temat poniżej, aby dowiedzieć się, jak działa każda funkcja.',
    hero_author: 'Transcript Analysis Tool · autor: Piotr Nawrocki',

    // Info toggle buttons
    btn_quality_flags: 'Flagi jakości',
    btn_translation: 'Tłumaczenie',
    btn_summary: 'Podsumowanie',
    btn_lang_detect: 'Detekcja języka',
    btn_speaker: 'Sprawdzanie mówców',
    btn_anonymization: 'Anonimizacja',
    btn_glossary: 'Auto-glosariusz',
    btn_backtrans: 'Walidacja zwrotna',
    btn_consistency: 'Spójność terminów',
    btn_diff: 'Widok różnic',
    btn_timestamp: 'Kontrola czasu',
    btn_stats: 'Statystyki',
    btn_inline_edit: 'Edycja inline',
    btn_coding_export: 'Eksport kodowania',

    // Info panels
    info_quality: 'W trybie Ocena jakości narzędzie podświetla potencjalne błędy transkrypcji bezpośrednio w tekście. Flagi nie oznaczają, że tekst jest błędny — wskazują miejsca warte weryfikacji.',
    info_quality_minor: '<strong>Drobna</strong> — zniekształcone, ale zrozumiałe z kontekstu (np. błąd ASR, mowa nieformalna, lekkie zniekształcenie)',
    info_quality_serious: '<strong>Poważna</strong> — niezrozumiałe, zniekształcone nazwiska, brak mowy lub bezsensowne fragmenty wymagające weryfikacji',
    info_quality_score: '<strong>Skala jakości:</strong> 1–2 w dużej mierze niezrozumiałe · 3–4 słaba jakość, częste błędy · 5–6 umiarkowana, zrozumiałe z błędami · 7–8 dobra, drobne problemy · 9–10 doskonała.',
    info_quality_inline: '<strong>Edycja inline:</strong> Kliknij oflagowany fragment, aby poprawić go na miejscu. Enter zapisuje, Escape anuluje. Poprawiony tekst pojawia się <span class="flag-corrected" style="cursor:default;">na zielono z ✓</span> i jest zachowany w eksportach.',
    info_translation: 'Tłumaczenie AI to narzędzie pomocnicze. Zweryfikuj przed użyciem w analizie lub publikacji.',
    info_summary: 'Po włączeniu narzędzie generuje strukturalny przegląd transkrypcji: kontekst, główne tematy, kluczowe ustalenia i niejasności. Podsumowanie nie przypisuje wypowiedzi konkretnym mówcom (etykiety mogą być niewiarygodne) i nie cytuje transkrypcji. Jest dołączane na początku eksportów TXT i DOCX, ale nie w plikach SRT.',
    info_lang_detect: 'Narzędzie automatycznie wykrywa język źródłowy przed przetwarzaniem. Jeśli występuje wiele języków (code-switching), raportowane są oba. Wstawki obcojęzyczne są zachowywane podczas oceny jakości i tłumaczone z oznaczeniami w trybie tłumaczenia. Gdy wykryty język źródłowy pokrywa się z docelowym, zobaczysz ostrzeżenie.',
    info_speaker: 'Analizuje jakość przypisywania mówców (kto co powiedział) w transkrypcji. Sprawdza: brakujące etykiety, tę samą etykietę dla różnych mówców, tego samego mówcę pod różnymi etykietami, niepotrzebne podziały tur i brakujące tury. Raportuje liczbę zadeklarowanych vs. szacowanych mówców i pokrycie etykietami. Problematyczne tury oznacza <span class="flag-speaker" style="cursor:default;">niebieskimi znacznikami</span>.<br>Najlepiej działa na transkrypcjach z etykietami mówców (np. „Speaker 1:", „Osoba 2:"). Bez etykiet narzędzie oszacuje liczbę mówców.',
    info_anon_intro: 'Identyfikuje i oznacza dane osobowe (PII) w transkrypcji. Może działać jako samodzielny tryb lub dodatek do Tłumaczenia / Oceny jakości (checkbox poniżej selektora trybu). Wykrywane kategorie:',
    info_anon_name: '<strong>Imię</strong> — imiona i nazwiska, pseudonimy',
    info_anon_org: '<strong>Organizacja</strong> — nazwy firm, instytucji, działów',
    info_anon_loc: '<strong>Lokalizacja</strong> — konkretne adresy, budynki, dzielnice',
    info_anon_id: '<strong>Identyfikator</strong> — numery telefonów, e-maile, numery ID',
    info_anon_date: '<strong>Data</strong> — konkretne daty mogące identyfikować osoby lub zdarzenia',
    info_anon_footer: 'Opcje eksportu: <strong>TXT (zanonimizowany)</strong> zastępuje PII placeholderami kategorii, <strong>TXT (oznaczony)</strong> pokazuje oryginalne wartości z etykietami.<br><strong>Własne kategorie:</strong> Gdy checkbox Anonimizacji jest włączony, pojawia się wiersz kategorii. 5 domyślnych kategorii widocznych jako tagi. Wpisz nazwę kategorii (np. TELEFON, PROJEKT, ROLA) i naciśnij Enter — AI będzie też wykrywać ten typ PII.<br>Ogólne odniesienia („firma", „w zeszłym roku") nie są flagowane. Etykiety mówców nie są PII. Poziom ryzyka (NISKI/ŚREDNI/WYSOKI) zależy od gęstości PII. Detekcja AI może dawać fałszywe negatywy — zawsze weryfikuj ręcznie.',
    info_glossary: 'Dostępne w trybach Tłumaczenie i Oba. Po włączeniu narzędzie najpierw wyodrębnia terminy dziedzinowe (żargon, akronimy, powtarzające się pojęcia) i prezentuje je w edytowalnej tabeli. Możesz przeglądać, edytować tłumaczenia i odznaczać terminy przed zatwierdzeniem. Zatwierdzone terminy są egzekwowane podczas tłumaczenia. Przycisk <strong>CSV</strong> pozwala pobrać glosariusz.<br>Glosariusz jest wyodrębniany z pierwszych ~6000 znaków. W przetwarzaniu wsadowym glosariusz z pierwszego pliku jest używany dla kolejnych. Możesz też wgrać wcześniej zapisany CSV.',
    info_backtrans: 'Dostępne w trybach Tłumaczenie i Oba. Przetłumaczony tekst jest tłumaczony z powrotem na język źródłowy i porównywany z oryginałem. Porównanie daje wynik wierności (1–10), listę rozbieżności z oceną ważności (drobna/poważna) i ocenę zbiorczą. Pomaga wykryć przesunięcia znaczeniowe, pominięcia lub błędy tłumaczenia.<br>Wydłuża przetwarzanie ~2x. Porównanie na pierwszych ~4000 znakach.',
    info_consistency: 'Dostępne po przetłumaczeniu wsadu (2+ pliki). Przycisk pojawia się w pasku eksportu. Sprawdza, czy terminy dziedzinowe są tłumaczone spójnie we wszystkich plikach. Raportuje niespójności z rekomendowanymi tłumaczeniami i uzasadnieniami.<br>Analizuje pierwsze ~2000 znaków każdego tłumaczenia.',
    info_diff: 'Po tłumaczeniu przycisk przełącza między trzema widokami: <strong>Tylko tłumaczenie</strong> (domyślny), <strong>Obok siebie</strong> (oryginał i tłumaczenie w kolumnach) oraz <strong>Diff inline</strong> (porównanie linia po linii z wyróżnionymi usunięciami i wstawkami). Przydatne do przeglądania zmian.<br>Diff ograniczony do 200 linii.',
    info_timestamp: 'Uruchamia się automatycznie na plikach SRT (bez wywołania AI — czysto deterministyczne). Wykrywa: ujemne lub zerowe czasy trwania, zbyt długie napisy (>60s), zbyt krótkie (<500ms), nakładanie się wpisów, duże luki (>10s) i niemonotoniczne znaczniki czasu. Problemy są wyświetlane z oznaczeniem ważności (poważne / drobne).',
    info_stats: 'Każdy przetworzony plik otrzymuje zakładkę <strong>Statystyki</strong> z metryki deterministycznymi (bez AI): liczba słów, znaków, tur mówców, liczba mówców, średnia słów na turę. Dla plików SRT wyświetlany jest też czas trwania nagrania. Gdy wykryto mówców, rozkład procentowy pokazuje wkład każdego z nich.<br>Detekcja mówców bazuje na wzorcach etykiet („Speaker 1:", „Osoba 2:", „Prowadzący:" itp.). Transkrypcje bez etykiet pokażą tylko liczby słów i znaków.',
    info_inline_edit: 'W zakładkach Tłumaczenie i Jakość oflagowane fragmenty (<span class="flag-yellow" style="cursor:default;">drobne</span> i <span class="flag-red" style="cursor:default;">poważne</span>) są klikalne. Kliknięcie otwiera pole edycji. <strong>Enter</strong> zapisuje, <strong>Escape</strong> anuluje. Poprawiony tekst zastępuje flagę i wyświetla się <span class="flag-corrected" style="cursor:default;">na zielono</span>. Poprawki zachowywane w eksportach TXT, DOCX i HTML.',
    info_coding: 'Jeśli planujesz kodować tę transkrypcję (przypisywać etykiety tematyczne do fragmentów), przycisk <strong>Coding JSON</strong> w wynikach każdego pliku eksportuje gotowy plik do importu. Transkrypcja jest dzielona na tury mówców — każda tura to jedna jednostka kodowalna z oryginalnym tekstem, tłumaczeniem, znacznikami czasu, flagami QA i terminami glosariusza. Możesz przypisać role mówców (moderator / informant) przed eksportem. Plik jest zaprojektowany dla CSRI Coding Tool, ale używa otwartego schematu JSON.',

    // API section
    lbl_ai_provider: 'Dostawca AI',
    tab_anthropic: 'Anthropic (Claude)',
    tab_openai: 'OpenAI (ChatGPT)',
    tab_google: 'Google (Gemini)',
    tab_local: 'Lokalny',
    lbl_server_endpoint: 'Adres serwera',
    hint_endpoint: 'Endpoint kompatybilny z OpenAI. Ollama: localhost:11434/v1 · LM Studio: localhost:1234/v1 · vLLM: localhost:8000/v1',
    lbl_model_name: 'Nazwa modelu',
    hint_model: 'Nazwa modelu zarejestrowana na serwerze lokalnym (uruchom <code class="code-inline">ollama list</code>, aby zobaczyć dostępne modele).',
    lbl_save_settings: 'Zapisz ustawienia na tym komputerze',
    security_note: 'Klucz przechowywany tylko w tej przeglądarce · wysyłany wyłącznie do wybranego dostawcy · nie jest udostępniany osobom trzecim',
    data_warning: 'Przy korzystaniu z dostawców chmurowych treść transkrypcji jest przesyłana na ich serwery — upewnij się, że jest to zgodne z Twoimi obowiązkami ochrony danych.',
    lbl_high_quality: 'Użyj modelu wyższej jakości',
    hint_model_default: 'Domyślny: Claude Haiku (szybki, tani). Wyższa jakość: Claude Sonnet (lepsza dokładność tłumaczenia, ~10× droższy).',

    // Mode
    mode_translate: 'Tłumaczenie',
    mode_quality: 'Ocena jakości',
    mode_both: 'Oba',

    // Settings
    lbl_target_lang: 'Język docelowy',

    // Options
    opt_summary: 'Dodaj podsumowanie',
    opt_summary_hint: '— dołącza przegląd na początku wyniku (nie w eksporcie SRT)',
    opt_anonymize: 'Anonimizuj dane osobowe',
    opt_anonymize_hint: '— identyfikuje i oznacza dane osobowe obok głównego wyniku',
    opt_anon_categories: 'Kategorie:',
    opt_anon_add: '+ dodaj kategorię',
    opt_speaker: 'Sprawdzanie mówców',
    opt_speaker_hint: '— analizuje jakość etykiet mówców, wykrywa błędne lub brakujące tury',
    opt_glossary: 'Auto-glosariusz',
    opt_glossary_hint: '— wyodrębnia terminy dziedzinowe, pozwala je przejrzeć, potem wymusza spójne tłumaczenie',
    opt_glossary_unavail: 'Wymaga trybu Tłumaczenie lub Oba',
    opt_glossary_upload: 'Lub wgraj własny glosariusz',
    opt_backtrans: 'Walidacja zwrotna tłumaczenia',
    opt_backtrans_hint: '— tłumaczy z powrotem na język źródłowy i ocenia wierność (wydłuża przetwarzanie ~2×)',
    opt_backtrans_unavail: 'Wymaga trybu Tłumaczenie lub Oba',

    // Advanced
    adv_title: 'Ustawienia zaawansowane',
    adv_detail: 'Szczegółowość przetwarzania',
    adv_fast: 'Szybkie — mniej wywołań API, niższy koszt',
    adv_balanced: 'Zrównoważone — zalecane',
    adv_thorough: 'Dokładne — więcej wywołań API, wyższa dokładność',
    adv_detail_hint: 'Kontroluje podział transkrypcji na fragmenty. Szybkie używa większych fragmentów (mniej wywołań), Dokładne mniejszych (więcej szczegółów na segment).',
    adv_creativity: 'Kreatywność AI',
    adv_precise: 'Precyzyjne',
    adv_balanced_label: 'Zrównoważone',
    adv_creative: 'Kreatywne',
    adv_creativity_hint: 'Tryb precyzyjny trzyma się blisko oryginału. Tryb kreatywny daje bardziej naturalny tekst, ale może swobodniej parafrazować.',

    // Session
    session_available: 'Dostępne wyniki z poprzedniej sesji',
    session_restore: 'Przywróć',

    // Dropzone
    drop_text: 'Przeciągnij i upuść pliki tutaj lub <strong>kliknij, by wybrać</strong>',
    drop_subtext: 'TXT, DOCX, SRT, PDF — obsługa wielu plików do przetwarzania wsadowego',

    // Buttons
    btn_process: 'Przetwórz pliki',
    btn_stop: 'Zatrzymaj po bieżącym pliku',
    progress_processing: 'Przetwarzanie...',
    progress_done: 'Gotowe.',

    // Batch export
    batch_label: 'Eksport wsadowy:',
    btn_export_all: 'Eksportuj wszystko (ZIP)',
    btn_qa_csv: 'Raport QA (CSV)',
    btn_qa_xlsx: 'Raport QA (XLSX)',
    btn_consistency: 'Spójność terminów',

    // JS dynamic messages
    msg_export_failed: 'Eksport nie powiódł się: ',
    msg_docx_failed: 'Eksport DOCX nie powiódł się: ',
    msg_no_data: 'Brak danych do eksportu kodowania. Najpierw przetwórz plik.',
    msg_sparse_mode: 'Ten plik przetworzono w trybie {mode} — eksport JSON będzie zawierał tylko surowe segmenty tekstu bez tłumaczenia i danych QA. Kontynuować?',
    msg_no_segments: 'Nie znaleziono segmentów. Transkrypcja może być pusta lub w nieobsługiwanym formacie.',
    msg_stopped: 'Zatrzymano. Ukończono {n} plik(ów) — wyniki zachowane.',
    msg_remaining_s: '~{n}s pozostało',
    msg_remaining_m: '~{n}min pozostało',
    msg_no_cost: 'Model lokalny — bez kosztów API',
    msg_cost: 'Szacowany koszt: ${low} – ${high} USD za {files} plik(ów) · {model} · {calls} wywołań API/plik',
    msg_glossary_review: 'Przejrzyj wgrany glosariusz i kliknij Zatwierdź, by kontynuować',
    msg_glossary_review2: 'Przejrzyj glosariusz poniżej i kliknij Zatwierdź, by kontynuować',
    msg_glossary_loaded: 'Załadowano {n} terminów z {file}',
    msg_glossary_no_terms: 'Nie znaleziono poprawnych terminów. Format: źródło|cel (jeden na linię)',
    msg_glossary_approved: 'Glosariusz zatwierdzony — {n} terminów',
    msg_session_restore: 'Dostępne poprzednie wyniki ({n} plików, {time})',
    msg_lang_match: '<strong>{file}</strong>: wykryty język ({source}) pokrywa się z językiem docelowym ({target}). Tłumaczenie może nie być potrzebne. Przetwarzanie mimo to.',
    // Provider-specific labels
    lbl_api_key_anthropic: 'Klucz API Anthropic',
    lbl_api_key_openai: 'Klucz API OpenAI',
    lbl_api_key_google: 'Klucz API Google AI',
    lbl_api_key_local: 'Klucz API (opcjonalny)',
    hint_anthropic: 'Domyślny: Claude Haiku 4.5 (szybki, tani). Wyższa jakość: Claude Sonnet 4.6 (~10× droższy).',
    hint_openai: 'Domyślny: GPT-4o mini (szybki, tani). Wyższa jakość: GPT-4o (~15× droższy).',
    hint_google: 'Domyślny: Gemini Flash (szybki, tani). Wyższa jakość: Gemini Pro (~10× droższy).',
    hint_local: 'Model lokalny przez API kompatybilne z OpenAI (Ollama, LM Studio, vLLM). Dane pozostają na Twoim komputerze — brak transferu na zewnątrz.',
  },

  // ─── API ───

  get(key) {
    return (this[this._lang] && this[this._lang][key]) || (this.en[key]) || key;
  },

  msg(key, params) {
    let text = this.get(key);
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        text = text.replace(new RegExp('\\{' + k + '\\}', 'g'), v);
      }
    }
    return text;
  },

  getLang() {
    return this._lang;
  },

  setLang(lang) {
    this._lang = lang;
    localStorage.setItem('csri_ui_lang', lang);
    this.applyAll();
  },

  applyAll() {
    // Update all elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const val = this.get(key);
      if (el.tagName === 'INPUT' && el.type !== 'checkbox' && el.type !== 'radio') {
        if (el.placeholder && el.getAttribute('data-i18n-attr') === 'placeholder') {
          el.placeholder = val;
        }
      } else if (el.getAttribute('data-i18n-attr') === 'title') {
        el.title = val;
      } else {
        el.innerHTML = val;
      }
    });

    // Update <html lang>
    document.documentElement.lang = this._lang === 'pl' ? 'pl' : 'en';

    // Update toggle button states
    const plBtn = document.getElementById('langBtnPl');
    const enBtn = document.getElementById('langBtnEn');
    if (plBtn && enBtn) {
      plBtn.classList.toggle('active', this._lang === 'pl');
      enBtn.classList.toggle('active', this._lang === 'en');
    }

    // Update info panels that have complex HTML
    this._updateInfoPanels();

    // Re-apply provider-specific labels (API key label, model hint)
    if (typeof currentProvider !== 'undefined' && typeof setProvider === 'function') {
      setProvider(currentProvider);
    }

    // Update dark mode button text
    const darkBtn = document.getElementById('darkToggle');
    if (darkBtn) {
      const isDark = document.body.classList.contains('dark-mode');
      const label = isDark ? this.get('light_label') : this.get('dark_label');
      const icon = isDark ? 'sun' : 'moon';
      darkBtn.innerHTML = '<i data-lucide="' + icon + '" class="icon-sm"></i> ' + label;
      if (typeof lucide !== 'undefined') lucide.createIcons({nameAttr: 'data-lucide', node: darkBtn});
    }
  },

  _updateInfoPanels() {
    const panels = {
      infoTranslation: 'info_translation',
      infoSummary: 'info_summary',
      infoLangDetect: 'info_lang_detect',
      infoDiff: 'info_diff',
      infoTimestamp: 'info_timestamp',
      infoCodingExport: 'info_coding',
    };
    // Simple panels (single info-content div, no sub-elements)
    for (const [id, key] of Object.entries(panels)) {
      const panel = document.getElementById(id);
      if (!panel) continue;
      const div = panel.querySelector('.info-content');
      if (div) div.innerHTML = this.get(key);
    }

    // Complex panels with sub-elements
    const qp = document.getElementById('infoQualityFlags');
    if (qp) {
      const contents = qp.querySelectorAll('.info-content');
      if (contents[0]) contents[0].innerHTML = this.get('info_quality');
      const examples = qp.querySelectorAll('.flag-example');
      if (examples[0]) examples[0].querySelector('span:last-child').innerHTML = this.get('info_quality_minor');
      if (examples[1]) examples[1].querySelector('span:last-child').innerHTML = this.get('info_quality_serious');
      if (contents[1]) contents[1].innerHTML = this.get('info_quality_score') + '<br>' + this.get('info_quality_inline');
    }

    const sp = document.getElementById('infoSpeaker');
    if (sp) { const d = sp.querySelector('.info-content'); if (d) d.innerHTML = this.get('info_speaker'); }

    const ap = document.getElementById('infoAnonymization');
    if (ap) {
      const contents = ap.querySelectorAll('.info-content');
      if (contents[0]) contents[0].innerHTML = this.get('info_anon_intro');
      const examples = ap.querySelectorAll('.flag-example');
      if (examples[0]) examples[0].querySelector('span:last-child').innerHTML = this.get('info_anon_name');
      if (examples[1]) examples[1].querySelector('span:last-child').innerHTML = this.get('info_anon_org');
      if (examples[2]) examples[2].querySelector('span:last-child').innerHTML = this.get('info_anon_loc');
      if (examples[3]) examples[3].querySelector('span:last-child').innerHTML = this.get('info_anon_id');
      if (examples[4]) examples[4].querySelector('span:last-child').innerHTML = this.get('info_anon_date');
      if (contents[1]) contents[1].innerHTML = this.get('info_anon_footer');
    }

    const gp = document.getElementById('infoGlossary');
    if (gp) { const d = gp.querySelector('.info-content'); if (d) d.innerHTML = this.get('info_glossary'); }

    const bp = document.getElementById('infoBacktrans');
    if (bp) { const d = bp.querySelector('.info-content'); if (d) d.innerHTML = this.get('info_backtrans'); }

    const cp = document.getElementById('infoConsistency');
    if (cp) { const d = cp.querySelector('.info-content'); if (d) d.innerHTML = this.get('info_consistency'); }

    const stp = document.getElementById('infoStats');
    if (stp) { const d = stp.querySelector('.info-content'); if (d) d.innerHTML = this.get('info_stats'); }

    const iep = document.getElementById('infoInlineEdit');
    if (iep) { const d = iep.querySelector('.info-content'); if (d) d.innerHTML = this.get('info_inline_edit'); }
  },

  init() {
    const saved = localStorage.getItem('csri_ui_lang');
    if (saved === 'pl' || saved === 'en') {
      this._lang = saved;
    }
    this.applyAll();
  }
};

function toggleUILang(lang) {
  I18N.setLang(lang);
}
