import * as XLSX from 'xlsx'
import pdfMake from 'pdfmake/build/pdfmake'
import pdfFonts from 'pdfmake/build/vfs_fonts'
import type { Content, TDocumentDefinitions } from 'pdfmake/interfaces'

interface PdfFontProvider {
  pdfMake?: {
    vfs: Record<string, string>
  }
  vfs?: Record<string, string>
}

const fontProvider = pdfFonts as unknown as PdfFontProvider
const vfs = fontProvider.vfs ?? fontProvider.pdfMake?.vfs
if (vfs) {
  ;(pdfMake as unknown as { vfs: Record<string, string> }).vfs = vfs
}

export interface ExportColumn<T> {
  header: string
  value: (item: T) => string | number
}

/**
 * Export tabular data to an Excel file.
 */
export function exportToExcel<T>(
  data: T[],
  columns: ExportColumn<T>[],
  sheetName: string,
  baseFileName: string,
): void {
  const rows = data.map(item => {
    return columns.reduce<Record<string, string | number>>((accumulator, column) => {
      accumulator[column.header] = column.value(item)
      return accumulator
    }, {})
  })

  const worksheet = XLSX.utils.json_to_sheet(rows)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
  XLSX.writeFile(workbook, `${baseFileName}-${getDateStamp()}.xlsx`)
}

/**
 * Export tabular data to a PDF file.
 */
export function exportToPdf<T>(
  data: T[],
  columns: ExportColumn<T>[],
  title: string,
  baseFileName: string,
): void {
  const tableBody: string[][] = [
    columns.map(column => column.header),
    ...data.map(item => columns.map(column => `${column.value(item)}`)),
  ]

  const content: Content[] = [
    { text: title, style: 'title' },
    {
      style: 'table',
      table: {
        headerRows: 1,
        widths: Array(columns.length).fill('*'),
        body: tableBody,
      },
      layout: 'lightHorizontalLines',
    },
  ]

  const document: TDocumentDefinitions = {
    content,
    pageOrientation: 'landscape',
    defaultStyle: {
      fontSize: 10,
    },
    styles: {
      title: {
        fontSize: 16,
        bold: true,
        margin: [0, 0, 0, 12],
      },
      table: {
        margin: [0, 8, 0, 0],
      },
    },
  }

  pdfMake.createPdf(document).download(`${baseFileName}-${getDateStamp()}.pdf`)
}

function getDateStamp(): string {
  const today = new Date()
  const year = today.getFullYear()
  const month = `${today.getMonth() + 1}`.padStart(2, '0')
  const day = `${today.getDate()}`.padStart(2, '0')
  return `${year}${month}${day}`
}
