import { context } from "./context";
import html2pdf from "html2pdf.js";

const pdf = html2pdf().set({
  margin: 1,
  jsPDF: { unit: "cm", format: "A4", orientation: "portrait" },
});

const displayEl = document.getElementById("display") as HTMLDivElement;

displayEl.addEventListener(
  "contextmenu",
  (ev) => {
    ev.preventDefault();
    ev.stopPropagation();

    context(ev, [
      {
        label: "Export PDF",
        action: () => {
          pdf.from(displayEl.innerHTML).save();
        },
      },
    ]);
  },
  {
    passive: false,
    capture: true,
  }
);
