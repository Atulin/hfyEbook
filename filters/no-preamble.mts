export function apply(params: Params, next: () => void) {
	const $ = params.chap.dom;
	const hrs = $("hr");

	if (hrs.length) {
		let pa = null;
		let len = 2500;

		if (params.chap["no-preamble-treshold"] !== undefined)
			len = params.chap["no-preamble-treshold"];
		else if (params.spec["no-preamble-treshold"] !== undefined)
			len = params.spec["no-preamble-treshold"];

		hrs.each((i, e) => {
			const c = $(e).prevAll();

			if (c.text().length <= len) pa = c;
		});

		if (pa) {
			const rem = [];

			for (let i = 0; i < pa.length; i++) rem.push($(pa[i]));

			params.purge(rem);
		}
	}

	next();
}
