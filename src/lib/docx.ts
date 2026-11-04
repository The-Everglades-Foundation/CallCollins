import { strToU8, zipSync } from "fflate";

export type RemarksDocument = {
  point: string;
  audience: string;
  occasion: string;
  kind: string;
  body: string;
};

const KIND_LINE: Record<string, string> = {
  shorter: "Shorter version",
  boardroom: "Boardroom version",
  talking_points: "Talking points",
};

export function remarksFilename(point: string): string {
  const slug = point
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return `${slug || "remarks"}.docx`;
}

export function remarksDocx(input: RemarksDocument): Uint8Array {
  return zipSync({
    "[Content_Types].xml": strToU8(CONTENT_TYPES),
    "_rels/.rels": strToU8(PACKAGE_RELS),
    "word/document.xml": strToU8(documentXml(input)),
    "word/styles.xml": strToU8(STYLES),
    "word/_rels/document.xml.rels": strToU8(DOCUMENT_RELS),
  });
}

function documentXml(input: RemarksDocument): string {
  const kind = KIND_LINE[input.kind];
  const blocks = [
    paragraph("Everglades Foundation", { size: 18, bold: true, color: "234237", after: 40 }),
    paragraph(input.point, { size: 36, bold: true, after: 80 }),
    paragraph(`${input.audience} · ${input.occasion}`, { size: 20, italic: true, color: "6F675E", after: kind ? 40 : 280 }),
  ];
  if (kind) blocks.push(paragraph(kind, { size: 20, italic: true, color: "6F675E", after: 280 }));
  for (const part of speechParagraphs(input.body)) {
    blocks.push(paragraph(part, { size: 24, after: 200 }));
  }
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <w:body>
    ${blocks.join("\n    ")}
    <w:sectPr>
      <w:pgSz w:w="12240" w:h="15840"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="720" w:footer="720" w:gutter="0"/>
    </w:sectPr>
  </w:body>
</w:document>`;
}

function speechParagraphs(body: string): string[] {
  const parts = body
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((part) => part.replace(/^\n+|\n+$/g, ""))
    .filter((part) => part.trim().length > 0);
  return parts.length > 0 ? parts : [""];
}

type RunStyle = {
  size?: number;
  bold?: boolean;
  italic?: boolean;
  color?: string;
  after?: number;
};

function paragraph(text: string, style: RunStyle): string {
  const lines = text.split("\n");
  const runs = lines
    .map((line, index) => {
      const br = index === 0 ? "" : "<w:br/>";
      return `${br}<w:r><w:rPr>${runProps(style)}</w:rPr><w:t xml:space="preserve">${xmlText(line)}</w:t></w:r>`;
    })
    .join("");
  return `<w:p><w:pPr><w:spacing w:after="${style.after ?? 160}" w:line="276" w:lineRule="auto"/></w:pPr>${runs}</w:p>`;
}

function runProps(style: RunStyle): string {
  const size = style.size ?? 24;
  return [
    `<w:rFonts w:ascii="Georgia" w:hAnsi="Georgia" w:cs="Georgia"/>`,
    `<w:sz w:val="${size}"/><w:szCs w:val="${size}"/>`,
    style.bold ? "<w:b/><w:bCs/>" : "",
    style.italic ? "<w:i/><w:iCs/>" : "",
    style.color ? `<w:color w:val="${style.color}"/>` : "",
  ].join("");
}

function xmlText(value: string): string {
  return value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

const CONTENT_TYPES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>`;

const PACKAGE_RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

const DOCUMENT_RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;

const STYLES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:docDefaults>
    <w:rPrDefault>
      <w:rPr>
        <w:rFonts w:ascii="Georgia" w:hAnsi="Georgia" w:cs="Georgia"/>
        <w:sz w:val="24"/>
        <w:szCs w:val="24"/>
      </w:rPr>
    </w:rPrDefault>
    <w:pPrDefault>
      <w:pPr>
        <w:spacing w:after="160" w:line="276" w:lineRule="auto"/>
      </w:pPr>
    </w:pPrDefault>
  </w:docDefaults>
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal">
    <w:name w:val="Normal"/>
    <w:qFormat/>
  </w:style>
</w:styles>`;
