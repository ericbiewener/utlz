let clipboardText = ''

const copyHandler = (e: ClipboardEvent) => {
  e.preventDefault()
  e.clipboardData.setData('text/plain', clipboardText)
}

export const copyToClipboard = (text: string) => {
  clipboardText = text
  document.addEventListener('copy', copyHandler)
  document.execCommand('copy')
  document.removeEventListener('copy', copyHandler)
}
