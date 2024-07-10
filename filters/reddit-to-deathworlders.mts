/*
 * In stead of trying to manually fix all the urls, I will be following the redirect.
 * Find the redirect.
 *
 */

export function apply(params: Params, next: () => void) {
	console.log(params);
	const $ = params.chap.dom;

	let out_links = $("a:contains('NOW CLICK HERE TO READ')");
	if (out_links.length < 1) {
		out_links = $("a:contains('LINK')");
	}
	if (out_links.length > 0) {
		// We should follow the link.
		params.chap.src = out_links[0].attribs.href;
		next();
	} else {
		// This is an ordinary Reddit post!
		// Should crash?
		console.log("Error! Wrong filter applied!");
		next();
	}
}
