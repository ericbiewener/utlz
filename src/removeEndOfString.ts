export const removeEndOfString = (str: string, separator = '.') => {
  const idx = str.lastIndexOf(separator)
  return idx < 0 ? str : str.slice(0, idx)
}
