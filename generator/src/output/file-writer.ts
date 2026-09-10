import fs from "fs"
import path from "path";

export function writeGeneratedFile(
    filepath: string,
    content: string
): void{
    const directory = path.dirname(filepath)

    fs.mkdirSync(directory, {recursive: true})
    fs.writeFileSync(filepath, content, "utf-8")
}