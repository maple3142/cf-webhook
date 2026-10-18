export function arrayBufferToString(buf: ArrayBuffer | Uint8Array): string {
	return (buf instanceof Uint8Array ? buf : new Uint8Array(buf)).toBase64();
}
export async function getRequsetBody(request: Request): Promise<string> {
	return arrayBufferToString(await request.arrayBuffer());
}
