// ===============================
// IMPORTADOR ULTRA RAPIDO PRO
// ===============================

// Librerías necesarias
// PapaParse -> CSV
// XLSX -> Excel
// IndexedDB -> Base de datos ultra rápida

class UltraDB {

    constructor() {
        this.dbName = "OandJDatabase";
        this.storeName = "registros";
        this.db = null;
    }

    async init() {

        return new Promise((resolve, reject) => {

            const request = indexedDB.open(this.dbName, 1);

            request.onupgradeneeded = (event) => {

                const db = event.target.result;

                if (!db.objectStoreNames.contains(this.storeName)) {

                    db.createObjectStore(this.storeName, {
                        keyPath: "id",
                        autoIncrement: true
                    });

                }

            };

            request.onsuccess = (event) => {

                this.db = event.target.result;
                resolve();

            };

            request.onerror = reject;

        });

    }

    async bulkInsert(data) {

        return new Promise((resolve, reject) => {

            const tx = this.db.transaction(this.storeName, "readwrite");
            const store = tx.objectStore(this.storeName);

            data.forEach(item => store.add(item));

            tx.oncomplete = resolve;
            tx.onerror = reject;

        });

    }

    async getAll() {

        return new Promise((resolve, reject) => {

            const tx = this.db.transaction(this.storeName, "readonly");
            const store = tx.objectStore(this.storeName);

            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = reject;

        });

    }

}

const ultraDB = new UltraDB();


// ===============================
// NORMALIZACIÓN DE DATOS
// ===============================

function normalizeValue(value) {

    if (typeof value !== "string") return value;

    value = value.trim();

    // corregir numeros con coma
    if (value.match(/^\d+,\d+$/)) {

        return parseFloat(value.replace(",", "."));

    }

    // corregir fechas
    const date = new Date(value);

    if (!isNaN(date)) {

        return date.toISOString();

    }

    return value;

}


// ===============================
// DETECTOR DE COLUMNAS
// ===============================

function detectColumns(row) {

    const columns = {};

    Object.keys(row).forEach(key => {

        const normalized = key.toLowerCase();

        if (normalized.includes("fecha")) columns.fecha = key;
        if (normalized.includes("date")) columns.fecha = key;

        if (normalized.includes("nombre")) columns.nombre = key;
        if (normalized.includes("name")) columns.nombre = key;

        if (normalized.includes("precio")) columns.precio = key;
        if (normalized.includes("price")) columns.precio = key;

    });

    return columns;

}


// ===============================
// IMPORTAR CSV
// ===============================

async function importCSV(file) {

    return new Promise(resolve => {

        Papa.parse(file, {

            header: true,
            skipEmptyLines: true,

            complete: async function(results) {

                const data = results.data.map(row => {

                    const clean = {};

                    Object.keys(row).forEach(k => {

                        clean[k] = normalizeValue(row[k]);

                    });

                    return clean;

                });

                await ultraDB.bulkInsert(data);

                resolve(data.length);

            }

        });

    });

}


// ===============================
// IMPORTAR EXCEL
// ===============================

async function importExcel(file) {

    const data = await file.arrayBuffer();

    const workbook = XLSX.read(data);

    const sheet = workbook.Sheets[workbook.SheetNames[0]];

    const json = XLSX.utils.sheet_to_json(sheet);

    const cleaned = json.map(row => {

        const clean = {};

        Object.keys(row).forEach(k => {

            clean[k] = normalizeValue(row[k]);

        });

        return clean;

    });

    await ultraDB.bulkInsert(cleaned);

    return cleaned.length;

}


// ===============================
// IMPORTAR JSON
// ===============================

async function importJSON(file) {

    const text = await file.text();

    const json = JSON.parse(text);

    const cleaned = json.map(row => {

        const clean = {};

        Object.keys(row).forEach(k => {

            clean[k] = normalizeValue(row[k]);

        });

        return clean;

    });

    await ultraDB.bulkInsert(cleaned);

    return cleaned.length;

}


// ===============================
// IMPORTADOR AUTOMATICO
// ===============================

async function ultraImport(file) {

    await ultraDB.init();

    const name = file.name.toLowerCase();

    if (name.endsWith(".csv")) {

        return importCSV(file);

    }

    if (name.endsWith(".xlsx") || name.endsWith(".xls")) {

        return importExcel(file);

    }

    if (name.endsWith(".json")) {

        return importJSON(file);

    }

    throw new Error("Formato no soportado");

}


// ===============================
// BACKUP AUTOMATICO
// ===============================

async function exportBackup() {

    const data = await ultraDB.getAll();

    const blob = new Blob(
        [JSON.stringify(data, null, 2)],
        { type: "application/json" }
    );

    const a = document.createElement("a");

    a.href = URL.createObjectURL(blob);

    a.download = "backup_oandj.json";

    a.click();

}


// backup automático cada 5 minutos

setInterval(exportBackup, 300000);
