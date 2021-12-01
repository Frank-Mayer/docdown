const htmlEl = document.documentElement;

export type language = "en" | "de";

export enum textId {
  sources,
  unknown_source,
  author,
  title,
  creation_date,
  last_access,
  link,
  export_pdf,
  download_pdf,
  start_new_session,
  stop_session,
  add_source,
  delete_source,
  use_source,
  last_accessed_at,
  find,
  replace,
  replace_all,
  find_and_replace,
  not_found,
  show_help,
  rename_file,
  open_local_file,
  download_file,
  print,
  switch_code_render,
  toggle_display_render,
  zoom_in,
  zoom_out,
  shortcut,
  description,
  set_language,
  untitled,
  unknown,
  table_of_contents,
  guest_user,
  line,
  column,
  selected,
  words,
  theme,
  ocean,
  lime,
  magma,
  tutorial_0,
  tutorial_1,
  tutorial_2,
  tutorial_3,
  tutorial_4,
  tutorial_5,
  tutorial_6,
  tutorial_7,
  tutorial_8,
  yes,
  no,
  next,
}

const future = new Date().getFullYear() + 24;

const localStringMap: { [key in language]: { [key in textId]: string } } = {
  de: [
    "Einzelnachweise",
    "Quelle unbekannt",
    "Autor",
    "Titel",
    "Erstellungsdatum",
    "Letzter Zugriff",
    "Link",
    "PDF exportieren",
    "PDF herunterladen",
    "Sitzung starten",
    "Sitzung beenden",
    "Quelle hinzufügen",
    "Quelle löschen",
    "Quelle verlinken",
    "Zuletzt zugegriffen am",
    "Suchen",
    "Ersetzen",
    "Alle ersetzen",
    "Suchen und ersetzen",
    "Nicht gefunden",
    "Hilfe anzeigen",
    "Datei umbenennen",
    "Lokale Datei öffnen",
    "Datei herunterladen",
    "Drucken",
    "Wechsle zwischen Code- und Anzeigemodus",
    "Schalte Anzeigemodus neben Codeanzeige an oder aus",
    "Anzeige vergrößern",
    "Anzeige verkleinern",
    "Tastenkürzel",
    "Beschreibung",
    "Sprache ändern",
    "Unbenannt",
    "unbekannt",
    "Inhaltsverzeichnis",
    "Gastbenutzer",
    "Zeile",
    "Spalte",
    "Ausgewählt",
    "Wörter",
    "Design",
    "Ozean",
    "Limette",
    "Magma",
    "Möchtest Du die Anleitung zu docdown starten? Du kannst sie auch später über den Fragezeichen-Button am unteren Bildschirmrand starten.",
    `Mein Name ist Dr. Marc Down, diese Technologie habe ich aus dem Jahr ${future} mitgebracht! Ich erkläre Dir das notwendigste kurz und knapp. Hoffentlich brennen Dir bei der folgenden Erklärung nicht die Schaltkreise durch!`,
    "In dem Textfeld in der Mitte des Fensters kannst Du Deine Dokumentation in Markdown schreiben, Markdown ist auch in diesem Jahr schon bekannt, oder?",
    "Auf der rechten Seite wird Dir eine Vorschau Deiner Dokumentation angezeigt. Erst beim Export wird ein Inhalts- und Quellenverzeichnis generiert.",
    "Mit der Tastenkombination STRG E kannst Du zwischen der Markdown und der Vorschau-Anzeige wechseln, mit STRG &#8679; E wird die Vorschauanzeige neben dem Code an- oder ausgeschaltet. Versuch es doch gleich mal!",
    "Über das Rechtsklick-Menü kann das Dokument zu PDF exportiert oder ganz altmodisch gedruckt werden.",
    "Unten links befindet sich eine Liste deiner Quellen. Über das Rechtsklick-Menü kannst Du eine Quelle hinzufügen, löschen oder bearbeiten.\nUm eine Quelle zu verwenden, klicke zuerst im Markdown-Editor an die gewünschte Stelle und wähle danach eine Quelle aus der Liste aus.\nUm eine verwendete Quelle wieder zu entfernen, lösche einfach den src Tag im Markdown.",
    "Verwende die F1 Taste, um die Hilfe zu öffnen, dort findest Du einige sehr nützliche Tastenkürzel.",
    "Das war’s erst mal, ich muss jetzt zurück in die Zukunft, bis bald!",
    "Ja",
    "Nein",
    "Weiter",
  ],
  en: [
    "References",
    "Unknown source",
    "Author",
    "Title",
    "Creation date",
    "Last access",
    "Link",
    "Export to PDF",
    "Download PDF",
    "Start a session",
    "Stop session",
    "Add source",
    "Delete source",
    "Use source",
    "Last accessed at",
    "Find",
    "Replace",
    "Replace all",
    "Find and replace",
    "Not found",
    "Show help",
    "Rename file",
    "Open local file",
    "Download file",
    "Print",
    "Switch between code and display mode",
    "Toggle display mode beside code on or off",
    "Zoom in",
    "Zoom out",
    "Shortcut",
    "Description",
    "Set language",
    "Untitled",
    "unknown",
    "Table of contents",
    "Guest user",
    "Line",
    "Column",
    "Selected",
    "Words",
    "Theme",
    "Ocean",
    "Lime",
    "Magma",
    "Would you like to learn how to use docdown? You can also do that later by clicking the question mark button at the bottom of the screen.",
    `My name is Dr. Marc Down, I brought this technology from ${future}! I explain you the most necessary briefly and concisely. Hopefully the following explanation will not burn out your circuits!`,
    "In the text field in the middle of the window you can write your documentation in Markdown, Markdown is already known this year, right?",
    "On the right side you will see a preview of your documentation. A table of contents and a table of sources are generated during the export.",
    "CTRL E lets you switch between the Markdown and preview display, CTRL &#8679; E toggles the preview display next to the code on or off.",
    "Using the right-click menu, the document can be exported to PDF or printed the old-fashioned way.",
    "At the bottom left is a list of your sources. Use the right-click menu to add, delete or edit a source.\nTo use a source, first click on the desired location in the Markdown editor and then select a source from the list.\nTo remove a used source, simply delete the src tag in Markdown.",
    "Use the F1 key to open the help, there you will find some very useful keyboard shortcuts.",
    "That's it for now, I have to get back to the future, see you soon!",
    "Yes",
    "No",
    "Next",
  ],
};

let currentLanguage: language;

export const getLocale = (): language => currentLanguage;

export const setLocale = (language: language): void => {
  if (language in localStringMap) {
    currentLanguage = language;
    htmlEl.lang = language;
  } else {
    throw new Error(`Language ${language} not supported`);
  }
};

setLocale(navigator.language.includes("de") ? "de" : "en");

export const getText = (id: textId) => localStringMap[currentLanguage][id];
