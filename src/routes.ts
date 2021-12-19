import { Request, Response, Router, text } from 'express'
import { TableCell, TDocumentDefinitions } from 'pdfmake/interfaces'
import { prismaClient } from './database/prismaClient'
import fs from 'fs'
import PdfPrinter from 'pdfmake'

const routes = Router()

routes.get('/products', async (req: Request, res: Response) => {
  const proucts = await prismaClient.products.findMany()
  return res.json(proucts)
})

routes.get('/products/report', async (req: Request, res: Response) => {
  const proucts = await prismaClient.products.findMany()

  const fonts = {
    Helvetica: {
      normal: 'Helvetica',
      bold: 'Helvetica-Bold',
      italics: 'Helvetica-Oblique',
      bolditalics: 'Helvetica-BoldOblique',
    },
  }
  const printer = new PdfPrinter(fonts)

  const body = []

  const columns = [
    { text: 'Relatório de Produtos', style: 'header' },
    {
      text: `${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}\n\n`,
      style: 'header',
    },
  ]

  const columnsTitle: TableCell[] = [
    { text: 'id', style: 'id' },
    { text: 'description', style: 'columnTitle' },
    { text: 'quantity', style: 'columnTitle' },
    { text: 'price', style: 'columnTitle' },
  ]

  body.push(columnsTitle)

  for (let p of proucts) {
    const rows = new Array()
    rows.push(p.id)
    rows.push(p.description)
    rows.push(p.quantity)
    rows.push(`R$ ${p.price}`)
    body.push(rows)
  }

  const docDefinitions: TDocumentDefinitions = {
    defaultStyle: { font: 'Helvetica' },
    content: [
      { columns },
      {
        table: {
          heights(r) {
            if (!r) return 20
            return 30
          },
          widths: [250, 'auto', 'auto', 50],
          body,
        },
      },
    ],
    styles: {
      header: {
        fontSize: 18,
        bold: true,
        alignment: 'left',
      },
      columnTitle: {
        fontSize: 13,
        bold: true,
        fillColor: '#7159c1',
        color: '#FFF',
        alignment: 'center',
        margin: 5,
      },
      id: {
        fontSize: 13,
        bold: true,
        color: '#FFF',
        alignment: 'center',
        margin: 5,
        fillColor: '#999',
      },
    },
  }

  const pdfDoc = printer.createPdfKitDocument(docDefinitions)

  // pdfDoc.pipe(fs.createWriteStream("report.pdf"))

  const chuncks: Uint8Array[] = []

  pdfDoc.on('data', (chunck) => {
    chuncks.push(chunck)
  })

  pdfDoc.end()

  pdfDoc.on('end', () => {
    const result = Buffer.concat(chuncks)
    res.end(result)
  })
})

export { routes }
