declare module "bun" {
	interface Env {
		OUTPUT: string | undefined;
		DEBUG: boolean | undefined;
	}
}
