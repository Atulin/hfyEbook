export function apply(params: Params, next: () => void) {
	const chap = params.chap;
	const $ = chap.dom;
	const ps = $("p");
	const rem = [];

	if (chap.title === "Monkeys Reaches Stars") {
		ps.each((i, e) => {
			const p = $(e);

			if (p.text() === "&amp;nbsp") rem.push(p);
		});
	}

	const lp = $(ps[ps.length - 1]);

	if (lp.text().match(/^Part \w+$/)) rem.push(lp);

	params.purge(rem);
	next();
}
