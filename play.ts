function decode_cr(cr: string) {
	const ishex = cr[2] === "x";

	return String.fromCodePoint(
		Number.parseInt(cr.substr(ishex ? 3 : 2, cr.length - 2), ishex ? 16 : 10),
	);
}

function decode_crs(s: string) {
	let i = -1;
	let ls = s;

	while ((i = ls.search(/&#.*;/)) > -1) {
		console.log(`ls: ${ls}`);
		console.log(`i: ${i}`);
		const ni = ls.indexOf(";", i);
		console.log(`ni: ${ni}`);

		ls =
			ls.substr(0, i) + decode_cr(ls.substr(i, ni - i + 1)) + ls.substr(ni + 1);
	}

	return ls;
}

const s = "123456789";
const [a, b] = [2, 4];
console.log(s.substr(a), s.slice(a));

// console.log(decode_crs("abcdefghijkl&#nbsp;mnopqrstuvw"));
