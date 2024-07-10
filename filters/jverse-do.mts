export function apply(params: Params, next: () => void) {
	const chap = params.chap;
	const $ = chap.dom;
	const ps = $("p");
	const rem = [];

	// Remove chapter links
	$("p a").each((i, e) => {
		const el = $(e);

		if (
			el.text() === "Previous" ||
			el.text() === "Next" ||
			el.text().indexOf("Chapter") === 0
		)
			rem.push(el);

		if (el.prev().name === "hr") rem.push($(el.prev()));
	});

	// Remove chapter headings
	$("p").each((i, e) => {
		const el = $(e);

		if (el.text()[0] === "#") rem.push(el);
	});

	params.purge(rem);
	next();
}
