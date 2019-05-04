// Comme en ActionScript...

class Endian {
    static LITTLE_ENDIAN = false;
    static BIG_ENDIAN = true;
}
class ByteArray {
    view: DataView;
    array: Uint8Array;
    public position = 0;
    public endian: boolean = Endian.LITTLE_ENDIAN;
    constructor() {
        this.array = new Uint8Array();
        this.view = new DataView(this.array.buffer);
    }
    /**
     * Modifie la taille du ByteArray
     * Conserve sa position si rallongé  
     * Remis à zéro si réduit
     * @param newLen nouvelle taille
     */
    autoSize(newLen: number) {
        if (newLen < 0) newLen = 0;
        let l = this.array.byteLength;
        if (l == newLen) return;
        if (newLen < l) this.position = 0;
        let newArray = new Uint8Array(newLen);
        newArray.set(this.array);
        this.setTo(newArray);
    }
    /**
     * Définit le contenu du ByteArray
     * @param data Objet à récupérer
     */
    setTo(data: ArrayBuffer) {
        this.array = new Uint8Array(data);
        this.view = new DataView(this.array.buffer);
    }
    /**
     * Ouvre un fichier et en stocke le contenu
     * @param file fichier à ouvrir
     * @param callback réaction en fin de lecture
     */
    readFile(file: File, callback: (b: ByteArray) => void) {
        const reader = new FileReader();
        reader.addEventListener("loadend", (e) => {
            this.position = 0;
            this.setTo(reader.result as ArrayBuffer);
            callback(this);
        })
        reader.readAsArrayBuffer(file);
    }
    /**
     * Charge un fichier local ou distant qui remplira ce ByteArray
     * @param url  Adresse du fichier à lire
     * @param callback réaction en fin de chargement
     */
    loadUrl(url: string, callback: (b: ByteArray) => void) {
        const loader = new XMLHttpRequest();
        loader.onload = (e) => {
            this.position = 0;
            this.setTo(loader.response);
            callback(this);
        }
        loader.onerror = (e) => {
            console.log("Byte Array ----------- Erreur de chargement ", e);
        }
        loader.responseType = "arraybuffer";
        loader.open("POST", url);
    }
    /**
     * Crée un fichier local enregistré par l'utilisateur
     * @param newName nom du fichier à sauvegarder
     */
    saveAs(newName: string) {
        let blob: Blob = new Blob([this.array], { type: "application/octet-stream" });
        let a = window.document.createElement('a');
        const url = window.URL.createObjectURL(blob);
        a.href = url;
        a.download = newName;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        }, 0);
    }
    get bytesAvailable(): number {
        return this.array.byteLength - this.position;
    }
    get length() {
        return this.array.byteLength;
    }
    set length(value: number) {
        this.autoSize(value);
    }
    checkNext(len: number, resize: boolean) {
        if (this.position + len <= this.array.byteLength) return;
        if (resize) {
            this.length = this.position + len;
        } else {
            throw new RangeError("End of byteArray !");
        }
    }
    read(len: number = 0): ArrayBuffer {
        if (len == 0) len = this.array.byteLength - this.position;
        const value = this.array.buffer.slice(this.position, this.position + len);
        this.position += len;
        return value;
    }
    readBytes(target: ByteArray, offset: number = 0, len = 0) {
        target.position = offset;
        if (len == 0) len = this.array.byteLength - this.position;
        let end = offset + len;
        target.checkNext(end, true);
        target.array.set(this.array.slice(this.position, this.position + len), offset);
        this.position += len;
    }
    readBoolean(): boolean {
        this.checkNext(1, false);
        const value = this.view.getUint8(this.position) == 1;
        this.position++;
        return value;
    }
    readUnsignedByte(): number {
        this.checkNext(1, false);
        const value = this.view.getUint8(this.position);
        this.position++;
        return value;
    }
    readByte(): number {
        this.checkNext(1, false);
        const value = this.view.getInt8(this.position);
        this.position++;
        return value;
    }
    readUnsignedShort(): number {
        this.checkNext(2, false);
        const value = this.view.getInt16(this.position, this.endian);
        this.position += 2;
        return value;
    }
    readShort(): number {
        this.checkNext(2, false);
        const value = this.view.getInt16(this.position, this.endian);
        this.position += 2;
        return value;
    }
    readUnsignedInt(): number {
        this.checkNext(4, false);
        const value = this.view.getUint32(this.position, this.endian);
        this.position += 4;
        return value;
    }
    readInt(): number {
        this.checkNext(4, false);
        const value = this.view.getInt32(this.position, this.endian);
        this.position += 4;
        return value;
    }
    readFloat(): number {
        this.checkNext(4, false);
        const value = this.view.getFloat32(this.position, this.endian);
        this.position += 4;
        return value;
    }
    readDouble(): number {
        this.checkNext(8, false);
        const value = this.view.getFloat64(this.position, this.endian);
        this.position += 8;
        return value;
    }
    readObject(): Object {
        let str = this.readUTF();
        return JSON.parse(str);
    }
    readUTF(): string {
        let length = this.readUnsignedShort();
        return this.readUTFBytes(length);
    }
    readUTFBytes(length: number): string {
        this.checkNext(length, false);
        const value = new TextDecoder().decode(this.array.slice(this.position, this.position + length));
        this.position += length;
        return value;
    }
    writeBoolean(value: boolean) {
        this.checkNext(1, true);
        this.view.setUint8(this.position, value ? 1 : 0);
        this.position++;
    }
    writeUnsignedByte(value: number): void {
        this.checkNext(1, true);
        this.view.setUint8(this.position, value);
        this.position++;
    }
    writeByte(value: number): void {
        this.checkNext(1, true);
        this.view.setInt8(this.position, value);
        this.position++;
    }
    writeUnsignedShort(value: number): void {
        this.checkNext(2, true);
        this.view.setInt16(this.position, value, this.endian);
        this.position += 2;
    }
    writeShort(value: number): void {
        this.checkNext(2, true);
        this.view.setInt16(this.position, value, this.endian);
        this.position += 2;
    }
    writeUnsignedInt(value: number): void {
        this.checkNext(4, true);
        this.view.setUint32(this.position, value, this.endian);
        this.position += 4;
    }
    writeInt(value: number): void {
        this.checkNext(4, true);
        this.view.setInt32(this.position, value, this.endian);
        this.position += 4;
    }
    writeFloat(value: number): void {
        this.checkNext(4, true);
        this.view.setFloat32(this.position, value, this.endian);
        this.position += 4;
    }
    writeDouble(value: number): void {
        this.checkNext(8, true);
        this.view.setFloat64(this.position, value, this.endian);
        this.position += 8;
    }
    writeObject(value: Object): void {
        let val = JSON.stringify(value);
        this.writeUTF(val);
    }
    writeUTF(value: string): void {
        this.writeUnsignedShort(value.length);
        this.writeUTFBytes(value);
    }
    writeUTFBytes(value: string): void {
        const t = new TextEncoder().encode(value);
        this.checkNext(t.length, true);
        this.array.set(t, this.position);
        this.position += t.length;
    }
}



