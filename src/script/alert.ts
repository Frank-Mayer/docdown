import {
  addDisposableEventListener,
  disposeNode,
} from "@frank-mayer/magic/bin";
import passive from "./passive";

export const alert = (message: string) =>
  new Promise<void>((resolve) => {
    const alert = document.createElement("div");
    alert.classList.add("alert");

    const p = document.createElement("p");
    p.innerText = message;
    alert.appendChild(p);

    document.body.appendChild(alert);
    addDisposableEventListener(alert, "click", () => {
      disposeNode(alert, true);
      resolve();
    });
  });

export const form = <KEY extends string>(
  query: Array<{
    label: string;
    name: KEY;
    type: string;
    placeholder?: string;
    required: boolean;
    autocomplete?: string;
    value?: string;
  }>
) =>
  new Promise<{ [key in KEY]: string }>((resolve, reject) => {
    const alert = document.createElement("div");
    alert.classList.add("alert");

    const form = document.createElement("form");

    let first: HTMLInputElement | null = null;

    for (const queryEl of query) {
      const labelEl = document.createElement("label");
      labelEl.innerText = queryEl.label;

      const inputEl = document.createElement("input");
      inputEl.name = queryEl.name;
      inputEl.type = queryEl.type;
      inputEl.required = queryEl.required;
      if (queryEl.autocomplete) {
        inputEl.autocomplete = queryEl.autocomplete;
      }
      if (queryEl.placeholder) {
        inputEl.placeholder = queryEl.placeholder;
      }
      if (queryEl.value) {
        if (queryEl.type === "checkbox") {
          inputEl.checked = Boolean(queryEl.value);
        } else {
          inputEl.value = queryEl.value;
        }
      }

      if (!first) {
        first = inputEl;
      }

      labelEl.appendChild(inputEl);

      form.appendChild(labelEl);
    }

    const submit = document.createElement("input");
    submit.type = "submit";
    submit.value = "OK";
    form.appendChild(submit);

    addDisposableEventListener(
      form,
      "submit",
      (ev) => {
        ev.preventDefault();

        const inputValues: {
          [key in KEY]: string;
        } = new Object() as any;
        for (const el of Array.from(form.querySelectorAll("input"))) {
          if (el.type === "checkbox") {
            inputValues[el.name as KEY] = el.checked ? "x" : "";
          } else {
            inputValues[el.name as KEY] = el.value;
          }
        }
        resolve(inputValues);
        disposeNode(alert, true);
      },
      {
        capture: true,
        once: true,
        passive: false,
      }
    );

    alert.appendChild(form);
    addDisposableEventListener(
      alert,
      "click",
      (ev) => {
        if (ev.target === alert) {
          disposeNode(alert, true);
          reject();
        }
      },
      passive
    );

    document.body.appendChild(alert);

    first?.focus();
  });