import type { OutputBlockData } from "@editorjs/editorjs";
import type { Content } from "pdfmake/interfaces";
import type { ITableOfContentsData } from "../../ui/TableOfContents";
import { IExportHelper, wrapEmoji } from "./ExportHelper";

export class ExportTableOfContents
  implements IExportHelper<ITableOfContentsData>
{
  fulfillsSchema(
    block: OutputBlockData<string, ITableOfContentsData>
  ): boolean {
    return block.type === "toc";
  }

  parse(block: OutputBlockData<"toc", ITableOfContentsData>): Content {
    return {
      toc: {
        title: {
          text: wrapEmoji(block.data.title),
          style: "header1",
        },
        id: "toc",
      },
      pageBreak: "after",
    };
  }
}
