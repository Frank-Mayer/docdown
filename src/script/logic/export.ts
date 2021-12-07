import { getLocale, getText, textId } from "../data/local";
import {
  defaultStyle,
  faChecked,
  faUnchecked,
  fonts,
  styles,
  syntaxStyles,
} from "../data/pdfStylesheet";
import {
  centimeterToPoint,
  isNullOrWhitespace,
  mapArrayAllowEmpty,
  parseFileNameToImageAlt,
  removeEmpty,
} from "../data/dataHelper";
import { getTitle } from "./session";
import { getUser } from "./database";
import { hasSources, mapSources } from "./sources";
import { createPdf as pdfmakeCreatePdf } from "pdfmake/build/pdfmake";

import type { Content, TDocumentDefinitions } from "pdfmake/interfaces";
import { None, Some } from "../Option";
import type { Option } from "../Option";
import { listenForMessage, sendMessage, service } from "../router";
import { getHeaderText } from "./headerText";
import { previewPdf } from "../ui/adobe-pdf";

const displayEl = document.getElementById("display") as HTMLDivElement;

export const sourcesJump = new Map<string, [Content]>();
let imgCount = 0;
const addSourceJump = (sup: HTMLElement, sourceId: string) => {
  const jumpArr = sourcesJump.get(sourceId);
  if (jumpArr) {
    sup.id = `src_${sourceId}_${jumpArr.length}`;
    jumpArr.push({
      text: "↑" + (jumpArr.length + 1),
      style: "src",
      linkToDestination: sup.id,
    });
    sourcesJump.set(sourceId, jumpArr);
  } else {
    sup.id = `${sourceId}_0`;
    sourcesJump.set(sourceId, [
      { text: "↑1", style: "src", linkToDestination: sup.id },
    ]);
  }
};

const mapSyntaxToPdfContent = (el: Node): Option<Content> => {
  if (el instanceof HTMLElement) {
    if (el.children.length === 0) {
      const classes = Array.from(el.classList);
      for (const cls of classes) {
        const classStyle = syntaxStyles.get(cls);
        if (classStyle) {
          return Some({
            text: el.innerText,
            style: classStyle,
          });
        }
      }

      return Some({
        text: el.innerText,
        style: "code",
      });
    } else {
      return Some(
        mapArrayAllowEmpty(Array.from(el.childNodes), mapSyntaxToPdfContent)
      );
    }
  } else {
    if (!el.textContent) {
      return None();
    }

    const classes = Array.from(el.parentElement!.classList);
    for (const cls of classes) {
      const classStyle = syntaxStyles.get(cls);
      if (classStyle) {
        return Some({
          text: el.textContent,
          style: classStyle,
        });
      }
    }

    return Some({
      text: el.textContent,
      style: "code",
    });
  }
};

const getHeadLinkId = (el: HTMLHeadingElement) =>
  "h_" + el.innerText.toLowerCase().replace(/\s+/g, "_");

const mapDomToPdfContent = (el: Node): Option<Content> => {
  if (el instanceof Element) {
    switch (el.tagName) {
      case "H1":
        const h1 = el as HTMLHeadingElement;
        return Some({
          text:
            h1.children.length === 0
              ? h1.innerText
              : mapArrayAllowEmpty(
                  Array.from(h1.childNodes),
                  mapDomToPdfContent
                ),
          style: "h1",
          tocItem: "mainToc",
          tocStyle: "toc_h1",
          id: getHeadLinkId(h1),
        });
      case "H2":
        const h2 = el as HTMLHeadingElement;
        return Some({
          text:
            h2.children.length === 0
              ? h2.innerText
              : mapArrayAllowEmpty(
                  Array.from(h2.childNodes),
                  mapDomToPdfContent
                ),
          style: "h2",
          tocItem: "mainToc",
          tocStyle: "toc_h2",
          tocMargin: [20, 0, 0, 0],
          id: getHeadLinkId(h2),
        });
      case "H3":
        const h3 = el as HTMLHeadingElement;
        return Some({
          text:
            h3.children.length === 0
              ? h3.innerText
              : mapArrayAllowEmpty(
                  Array.from(h3.childNodes),
                  mapDomToPdfContent
                ),
          style: "h3",
          tocItem: "mainToc",
          tocStyle: "toc_h3",
          tocMargin: [40, 0, 0, 0],
          id: getHeadLinkId(h3),
        });
      case "H4":
        const h4 = el as HTMLHeadingElement;
        return Some({
          text:
            h4.children.length === 0
              ? h4.innerText
              : mapArrayAllowEmpty(
                  Array.from(h4.childNodes),
                  mapDomToPdfContent
                ),
          style: "h4",
          id: getHeadLinkId(h4),
        });
      case "H5":
        const h5 = el as HTMLHeadingElement;
        return Some({
          text:
            h5.children.length === 0
              ? h5.innerText
              : mapArrayAllowEmpty(
                  Array.from(h5.childNodes),
                  mapDomToPdfContent
                ),
          style: "h5",
          id: getHeadLinkId(h5),
        });
      case "H6":
        const h6 = el as HTMLHeadingElement;
        return Some({
          text:
            h6.children.length === 0
              ? h6.innerText
              : mapArrayAllowEmpty(
                  Array.from(h6.childNodes),
                  mapDomToPdfContent
                ),
          style: "h6",
          id: getHeadLinkId(h6),
        });
      case "OL":
      case "UL":
        const listEl = el as HTMLOListElement | HTMLUListElement;
        if (listEl.children.length === 0) {
          return None();
        } else {
          const insertAfter = new Map<number, Content>();

          const content: Content[] = mapArrayAllowEmpty(
            Array.from(listEl.children),
            (li, i): Option<Content> => {
              // Only LI Elements are valid List children
              if (li.tagName === "LI") {
                const check = li.classList.contains("checked")
                  ? 1
                  : li.classList.contains("unchecked")
                  ? 2
                  : 0;

                // simple list item
                if (li.children.length === 0) {
                  switch (check) {
                    case 0:
                      return Some((li as HTMLLIElement).innerText);
                    case 1:
                      return Some({
                        text: [...faChecked, (li as HTMLLIElement).innerText],
                        listType: "none",
                      });
                    case 2:
                      return Some({
                        text: [...faUnchecked, (li as HTMLLIElement).innerText],
                        listType: "none",
                      });
                  }
                }

                const liContent = mapArrayAllowEmpty(
                  Array.from(li.childNodes),
                  (el): Option<Content> => {
                    if (el.nodeType === Node.TEXT_NODE) {
                      return Some(el.textContent);
                    } else if (el.nodeType === Node.ELEMENT_NODE) {
                      if (["SPAN", "P"].includes((el as HTMLElement).tagName)) {
                        return Some(el.textContent);
                      } else if (
                        ["OL", "UL"].includes((el as HTMLElement).tagName)
                      ) {
                        insertAfter.set(
                          i,
                          mapDomToPdfContent(el).unwrapUnchecked()
                        );
                        return None();
                      } else {
                        return mapDomToPdfContent(el);
                      }
                    } else {
                      return None();
                    }
                  }
                );

                switch (check) {
                  case 0:
                    return Some({
                      text: liContent.length === 1 ? liContent[0]! : liContent,
                      style: "list",
                    });
                  case 1:
                    return Some({
                      text: [
                        ...faChecked,
                        liContent.length === 1 ? liContent[0]! : liContent,
                      ],
                      style: "list",
                      listType: "none",
                    });
                  case 2:
                    return Some({
                      text: [
                        ...faUnchecked,
                        liContent.length === 1 ? liContent[0]! : liContent,
                      ],
                      style: "list",
                      listType: "none",
                    });
                }
              } else {
                return None();
              }
            }
          );

          for (const [i, c] of insertAfter) {
            content.splice(i + 1, 0, c);
          }

          if (listEl.tagName === "OL") {
            return Some({
              ol: content,
              style: "list",
              listType: "ordered",
            });
          } else {
            return Some({
              ul: content,
              style: "list",
              listType: "unordered",
            });
          }
        }

      case "PRE":
        const pre = el as HTMLPreElement;
        if (pre.children.length === 0) {
          return Some({
            text: pre.innerText,
            style: "code",
            font: "JetBrainsMono",
          });
        } else {
          return Some(
            mapArrayAllowEmpty(Array.from(pre.childNodes), (el) =>
              mapDomToPdfContent(el)
            )
          );
        }
      case "BLOCKQUOTE":
        const blockquote = el as HTMLQuoteElement;
        return Some({
          text: blockquote.innerText,
          style: "blockquote",
        });
      case "IMG":
        imgCount++;
        const img = el as HTMLImageElement;
        try {
          return Some([
            {
              image: img.src,
              style: "image",
              width: 434,
            },
            {
              text: `${getText(
                textId.figure
              )} ${imgCount}: ${parseFileNameToImageAlt(
                isNullOrWhitespace(img.title)
                  ? img.alt
                  : `${img.alt} - ${img.title}`
              )}`,
              style: "image_caption",
              tocItem: "lof",
            },
          ]);
        } catch (err) {
          console.error("Could not export image", img, err);
          return Some({ text: img.alt, style: "span" });
        }
      case "TABLE":
        const table = el as HTMLTableElement;

        let headerRows = 0;
        let oddEven = false;

        const body = Array.from(table.rows).map((row) => {
          let containsTableHead = false;

          const pdfRow = mapArrayAllowEmpty(Array.from(row.cells), (cell) => {
            if (cell.tagName === "TH") {
              containsTableHead = true;
            }
            return Some({
              text:
                cell.children.length === 0
                  ? cell.innerText
                  : mapArrayAllowEmpty(
                      Array.from(cell.childNodes),
                      mapDomToPdfContent
                    ),
              style: cell.tagName.toLowerCase(),
              alignment: "left",
              fillColor: oddEven ? "#f2f2f2" : "white",
            });
          });

          if (containsTableHead) {
            headerRows++;
          }

          oddEven = !oddEven;

          return pdfRow;
        });

        return Some(
          headerRows > 0
            ? {
                table: {
                  widths: "auto",
                  body,
                  headerRows,
                  keepWithHeaderRows: headerRows,
                },
              }
            : {
                table: {
                  dontBreakRows: true,
                  widths: "auto",
                  body,
                },
              }
        );
      case "A":
        const a = el as HTMLAnchorElement;

        let link: Partial<Content>;
        if (
          a.href.startsWith("#") ||
          a.href.startsWith(location.origin + "#") ||
          a.href.startsWith(location.origin + "/#")
        ) {
          // i want everything behind the first #
          const hrefSplitArr = a.href.split("#");
          hrefSplitArr.shift();
          link = { linkToDestination: "h_" + hrefSplitArr.join("#") };
        } else {
          link = { link: a.href };
        }

        if (a.children.length === 0) {
          return Some({
            text: a.innerText,
            ...link,
            style: "a",
          });
        } else {
          return Some(
            mapArrayAllowEmpty(Array.from(a.childNodes), mapDomToPdfContent)
          );
        }
      case "CODE":
        const code = el as HTMLElement;
        if (code.children.length === 0) {
          return Some({
            text: code.innerText,
            style: "code",
            font: "JetBrainsMono",
          });
        } else {
          return Some({
            text: mapArrayAllowEmpty(
              Array.from(code.childNodes),
              mapSyntaxToPdfContent
            ).flat(),
          });
        }
      case "BOLD":
      case "STRONG":
        const strong = el as HTMLElement;
        if (strong.children.length === 0) {
          return Some({
            text: strong.innerText,
            bold: true,
          });
        } else {
          return Some(
            mapArrayAllowEmpty(Array.from(strong.childNodes), (el) =>
              mapDomToPdfContent(el)
            )
          );
        }
      case "EM":
      case "ITALIC":
        const em = el as HTMLElement;
        if (em.children.length === 0) {
          return Some({
            text: em.innerText,
            italics: true,
          });
        } else {
          return Some(
            mapArrayAllowEmpty(Array.from(em.childNodes), (el) =>
              mapDomToPdfContent(el)
            )
          );
        }
      case "UNDERLINE":
      case "U":
        const u = el as HTMLElement;
        if (u.children.length === 0) {
          return Some({
            text: u.innerText,
            decoration: "underline",
          });
        } else {
          return Some(
            mapArrayAllowEmpty(Array.from(u.childNodes), (el) =>
              mapDomToPdfContent(el)
            )
          );
        }
      case "SUP":
        const sup = el as HTMLElement;
        const src = sup.getAttribute("src");
        if (src) {
          addSourceJump(sup, src);
          return Some({
            id: sup.id,
            text: sup.innerText,
            style: "src",
            linkToDestination: src,
          });
        } else {
          return Some({
            text: sup.innerText,
            style: "sup",
          });
        }
      case "SUB":
        const sub = el as HTMLElement;
        return Some({
          text: sub.innerText,
          style: "sub",
        });
      case "BR":
        return Some({ text: "\n" });
      case "HR":
        return Some({
          margin: [0, 12, 0, 0],
          canvas: [
            {
              type: "line",
              x1: 0,
              y1: 0,
              x2: 434,
              y2: 0,
              lineWidth: 0.5,
              lineColor: "#BDBDBD",
            },
          ],
        });
      default:
        if (el.children.length === 0) {
          if ("innerText" in el) {
            return Some({
              text: (el as HTMLElement).innerText,
            });
          } else {
            if (isNullOrWhitespace(el.textContent)) {
              return None();
            } else {
              return Some({
                text: el.textContent!,
              });
            }
          }
        } else {
          const childrenData = mapArrayAllowEmpty(
            Array.from(el.childNodes),
            mapDomToPdfContent
          );
          if (childrenData.length === 1) {
            return Some(childrenData[0]!);
          } else {
            return Some({
              text: childrenData,
            });
          }
        }
    }
  } else {
    if (el.textContent) {
      return Some({
        text: el.textContent,
      });
    } else {
      return None();
    }
  }
};

const toc: Content = {
  toc: {
    id: "mainToc",
    title: { text: getText(textId.table_of_contents), style: "h1" },
  },
  pageBreak: "after",
};

const lof: Content = [
  {
    text: getText(textId.table_of_figures),
    style: "hidden",
    tocItem: "mainToc",
    tocStyle: "toc_h1",
  },
  {
    toc: {
      id: "lof",
      title: { text: getText(textId.table_of_figures), style: "h1" },
    },
    tocItem: "mainToc",
  },
];

const title = (): Content => {
  return {
    text: getTitle() + "\n",
    style: "title",
  };
};

const sources = (): Option<Content> => {
  if (!hasSources()) {
    return None();
  }

  return Some(
    removeEmpty<Content>([
      Some<Content>({
        pageBreak: "before",
        text: getText(textId.sources),
        style: "h1",
        tocItem: "mainToc",
        tocStyle: "toc_h1",
      }),
      Some<Content>({
        ol: mapSources<Content>((s) => {
          return {
            text: [
              ...sourcesJump.get(s.id)!,
              `${s.author}, ${s.title}, ${s.creationDate}, ${s.lastAccessed}, `,
              {
                text: s.link,
                link: s.link,
                style: "a",
              },
            ],
            style: "list",
            id: s.id,
          };
        }),
      }),
    ])
  );
};

const createDocDefinition = (): TDocumentDefinitions => {
  const docDefinition: TDocumentDefinitions = {
    info: {
      title: getTitle(),
      subject: getTitle(),
      creationDate: new Date(),
      author: getUser(),
      creator: getUser(),
    },
    defaultStyle,
    styles: styles(),
    pageMargins: centimeterToPoint<[number, number]>([3.5, 2.5]),
    header: {
      text: `${getTitle()} - ${new Date().toLocaleDateString(
        getLocale()
      )}\n${getHeaderText()}`,
      margin: centimeterToPoint<[number, number]>([3.5, 0.5]),
      opacity: 0.5,
    },
    content: removeEmpty([
      title(),
      toc,
      ...mapArrayAllowEmpty<ChildNode, Content>(
        Array.from(displayEl.childNodes),
        mapDomToPdfContent
      ),
      sources(),
      imgCount !== 0 ? lof : [],
    ]),
    footer: (currentPage, pageCount) => ({
      text: `${currentPage}/${pageCount}`,
      alignment: "right",
      margin: [40, 20],
      opacity: 0.5,
    }),
    compress: true,
    pageSize: "A4",
    pageOrientation: "portrait",
    images: {},
    permissions: {
      annotating: true,
      contentAccessibility: true,
      documentAssembly: true,
      copying: true,
      modifying: false,
    },
  };

  return docDefinition;
};

const createPdf = () => {
  sourcesJump.clear();
  imgCount = 0;
  return pdfmakeCreatePdf(createDocDefinition(), undefined, fonts);
};

export enum pdfOutput {
  print,
  download,
  open,
  render,
}
listenForMessage(service.createPdf, (output) => {
  switch (output) {
    case pdfOutput.print:
      createPdf().print();
      break;
    case pdfOutput.download:
      createPdf().download(getTitle() + ".pdf");
      break;
    case pdfOutput.open:
      createPdf().open();
      break;
    case pdfOutput.render:
      createPdf().getDataUrl((dataUrl) => {
        previewPdf(dataUrl);
      });
      break;
  }
});

document.body.addEventListener(
  "contextmenu",
  (ev) => {
    ev.preventDefault();

    sendMessage(service.context, {
      ev,
      options: [
        {
          label: getText(textId.export_pdf),
          action: () => {
            sendMessage(service.createPdf, pdfOutput.open);
          },
        },
        {
          label: getText(textId.download_pdf),
          action: () => {
            sendMessage(service.createPdf, pdfOutput.download);
          },
        },
        {
          label: getText(textId.print),
          action: () => {
            sendMessage(service.createPdf, pdfOutput.print);
          },
        },
      ],
    });
  },
  {
    passive: false,
    capture: true,
  }
);
