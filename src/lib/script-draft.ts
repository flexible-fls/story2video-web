const DRAFT_SCRIPT_TEXT_KEY = "draft_script_text";
const DRAFT_SCRIPT_NAME_KEY = "draft_script_name";

export function saveDraftScript(text: string, fileName?: string) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(DRAFT_SCRIPT_TEXT_KEY, text);

  if (fileName) {
    window.localStorage.setItem(DRAFT_SCRIPT_NAME_KEY, fileName);
  } else {
    window.localStorage.removeItem(DRAFT_SCRIPT_NAME_KEY);
  }
}

export function loadDraftScript() {
  if (typeof window === "undefined") {
    return {
      text: "",
      fileName: "",
    };
  }

  return {
    text: window.localStorage.getItem(DRAFT_SCRIPT_TEXT_KEY) || "",
    fileName: window.localStorage.getItem(DRAFT_SCRIPT_NAME_KEY) || "",
  };
}

export function clearDraftScript() {
  if (typeof window === "undefined") return;

  window.localStorage.removeItem(DRAFT_SCRIPT_TEXT_KEY);
  window.localStorage.removeItem(DRAFT_SCRIPT_NAME_KEY);
}