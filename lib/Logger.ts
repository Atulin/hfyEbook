import ct from "chalk-template";

export const log = {
	dbg: (msg: string) => {
		if (Bun.env.DEBUG) {
			console.log(ct`{bold.lightBlue DEBUG:} ${msg}`);
		}
	},

	err: (msg: string) => {
		console.log(ct`{bold.red ERROR:} ${msg}`);
	},
};
