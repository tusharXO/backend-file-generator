export function toVariableName(name:string): string{
    return name.charAt(0).toLowerCase() + name.slice(1)
}

export function toPluralName(name:string): string{
    return `${name}s`
}