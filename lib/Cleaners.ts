import chalk from "chalk";
import Cheerio = cheerio.Cheerio;

export const decodeCr = (cr: string) => {
	const isHex = cr[2] === "x";

	const start = isHex ? 3 : 2;
	const end = cr.length - 2;
	return String.fromCodePoint(Number.parseInt(cr.slice(start, end + start), isHex ? 16 : 10));
};

/// Decode all HTML character references to unicode.
export const decodeCrs = (s: string) => {
	let ls = s;
	let i = ls.search(/&#.*;/);

	while (i > -1) {
		const ni = ls.indexOf(";", i);
		ls = ls.slice(0, i) + decodeCr(ls.slice(i, ni + 1)) + ls.slice(ni + 1);

		i = ls.search(/&#.*;/);
	}

	return ls;
};

export const unescapeHtml = (html: string) => {
	return decodeCrs(html.replace(/&amp;/g, "&"))
		.replace(/&quot;/g, '"')
		.replace(/&apos;/g, "'")
		.replace(/&nbsp;/g, " ")
		.replace(/&#39;/g, "'")
		.replace(/&amp;#39;/g, "'")
		.replace(/&amp;/g, "&");
};

export const purge = (set: Cheerio[]) => {
	for (let i = 0; i < set.length; i++) {
		const e = set[i];

		if (Bun.env.DEBUG) {
			console.log(`${chalk.red("Delete")}: [${e.text()}]`);
		}

		e.remove();
	}
};
