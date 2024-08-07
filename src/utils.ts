export function arrayBufferToString(buf: ArrayBuffer): string {
	return new TextDecoder('iso-8859-1').decode(buf); // use this for best data preservation
}
export async function getRequsetBody(request: Request): Promise<string> {
	return arrayBufferToString(await request.arrayBuffer());
}
