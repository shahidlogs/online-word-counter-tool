(function () {
  const STORAGE_TEXT = "owct_saved_text_v4";
  const STORAGE_NOTES = "owct_saved_notes_v4";
  const STORAGE_AUTOSAVE = "owct_autosave_v4";
  const STORAGE_DARKMODE = "owct_darkmode_v4";

  function getTextArea() {
    return document.getElementById("text");
  }

  function formatDuration(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return String(mins).padStart(2, "0") + ":" + String(secs).padStart(2, "0");
  }

  function formatBytes(bytes) {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  }

  function getSentences(value) {
    return value
      .replace(/\n+/g, " ")
      .split(/[.!?]+/)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  function getWordsArray(value) {
    return value
      .trim()
      .split(/\s+/)
      .map((w) => w.replace(/[^\p{L}\p{N}'’-]/gu, ""))
      .filter(Boolean);
  }

  function countText(value) {
    const trimmed = value.trim();
    const wordsArr = trimmed ? getWordsArray(value) : [];
    const words = wordsArr.length;
    const chars = value.length;
    const charsNo = value.replace(/\s/g, "").length;
    const sentenceList = trimmed ? getSentences(value) : [];
    const sentences = sentenceList.length;
    const paragraphs = trimmed ? value.split(/\n\s*\n/).filter((item) => item.trim().length > 0).length : 0;
    const uniqueWordsSet = new Set(wordsArr.map((w) => w.toLowerCase()));
    const uniqueWords = uniqueWordsSet.size;
    const uniqueRatio = words ? ((uniqueWords / words) * 100).toFixed(2) : "0.00";
    const totalWordChars = wordsArr.reduce((sum, w) => sum + w.length, 0);
    const avgWordLength = words ? (totalWordChars / words).toFixed(3) : "0";
    const sentenceWordCounts = sentenceList.map((s) => getWordsArray(s).length).filter(Boolean);
    const sentenceCharCounts = sentenceList.map((s) => s.length).filter(Boolean);
    const avgSentenceWords = sentenceWordCounts.length
      ? (sentenceWordCounts.reduce((a, b) => a + b, 0) / sentenceWordCounts.length).toFixed(2)
      : "0";
    const avgSentenceChars = sentenceCharCounts.length
      ? (sentenceCharCounts.reduce((a, b) => a + b, 0) / sentenceCharCounts.length).toFixed(2)
      : "0";
    const shortestSentenceWords = sentenceWordCounts.length ? Math.min(...sentenceWordCounts) : 0;
    const longestSentenceWords = sentenceWordCounts.length ? Math.max(...sentenceWordCounts) : 0;
    const longestWordLength = wordsArr.length ? Math.max(...wordsArr.map((w) => w.length)) : 0;
    const readingSeconds = words ? Math.ceil((words / 200) * 60) : 0;
    const speakingSeconds = words ? Math.ceil((words / 130) * 60) : 0;
    const handwritingSeconds = words ? Math.ceil((words / 20) * 60) : 0;

    return {
      words,
      chars,
      charsNo,
      sentences,
      paragraphs,
      uniqueWords,
      uniqueRatio,
      avgWordLength,
      avgSentenceWords,
      avgSentenceChars,
      shortestSentenceWords,
      longestSentenceWords,
      longestWordLength,
      readingSeconds,
      speakingSeconds,
      handwritingSeconds,
      bytes: formatBytes(new Blob([value]).size),
      wordsArray: wordsArr,
      sentenceList
    };
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function showStatus(message, statusLine) {
    if (!statusLine) return;
    statusLine.textContent = message;
    clearTimeout(showStatus._timer);
    showStatus._timer = setTimeout(() => {
      statusLine.textContent = "";
    }, 1600);
  }

  function getSavedNotes() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_NOTES)) || [];
    } catch {
      return [];
    }
  }

  function setSavedNotes(notes) {
    localStorage.setItem(STORAGE_NOTES, JSON.stringify(notes));
  }

  function renderNotes(notesWrap) {
    const notes = getSavedNotes();
    if (!notes.length) {
      notesWrap.innerHTML = '<div class="empty-state">No saved notes yet. Save your current text to keep it for later.</div>';
      return;
    }

    notesWrap.innerHTML =
      '<div class="notes-list">' +
      notes.map((note) => `
        <div class="note-item">
          <div>
            <p class="note-title">${escapeHtml(note.title)}</p>
            <p class="note-sub">${note.words} words • ${new Date(note.createdAt).toLocaleString()}</p>
          </div>
          <div class="note-actions">
            <button class="note-action open" type="button" data-open-note="${note.id}">Open</button>
            <button class="note-action rename" type="button" data-rename-note="${note.id}">Rename</button>
            <button class="note-action delete" type="button" data-delete-note="${note.id}">Delete</button>
          </div>
        </div>
      `).join("") +
      "</div>";
  }

  function saveCurrentNote(text, statusLine, notesWrap) {
    const value = text.value.trim();
    if (!value) {
      showStatus("Write some text first.", statusLine);
      return;
    }

    const title = window.prompt("What would you like to call this note?", "Note");
    if (title === null) return;

    const words = getWordsArray(value).length;
    const notes = getSavedNotes();
    notes.unshift({
      id: Date.now().toString(),
      title: title.trim() || "Note",
      content: text.value,
      words,
      createdAt: new Date().toISOString()
    });

    setSavedNotes(notes);
    renderNotes(notesWrap);
    showStatus("Note saved.", statusLine);
  }

  function setAutosaveState(isOn, text, autosaveToggle, autosaveToggleClone, statusLine) {
    autosaveToggle.checked = isOn;
    autosaveToggleClone.checked = isOn;
    localStorage.setItem(STORAGE_AUTOSAVE, isOn ? "1" : "0");
    if (isOn) {
      localStorage.setItem(STORAGE_TEXT, text.value);
      if (statusLine) showStatus("Auto save enabled.", statusLine);
    } else if (statusLine) {
      showStatus("Auto save disabled.", statusLine);
    }
  }

  function setDarkModeState(isOn, darkModeToggle, darkModeToggleClone, statusLine) {
    darkModeToggle.checked = isOn;
    darkModeToggleClone.checked = isOn;
    document.body.setAttribute("data-theme", isOn ? "dark" : "light");
    localStorage.setItem(STORAGE_DARKMODE, isOn ? "1" : "0");
    if (statusLine) {
      showStatus(isOn ? "Dark mode enabled." : "Light mode enabled.", statusLine);
    }
  }

  function bindTool() {
    const text = getTextArea();
    if (!text) return;

    const statusLine = document.getElementById("statusLine");
    const notesWrap = document.getElementById("notesWrap");
    const clearBtn = document.getElementById("clearBtn");
    const copyBtn = document.getElementById("copyBtn");
    const pasteBtn = document.getElementById("pasteBtn");
    const saveNoteBtn = document.getElementById("saveNoteBtn");
    const saveNoteBtn2 = document.getElementById("saveNoteBtn2");
    const downloadBtn = document.getElementById("downloadBtn");
    const sampleBtn = document.getElementById("sampleBtn");
    const exportNotesBtn = document.getElementById("exportNotesBtn");
    const autosaveToggle = document.getElementById("autosaveToggle");
    const darkModeToggle = document.getElementById("darkModeToggle");
    const autosaveToggleClone = document.getElementById("autosaveToggleClone");
    const darkModeToggleClone = document.getElementById("darkModeToggleClone");
    const themeToggle = document.getElementById("themeToggle");

    const summaryElements = {
      words: document.getElementById("words"),
      chars: document.getElementById("chars"),
      sentences: document.getElementById("sentences"),
      paragraphs: document.getElementById("paragraphs")
    };

    const statsElements = {
      words: document.getElementById("words2"),
      chars: document.getElementById("chars2"),
      charsNo: document.getElementById("charsNo"),
      sentences: document.getElementById("sentences2"),
      paragraphs: document.getElementById("paragraphs2"),
      sizeBytes: document.getElementById("sizeBytes"),
      uniqueWords: document.getElementById("uniqueWords"),
      uniqueRatio: document.getElementById("uniqueRatio"),
      avgWordLength: document.getElementById("avgWordLength"),
      avgSentenceWords: document.getElementById("avgSentenceWords"),
      avgSentenceChars: document.getElementById("avgSentenceChars"),
      shortestSentenceWords: document.getElementById("shortestSentenceWords"),
      longestSentenceWords: document.getElementById("longestSentenceWords"),
      longestWordLength: document.getElementById("longestWordLength"),
      readingTime: document.getElementById("readingTime"),
      speakingTime: document.getElementById("speakingTime"),
      handwritingTime: document.getElementById("handwritingTime")
    };

    function updateCounts() {
      let value = text.value;
      if (value.length > 150000) {
        value = value.substring(0, 150000);
        text.value = value;
      }

      const data = countText(value);
      if (summaryElements.words) summaryElements.words.textContent = data.words;
      if (summaryElements.chars) summaryElements.chars.textContent = data.chars;
      if (summaryElements.sentences) summaryElements.sentences.textContent = data.sentences;
      if (summaryElements.paragraphs) summaryElements.paragraphs.textContent = data.paragraphs;

      if (statsElements.words) statsElements.words.textContent = data.words;
      if (statsElements.chars) statsElements.chars.textContent = data.chars;
      if (statsElements.charsNo) statsElements.charsNo.textContent = data.charsNo;
      if (statsElements.sentences) statsElements.sentences.textContent = data.sentences;
      if (statsElements.paragraphs) statsElements.paragraphs.textContent = data.paragraphs;
      if (statsElements.sizeBytes) statsElements.sizeBytes.textContent = data.bytes;
      if (statsElements.uniqueWords) statsElements.uniqueWords.textContent = data.uniqueWords;
      if (statsElements.uniqueRatio) statsElements.uniqueRatio.textContent = data.uniqueRatio + "%";
      if (statsElements.avgWordLength) statsElements.avgWordLength.textContent = data.avgWordLength;
      if (statsElements.avgSentenceWords) statsElements.avgSentenceWords.textContent = data.avgSentenceWords;
      if (statsElements.avgSentenceChars) statsElements.avgSentenceChars.textContent = data.avgSentenceChars;
      if (statsElements.shortestSentenceWords) statsElements.shortestSentenceWords.textContent = data.shortestSentenceWords;
      if (statsElements.longestSentenceWords) statsElements.longestSentenceWords.textContent = data.longestSentenceWords;
      if (statsElements.longestWordLength) statsElements.longestWordLength.textContent = data.longestWordLength;
      if (statsElements.readingTime) statsElements.readingTime.textContent = formatDuration(data.readingSeconds);
      if (statsElements.speakingTime) statsElements.speakingTime.textContent = formatDuration(data.speakingSeconds);
      if (statsElements.handwritingTime) statsElements.handwritingTime.textContent = formatDuration(data.handwritingSeconds);

      if (autosaveToggle && autosaveToggle.checked) {
        localStorage.setItem(STORAGE_TEXT, value);
      }
    }

    function handleNotesEvents(event) {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      const noteId = target.getAttribute("data-open-note") || target.getAttribute("data-rename-note") || target.getAttribute("data-delete-note");
      if (!noteId) return;
      const notes = getSavedNotes();
      const note = notes.find((item) => item.id === noteId);
      if (!note) return;
      if (target.matches("[data-open-note]")) {
        text.value = note.content;
        updateCounts();
        text.focus();
        showStatus("Note opened.", statusLine);
      } else if (target.matches("[data-rename-note]")) {
        const newTitle = window.prompt("Rename note", note.title);
        if (newTitle === null) return;
        note.title = newTitle.trim() || note.title;
        setSavedNotes(notes);
        renderNotes(notesWrap);
        showStatus("Note renamed.", statusLine);
      } else if (target.matches("[data-delete-note]")) {
        const filtered = notes.filter((item) => item.id !== noteId);
        setSavedNotes(filtered);
        renderNotes(notesWrap);
        showStatus("Note deleted.", statusLine);
      }
    }

    text.addEventListener("input", updateCounts);

    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        text.value = "";
        updateCounts();
        text.focus();
        showStatus("Text cleared.", statusLine);
      });
    }

    if (copyBtn) {
      copyBtn.addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(text.value);
          showStatus("Copied.", statusLine);
        } catch (error) {
          showStatus("Copy failed.", statusLine);
        }
      });
    }

    if (pasteBtn) {
      pasteBtn.addEventListener("click", async () => {
        try {
          const clipText = await navigator.clipboard.readText();
          text.value = clipText;
          updateCounts();
          text.focus();
          showStatus("Pasted.", statusLine);
        } catch (error) {
          showStatus("Paste failed.", statusLine);
        }
      });
    }

    if (saveNoteBtn) saveNoteBtn.addEventListener("click", () => saveCurrentNote(text, statusLine, notesWrap));
    if (saveNoteBtn2) saveNoteBtn2.addEventListener("click", () => saveCurrentNote(text, statusLine, notesWrap));

    if (downloadBtn) {
      downloadBtn.addEventListener("click", () => {
        const blob = new Blob([text.value], { type: "text/plain;charset=utf-8" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "text.txt";
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(a.href);
        showStatus("TXT downloaded.", statusLine);
      });
    }

    if (exportNotesBtn) {
      exportNotesBtn.addEventListener("click", () => {
        const notes = getSavedNotes();
        const blob = new Blob([JSON.stringify(notes, null, 2)], { type: "application/json;charset=utf-8" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "saved-notes.json";
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(a.href);
        showStatus("Notes exported.", statusLine);
      });
    }

    if (sampleBtn) {
      sampleBtn.addEventListener("click", () => {
        text.value = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.\n\nUt enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.";
        updateCounts();
        showStatus("Sample loaded.", statusLine);
      });
    }

    if (autosaveToggle && autosaveToggleClone) {
      autosaveToggle.addEventListener("change", () => setAutosaveState(autosaveToggle.checked, text, autosaveToggle, autosaveToggleClone, statusLine));
      autosaveToggleClone.addEventListener("change", () => setAutosaveState(autosaveToggleClone.checked, text, autosaveToggle, autosaveToggleClone, statusLine));
    }

    if (darkModeToggle && darkModeToggleClone) {
      darkModeToggle.addEventListener("change", () => setDarkModeState(darkModeToggle.checked, darkModeToggle, darkModeToggleClone, statusLine));
      darkModeToggleClone.addEventListener("change", () => setDarkModeState(darkModeToggleClone.checked, darkModeToggle, darkModeToggleClone, statusLine));
    }

    if (themeToggle) {
      themeToggle.addEventListener("click", () => {
        const isDark = document.body.getAttribute("data-theme") === "dark";
        setDarkModeState(!isDark, darkModeToggle || { checked: false }, darkModeToggleClone || { checked: false }, statusLine);
      });
    }

    if (notesWrap) {
      notesWrap.addEventListener("click", handleNotesEvents);
    }

    (function init() {
      const savedAutosave = localStorage.getItem(STORAGE_AUTOSAVE);
      const autosaveOn = savedAutosave !== "0";
      if (autosaveToggle && autosaveToggleClone) {
        setAutosaveState(autosaveOn, text, autosaveToggle, autosaveToggleClone, null);
      }

      const savedDark = localStorage.getItem(STORAGE_DARKMODE);
      const darkOn = savedDark === "1";
      if (darkModeToggle && darkModeToggleClone) {
        setDarkModeState(darkOn, darkModeToggle, darkModeToggleClone, null);
      }

      if (autosaveToggle && autosaveToggle.checked) {
        const savedText = localStorage.getItem(STORAGE_TEXT);
        if (savedText) text.value = savedText;
      }

      if (notesWrap) renderNotes(notesWrap);
      updateCounts();
    })();
  }

  document.addEventListener("DOMContentLoaded", bindTool);
})();
