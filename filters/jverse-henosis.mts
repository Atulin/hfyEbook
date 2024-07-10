export function apply(params: Params, next: () => void) {
	params.chap.dom("p").last().remove();
	next();
}
