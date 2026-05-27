// ─── CSRI Transcript Analysis Tool — Demo Mode ───
// Pre-generated sample data for offline demonstration

const DEMO = {

  // ── Sample transcripts ──
  samples: {
    pl: {
      fileName: 'demo_interview_PL.txt',
      content: `Prowadzący: Dzień dobry, dziękuję za zgodę na rozmowę. Na początku chciałbym zapytać, jak długo pracuje Pan w tej organizacji?
Respondent 1: Dzień dobry. Pracuję tutaj od dwunastu lat, od samego początku właściwie, od momentu kiedy firma powstała w dwa tysiące dwunastym roku.
Prowadzący: A jak Pan ocenia zmiany, które zaszły w tym okresie?
Respondent 1: No wie Pan, to jest skomplikowana sprawa. Na początku byliśmy małym zespołem, jakieś piętnaście osób, i wszyscy się znali. Teraz mamy ponad dwieście pracowników i czasem mam wrażenie, że nie wiem kto pracuje na tym samym piętrze co ja.
Prowadzący: Czy to wpłynęło na kulturę organizacyjną?
Respondent 1: Zdecydowanie tak. Kiedyś decyzje podejmowaliśmy wspólnie, przy kawie, niemalże. Teraz wszystko idzie przez trzy poziomy akceptacji, komitety sterujące, cała biurokracja. Pan Kowalski z działu HR mówi, że to konieczne przy tej skali, ale ja nie jestem przekonany.
Prowadzący: A jak wygląda komunikacja między działami?
Respondent 1: To jest chyba największy problem. Marketing nie rozmawia z IT, IT nie rozmawia z produkcją. Każdy dział żyje w swoim silosie. Próbowaliśmy różnych rzeczy — Slack, Teams, spotkania cross-funkcyjne — ale efekty są... no, umiarkowane.
Prowadzący: Wspomniał Pan o panu Kowalskim. Czy dział HR podejmuje jakieś działania w tym zakresie?
Respondent 1: Tak, organizują team-buildingi, szkolenia z komunikacji. Ale to jest leczenie objawów, nie przyczyn. Moim zdaniem problem leży w strukturze — za dużo hierarchii, za mało autonomii zespołów.`,
    },
    en: {
      fileName: 'demo_interview_EN.txt',
      content: `Interviewer: Good morning, thank you for agreeing to this interview. Could you start by telling me about your role in the organization?
Respondent 1: Good morning. I'm the head of the innovation department. I've been in this position for about five years now, since twenty twenty-one.
Interviewer: How has the organization's approach to innovation changed during that time?
Respondent 1: Well, when I started, innovation was basically a buzzword. We had no dedicated budget, no processes. Everything was ad hoc. Someone would have an idea, maybe pitch it to their manager, and it would either get lost in the shuffle or championed by one person.
Interviewer: And now?
Respondent 1: Now we have a structured innovation pipeline. We run quarterly ideation sessions, we have a small prototyping fund — about fifty thousand per quarter — and we've established partnerships with two universities. Professor Johnson at MIT has been particularly helpful with our AI initiatives.
Interviewer: How do employees respond to these changes?
Respondent 1: It's mixed, honestly. The younger staff, especially those who joined after twenty twenty-two, they're enthusiastic. They grew up with design thinking, agile methods. But some of the senior people are more skeptical. They've seen management fads come and go.
Interviewer: Can you give me a specific example of resistance?
Respondent 1: Sure. We proposed a cross-departmental hackathon last year. The engineering team was all for it, but the finance department pushed back hard. Their argument was that two days of lost productivity couldn't be justified. We eventually compromised on a one-day event.`,
    }
  },

  // ── Pre-generated results ──
  results: {
    pl: {
      translation: `Moderator: Good morning, thank you for agreeing to the interview. First, I would like to ask how long you have been working in this organization?
Respondent 1: Good morning. I have been working here for twelve years, essentially from the very beginning, since the company was founded in two thousand twelve.
Moderator: How do you assess the changes that have occurred during this period?
Respondent 1: Well, you know, it's a complicated matter. In the beginning we were a small team, about fifteen people, and everyone knew each other. Now we have over two hundred employees and sometimes I have the impression that I don't know who works on the same floor as me.
Moderator: Has this affected the organizational culture?
Respondent 1: Definitely yes. We used to make decisions together, over coffee, almost. Now everything goes through three levels of approval, steering committees, all the bureaucracy. Mr. Kowalski from HR says it's necessary at this scale, but I'm not convinced.
Moderator: What does communication between departments look like?
Respondent 1: That's probably the biggest problem. Marketing doesn't talk to IT, IT doesn't talk to production. Each department lives in its own silo. We've tried various things — Slack, Teams, cross-functional meetings — but the results are... well, moderate.
Moderator: You mentioned Mr. Kowalski. Is the HR department taking any actions in this regard?
Respondent 1: Yes, they organize team-buildings, communication trainings. But that's treating symptoms, not causes. In my opinion, the problem lies in the structure — too much hierarchy, not enough team autonomy.`,

      quality: `QUALITY_SCORE: 7.5/10
LANGUAGE: Polish (primary)

Prowadzący: Dzień dobry, dziękuję za zgodę na rozmowę. Na początku chciałbym zapytać, jak długo pracuje Pan w tej organizacji?
Respondent 1: Dzień dobry. Pracuję tutaj od dwunastu lat, od samego początku właściwie, od momentu kiedy firma powstała w dwa tysiące dwunastym roku.
Prowadzący: A jak Pan ocenia zmiany, które zaszły w tym okresie?
Respondent 1: No wie Pan, to jest [Y]skąplikowana[/Y] sprawa. Na początku byliśmy małym zespołem, jakieś piętnaście osób, i wszyscy się znali. Teraz mamy ponad dwieście pracowników i czasem mam wrażenie, że nie wiem kto pracuje na tym samym piętrze co ja.
Prowadzący: Czy to wpłynęło na kulturę organizacyjną?
Respondent 1: Zdecydowanie tak. Kiedyś decyzje podejmowaliśmy wspólnie, przy kawie, niemalże. Teraz wszystko idzie przez trzy poziomy akceptacji, [Y]komitety sterące[/Y], cała biurokracja. Pan Kowalski z działu HR mówi, że to konieczne przy tej skali, ale ja nie jestem przekonany.
Prowadzący: A jak wygląda komunikacja między działami?
Respondent 1: To jest chyba największy problem. Marketing nie rozmawia z IT, IT nie rozmawia z produkcją. Każdy dział żyje w swoim [Y]silosie[/Y]. Próbowaliśmy różnych rzeczy — Slack, Teams, [R]sprzania cross-fenkcyje[/R] — ale efekty są... no, umiarkowane.
Prowadzący: Wspomniał Pan o panu Kowalskim. Czy dział HR podejmuje jakieś działania w tym zakresie?
Respondent 1: Tak, organizują team-buildingi, szkolenia z komunikacji. Ale to jest leczenie objawów, nie przyczyn. Moim zdaniem problem leży w strukturze — za dużo hierarchii, za mało [Y]autanomii[/Y] zespołów.`,

      summary: `CONTEXT: Semi-structured qualitative interview conducted in Polish, part of a study on organizational culture change in a medium-sized company.\n\nMAIN TOPICS:\n1. Organizational growth trajectory (from 15 to 200+ employees over 12 years)\n2. Evolution of decision-making processes (informal to bureaucratic)\n3. Cross-departmental communication barriers (silo effect)\n4. HR interventions and their perceived limitations\n\nKEY FINDINGS:\n- Respondent frames organizational growth as a loss of informal culture\n- Identifies structural hierarchy as root cause of communication problems\n- Distinguishes between symptom-level interventions (team-building) and structural solutions (autonomy)\n- References a specific HR stakeholder by name (Kowalski)\n\nAMBIGUITIES:\n- "Moderate results" of communication tools — unclear whether this is respondent's assessment or organizational evaluation\n- Relationship between respondent and HR department head may influence framing`,

      anonymization: `Prowadzący: Dzień dobry, dziękuję za zgodę na rozmowę. Na początku chciałbym zapytać, jak długo pracuje Pan w tej organizacji?
Respondent 1: Dzień dobry. Pracuję tutaj od dwunastu lat, od samego początku właściwie, od momentu kiedy firma powstała w <span class="flag-pii flag-date" title="DATE">dwa tysiące dwunastym roku</span>.
Prowadzący: A jak Pan ocenia zmiany, które zaszły w tym okresie?
Respondent 1: No wie Pan, to jest skomplikowana sprawa. Na początku byliśmy małym zespołem, jakieś piętnaście osób, i wszyscy się znali. Teraz mamy ponad dwieście pracowników i czasem mam wrażenie, że nie wiem kto pracuje na tym samym piętrze co ja.
Prowadzący: Czy to wpłynęło na kulturę organizacyjną?
Respondent 1: Zdecydowanie tak. Kiedyś decyzje podejmowaliśmy wspólnie, przy kawie, niemalże. Teraz wszystko idzie przez trzy poziomy akceptacji, komitety sterujące, cała biurokracja. <span class="flag-pii flag-name" title="NAME">Pan Kowalski</span> z działu <span class="flag-pii flag-org" title="ORG">HR</span> mówi, że to konieczne przy tej skali, ale ja nie jestem przekonany.
Prowadzący: A jak wygląda komunikacja między działami?
Respondent 1: To jest chyba największy problem. Marketing nie rozmawia z IT, IT nie rozmawia z produkcją. Każdy dział żyje w swoim silosie. Próbowaliśmy różnych rzeczy — Slack, Teams, spotkania cross-funkcyjne — ale efekty są... no, umiarkowane.
Prowadzący: Wspomniał Pan o <span class="flag-pii flag-name" title="NAME">panu Kowalskim</span>. Czy dział <span class="flag-pii flag-org" title="ORG">HR</span> podejmuje jakieś działania w tym zakresie?
Respondent 1: Tak, organizują team-buildingi, szkolenia z komunikacji. Ale to jest leczenie objawów, nie przyczyn. Moim zdaniem problem leży w strukturze — za dużo hierarchii, za mało autonomii zespołów.

PII_RISK: LOW
PII_SUMMARY: 2 personal names (Kowalski), 2 organization references (HR), 1 date reference. Low density — minimal re-identification risk.`,

      speakerCheck: `SPEAKERS_DECLARED: 2
SPEAKERS_ESTIMATED: 2
LABEL_COVERAGE: 100%

Speaker labels detected: Prowadzący, Respondent 1.
All turns have consistent speaker labels. No mislabeled or missing turns detected. Turn alternation pattern is consistent with a standard semi-structured interview format.`,
    },

    en: {
      translation: `Prowadzący: Dzień dobry, dziękuję za zgodę na ten wywiad. Czy mógłby Pan zacząć od opowiedzenia mi o swojej roli w organizacji?
Respondent 1: Dzień dobry. Jestem szefem działu innowacji. Na tym stanowisku jestem od około pięciu lat, od dwudziestego dwudziestego pierwszego roku.
Prowadzący: Jak zmieniło się podejście organizacji do innowacji w tym czasie?
Respondent 1: Cóż, kiedy zaczynałem, innowacja była w zasadzie modnym hasłem. Nie mieliśmy dedykowanego budżetu, żadnych procesów. Wszystko było ad hoc. Ktoś miał pomysł, może prezentował go swojemu przełożonemu, a pomysł albo ginął w natłoku spraw, albo był forsowany przez jedną osobę.
Prowadzący: A teraz?
Respondent 1: Teraz mamy ustrukturyzowany pipeline innowacji. Prowadzimy kwartalne sesje ideacyjne, mamy mały fundusz prototypowy — około pięćdziesięciu tysięcy na kwartał — i nawiązaliśmy współpracę z dwoma uniwersytetami. Profesor Johnson z MIT był szczególnie pomocny przy naszych inicjatywach z zakresu AI.
Prowadzący: Jak pracownicy reagują na te zmiany?
Respondent 1: To jest mieszane, szczerze mówiąc. Młodsi pracownicy, zwłaszcza ci, którzy dołączyli po dwudziestym dwudziestym drugim roku, są entuzjastyczni. Dorastali z design thinking, metodami agile. Ale część starszych pracowników jest bardziej sceptyczna. Widzieli, jak mody zarządcze przychodzą i odchodzą.
Prowadzący: Czy może Pan podać konkretny przykład oporu?
Respondent 1: Jasne. W zeszłym roku zaproponowaliśmy międzydziałowy hackathon. Zespół inżynieryjny był za, ale dział finansów mocno się sprzeciwił. Ich argument był taki, że dwóch dni utraconej produktywności nie da się uzasadnić. Ostatecznie doszliśmy do kompromisu — jednodniowe wydarzenie.`,

      quality: `QUALITY_SCORE: 8.0/10
LANGUAGE: English (primary)

Interviewer: Good morning, thank you for agreeing to this interview. Could you start by telling me about your role in the organization?
Respondent 1: Good morning. I'm the head of the innovation department. I've been in this position for about five years now, since twenty twenty-one.
Interviewer: How has the organization's approach to innovation changed during that time?
Respondent 1: Well, when I started, innovation was basically a buzzword. We had no dedicated budget, no processes. Everything was [Y]adhoc[/Y]. Someone would have an idea, maybe pitch it to their manager, and it would either get lost in the shuffle or championed by one person.
Interviewer: And now?
Respondent 1: Now we have a structured innovation pipeline. We run quarterly ideation sessions, we have a small prototyping fund — about fifty thousand per quarter — and we've established partnerships with two universities. [Y]Professer[/Y] Johnson at MIT has been particularly helpful with our AI initiatives.
Interviewer: How do employees respond to these changes?
Respondent 1: It's mixed, honestly. The younger staff, especially those who joined after twenty twenty-two, they're enthusiastic. They grew up with design thinking, agile methods. But some of the senior people are more [Y]skepticle[/Y]. They've seen management fads come and go.
Interviewer: Can you give me a specific example of resistance?
Respondent 1: Sure. We proposed a cross-departmental hackathon last year. The engineering team was all for it, but the [R]finence depatment[/R] pushed back hard. Their argument was that two days of lost productivity couldn't be justified. We eventually compromised on a one-day event.`,

      summary: `CONTEXT: Semi-structured qualitative interview conducted in English, exploring innovation management practices and organizational change.\n\nMAIN TOPICS:\n1. Evolution of innovation management (from ad hoc to structured pipeline)\n2. Resource allocation for innovation (quarterly prototyping fund, university partnerships)\n3. Generational differences in receptiveness to innovation culture\n4. Internal resistance to cross-departmental collaboration\n\nKEY FINDINGS:\n- Organization transitioned from no innovation infrastructure to a structured pipeline over five years\n- Younger employees (post-2022 hires) are more receptive to innovation initiatives\n- Finance department represents institutional resistance — frames innovation activities as productivity loss\n- Compromise as conflict resolution strategy (hackathon reduced from 2 days to 1)\n\nAMBIGUITIES:\n- "Fifty thousand per quarter" — currency not specified\n- Nature of MIT partnership unclear — formal or informal collaboration`,

      anonymization: `Interviewer: Good morning, thank you for agreeing to this interview. Could you start by telling me about your role in the organization?
Respondent 1: Good morning. I'm the head of the innovation department. I've been in this position for about five years now, since <span class="flag-pii flag-date" title="DATE">twenty twenty-one</span>.
Interviewer: How has the organization's approach to innovation changed during that time?
Respondent 1: Well, when I started, innovation was basically a buzzword. We had no dedicated budget, no processes. Everything was ad hoc. Someone would have an idea, maybe pitch it to their manager, and it would either get lost in the shuffle or championed by one person.
Interviewer: And now?
Respondent 1: Now we have a structured innovation pipeline. We run quarterly ideation sessions, we have a small prototyping fund — about fifty thousand per quarter — and we've established partnerships with two universities. <span class="flag-pii flag-name" title="NAME">Professor Johnson</span> at <span class="flag-pii flag-org" title="ORG">MIT</span> has been particularly helpful with our AI initiatives.
Interviewer: How do employees respond to these changes?
Respondent 1: It's mixed, honestly. The younger staff, especially those who joined after <span class="flag-pii flag-date" title="DATE">twenty twenty-two</span>, they're enthusiastic. They grew up with design thinking, agile methods. But some of the senior people are more skeptical. They've seen management fads come and go.
Interviewer: Can you give me a specific example of resistance?
Respondent 1: Sure. We proposed a cross-departmental hackathon last year. The engineering team was all for it, but the finance department pushed back hard. Their argument was that two days of lost productivity couldn't be justified. We eventually compromised on a one-day event.

PII_RISK: LOW
PII_SUMMARY: 1 personal name (Johnson), 1 organization (MIT), 2 date references. Low density — minimal re-identification risk.`,

      speakerCheck: `SPEAKERS_DECLARED: 2
SPEAKERS_ESTIMATED: 2
LABEL_COVERAGE: 100%

Speaker labels detected: Interviewer, Respondent 1.
All turns have consistent speaker labels. No mislabeled or missing turns detected. Turn alternation pattern is consistent with a standard semi-structured interview format.`,
    }
  },

  // ── Run demo ──
  run(lang) {
    const sample = this.samples[lang];
    const results = this.results[lang];
    if (!sample || !results) return;

    // Clear previous results
    const resultsArea = document.getElementById('resultsArea');
    resultsArea.innerHTML = '';
    batchTranslations = [];
    batchReportData = [];
    window._fileExportData = {};

    // Set mode to "both" to show all tabs
    setMode('both');

    // Set target language based on sample
    const targetLangSel = document.getElementById('targetLang');
    if (lang === 'pl') {
      targetLangSel.value = 'English';
    } else {
      targetLangSel.value = 'Polish';
    }

    // Enable relevant checkboxes
    document.getElementById('addSummary').checked = true;
    document.getElementById('addAnonymization').checked = true;
    document.getElementById('addSpeakerCheck').checked = true;

    // Prepare langData
    const langData = lang === 'pl'
      ? { primary: 'Polish', secondary: null }
      : { primary: 'English', secondary: null };

    // Push to batchTranslations for diff view
    batchTranslations.push({
      fileName: sample.fileName,
      original: sample.content,
      translation: results.translation
    });

    // Compute transcript stats
    const transcriptStats = computeTranscriptStats(sample.content, sample.fileName);

    // Render
    renderResult(
      sample.fileName,
      results.translation,
      results.quality,
      results.summary,
      langData,
      results.speakerCheck,
      results.anonymization,
      null,  // backtrans
      null,  // timestamps
      { provider: 'demo', model: 'pre-generated' },
      transcriptStats
    );

    // Set up coding export data
    const codingFId = sample.fileName.replace(/[^a-zA-Z0-9]/g, '_');
    window._fileExportData[codingFId] = {
      fileName: sample.fileName,
      content: sample.content,
      translationResult: results.translation,
      qualityResult: results.quality,
      langData: langData,
      glossaryTerms: [],
      anonymResult: results.anonymization,
      mode: 'both',
      isSrt: false
    };

    // Push to batchReportData for QA report exports
    const scoreMatch = results.quality.match(/QUALITY_SCORE:\s*([\d.]+)/);
    const minorCount = (results.quality.match(/\[Y\]/g) || []).length;
    const seriousCount = (results.quality.match(/\[R\]/g) || []).length;
    batchReportData.push({
      fileName: sample.fileName,
      language: langData.primary,
      score: scoreMatch ? scoreMatch[1] : '0',
      minorFlags: minorCount,
      seriousFlags: seriousCount,
      totalFlags: minorCount + seriousCount,
      flaggedPercent: '2.1',
      summary: results.summary.substring(0, 200)
    });

    // Show batch bar
    const batchBar = document.getElementById('batchExportBar');
    if (batchBar) batchBar.style.display = '';

    // Update icons
    if (typeof lucide !== 'undefined') lucide.createIcons();

    // Scroll to results
    resultsArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
};
