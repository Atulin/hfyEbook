import ct from "chalk-template";

export const log = {
	/**
	 * Log a debug message, only if the DEBUG environment variable is set.
	 * @param msg The message to log.
	 */
	dbg: (msg: string) => {
		if (Bun.env.DEBUG) {
			console.log(ct`{bold.lightBlue DEBUG:} ${msg}`);
		}
	},

	/**
	 * Log an error message.
	 * @param msg The message to log.
	 */
	err: (msg: string) => {
		console.log(ct`{bold.red ERROR:} ${msg}`);
	},
};
