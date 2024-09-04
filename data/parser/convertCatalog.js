import { parse } from "csv-parse/sync";
import fs from "fs";
import path from "path";
import { cwd } from "process";

console.log("Downloading master catalog..");
const data = await fetch(
    "https://raw.githubusercontent.com/MobilityData/gbfs/master/systems.csv"
);
const text = await data.text();

// Initialize the parser
const records = parse(text, { columns: true });
fs.writeFileSync(path.join(cwd(), "catalog.json"), JSON.stringify(records));
