
function genUUID() {
	return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
		const r = (crypto.getRandomValues(new Uint8Array(1))[0] & 15) | (c === "y" ? 8 : 0);
		return r.toString(16);
	});
}

export default {
	genUUID
}
