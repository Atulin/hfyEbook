import fs from "node:fs";
import type { Params } from "../types/params.js";
import Cheerio = cheerio.Cheerio;
import { unescapeHtml } from "../lib/Cleaners.js";
import Root = cheerio.Root;
import { join } from "node:path";
import { log } from "../lib/Logger.js";
import type { FilterModule } from "../types/filter.js";

const output = Bun.env.OUTPUT ?? "output";

function l_esc(txt: string) {
	return txt
		.replace(/%/g, "\\%")
		.replace(/\$/g, "\\$")
		.replace(/#/g, "\\#")
		.replace(/_/g, "\\_")
		.replace(/\{/g, "\\{")
		.replace(/\}/g, "\\}")
		.replace(/&/g, "\\&");
}

function filter(p: Params, txt: string) {
	return l_esc(unescapeHtml(txt).replace(/—/g, " -- ").replace(/–/g, "--"))
		.replace(/’/g, "'")
		.replace(/\\([^%\$#_\{\}&])/gm, "{\\textbackslash}$1")
		.replace(/\\$/g, "{\\textbackslash}")
		.replace(/~/g, "{\\textasciitilde}")
		.replace(/\^/g, "{\\textasciicircum}")
		.replace(/…/g, "{\\ldots}");
}

function toLatex(p: Params, $: Root, e: Cheerio) {
	let latex = "";

	for (const el of e.contents()) {
		const elem = $(el);
		let l = "";

		// console.log(id + el.type);

		if (el.type === "text") {
			l += filter(p, el.data ?? "");
		} else if (el.type === "tag") {
			if (el.name === "em") {
				l += `\\textit{${toLatex(p, $, elem)}}`;
			} else if (el.name === "strong") {
				l += `\\textbf{${toLatex(p, $, elem)}}`;
			} else if (el.name === "pre" || el.name === "code") {
				l += `\\monosp{${toLatex(p, $, elem).replace(/\n/g, "\\\\*")}}`;
			} else if (el.name === "a") {
				l += `\\href{${l_esc(el.attribs.href)}}{${toLatex(p, $, elem)}}`;
			} else if (el.name === "p") {
				const t = toLatex(p, $, elem);

				if (elem.attr("class") === "center") {
					if (t === "⁂") {
						l += "\\asterism\n";
					} else {
						l += `\\begin{center}${t}\\end{center}`;
					}
				} else {
					l += t.replace(/\n\n?/g, "\n") + (t.indexOf("\\star") > -1 ? "" : "\n");
				}
			} else if (el.name === "blockquote") {
				l += `\\begin{displayquote}\n${toLatex(p, $, elem)}\n\\end{displayquote}`;
			} else if (el.name === "span") {
				l += toLatex(p, $, elem);
			} else if (el.name === "li") {
				l += `\\item ${toLatex(p, $, elem)}`;
			} else if (el.name === "ul") {
				l += `\\begin{itemize}${toLatex(p, $, elem)}\n\\end{itemize}`;
			} else if (el.name === "ol") {
				l += `\\begin{enumerate}${toLatex(p, $, elem)}\n\\end{enumerate}`;
			} else if (el.name === "br") {
				l += "\\\\*\n";
			} else if (el.name === "s" || el.name === "del" || el.name === "strike") {
				l += `\\sout{${toLatex(p, $, elem)}}`;
			} else if (el.name === "sup") {
				l += `\\textsuperscript{${toLatex(p, $, elem)}}`;
			} else {
				log.dbg(`LaTeX: Unhandled tag: ${el.name}`);
				l += toLatex(p, $, elem);
			}
		}

		latex += el.type !== "tag" || el.name !== "p" ? l.replace(/\n\n?/g, "\n") : l;
	}

	return latex;
}

export default {
	apply(params: Params, next: () => void) {
		const spec = params.spec;
		const oname = join(output, `${spec.filename}.tex`);
		const title = l_esc(spec.title);
		const creator = l_esc(spec.creator);
		const n_re = /\n/g;
		const d_str = new Date().toLocaleDateString("en-GB", {
			day: "numeric",
			month: "long",
			year: "numeric",
			hour: "numeric",
			minute: "numeric",
			timeZoneName: "short",
			timeZone: "UTC",
		});

		let latex = [
			"\\documentclass[a4paper,10pt]{article}",
			"",
			"\\usepackage{fontspec}",
			"\\usepackage[normalem]{ulem}",
			"\\usepackage{tocloft}",
			"\\usepackage{hyperref}",
			"\\usepackage{csquotes}",
			"\\usepackage{microtype}",
			"\\usepackage{needspace}",
			"\\usepackage{ifthen}",
			"",
			`\\title{\\textsc{${title.replace(n_re, "\\\\\n")}}}`,
			`\\author{\\textsc{By ${creator}}${
				spec.patreon
					? `\\\\ \\small{Donate securely to the author at \\href{${l_esc(spec.patreon)}}{Patreon}}`
					: ""
			}}`,
			"\\date{}",
			"",
			"\\hypersetup{",
			`  pdftitle = {${title.replace(n_re, " - ")}},`,
			`  pdfauthor = {${spec.creator}},`,
			"  pdfproducer = {EbookJS},",
			"  colorlinks = true,",
			"  linkcolor = [rgb]{0.09,0.15,0.588},",
			"  urlcolor = [rgb]{0.09,0.15,0.588},",
			"  pdfborder = {0 0 0}",
			"}",
			"",
			"\\setlength{\\parskip}{\\baselineskip}",
			"\\setlength{\\parindent}{0pt}",
			"\\linespread{1.2}",
			"\\raggedright",
			"\\defaultfontfeatures{Ligatures=TeX}",
			"\\setmainfont[",
			"	Path = ../templates/,",
			"	Extension = .otf,",
			"	Ligatures = TeX,",
			"	BoldFont = LinLibertine-RB,",
			"	ItalicFont = LinLibertine-RI,",
			"	BoldItalicFont = LinLibertine-RBI",
			"]{LinLibertine-R}",
			"\\setmonofont[",
			"	Path = ../templates/,",
			"	Scale = 0.85,",
			"	Extension = .ttf,",
			"	Ligatures = TeX,",
			"	BoldFont = LiberationMono-Bold,",
			"	ItalicFont = LiberationMono-Italic,",
			"	BoldItalicFont = LiberationMono-BoldItalic",
			"]{LiberationMono-Regular}",
			"",
			"\\def\\asterism{\\par\\begin{center}\\vspace{-1em}\\huge{$\\cdots$}\\end{center}}",
			"",
			"\\newcommand{\\monosp}[1]{\\texttt{{#1}}\\vspace{5mm}}",
			"\\renewcommand{\\cftsecfont}{\\normalfont}",
			"\\renewcommand{\\cftsecpagefont}{\\normalfont}",
			"\\renewcommand{\\cftsecpresnum}{\\begin{lrbox}{\\@tempboxa}}",
			"\\renewcommand{\\cftsecaftersnum}{\\end{lrbox}}",
			"\\renewcommand{\\cftsecleader}{\\cftdotfill{\\cftdotsep}}",
			"\\renewcommand{\\contentsname}{\\textsc{Contents}\\linebreak}",
			"\\setcounter{secnumdepth}{-2}",
			"",
			"\\begin{document}",
			"\\pagestyle{plain}",
			"",
			"\\addcontentsline{toc}{section}{\\protect{\\textsc{Title}}}",
			"\\sectionmark{Title}",
			"\\maketitle",
			"\\thispagestyle{empty}",
			"\\vfill",
			`\\begin{center}\\textsc{Automatically typeset in\\\\Linux Libertine and Liberation Mono\\\\Using EbookJS on ${d_str}}\\end{center}`,
			"",
			"\\clearpage",
			"\\pagenumbering{Roman}",
			"\\tableofcontents",
			"",
			"\\clearpage",
			"\\newcounter{storedpage}",
			"\\setcounter{storedpage}{\\value{page}}",
			"\\pagenumbering{arabic}",
			"\\setcounter{page}{\\value{storedpage}}",
		].join("\n");

		console.log(`Building ${oname}`);

		for (let i = 0; i < spec.contents.length; i++) {
			const chap = spec.contents[i];
			const c_title = l_esc(chap.title);

			latex += `\n\\clearpage\n\\section{\\textsc{${c_title}}}\n`;

			if (chap.byline) {
				latex += `\\vspace{-2em}\\textsc{By ${l_esc(chap.byline)}}\\vspace{1em}\\\\*\n`;
			}

			latex += toLatex(params, chap.dom, chap.dom.root());
		}

		latex += "\\end{document}";

		fs.writeFileSync(oname, latex, "utf-8");
		next();
	},
} satisfies FilterModule as FilterModule;
